import type { Repository } from '../repositories/repository.js';
import type { Config } from '../config.js';
import { AppError } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../utils/passwords.js';
import jwt from 'jsonwebtoken';
import { publicUser, type UserRecord } from '../types/domain.js';

const issuer = 'servicenova';
const audience = 'servicenova-web';
export class AuthService {
  constructor(
    private readonly repository: Repository,
    private readonly config: Config,
  ) {}
  async register(input: { name: string; email: string; password: string }) {
    if (await this.repository.findUserByEmail(input.email))
      throw new AppError(
        409,
        'EMAIL_EXISTS',
        'An account with that email already exists.',
      );
    const user = await this.repository.createUser({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'USER',
    });
    return { user: publicUser(user), token: this.issueToken(user) };
  }
  async login(input: { email: string; password: string }) {
    const user = await this.repository.findUserByEmail(input.email);
    // Execute equivalent bcrypt work for missing accounts to reduce timing leaks.
    const valid = user
      ? await verifyPassword(input.password, user.passwordHash)
      : (await hashPassword(input.password), false);
    if (!user || !valid)
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect.',
      );
    return { user: publicUser(user), token: this.issueToken(user) };
  }
  issueToken(user: UserRecord) {
    return jwt.sign({ version: user.sessionVersion }, this.config.jwtSecret, {
      algorithm: 'HS256',
      subject: user.id,
      issuer,
      audience,
      expiresIn: this.config.sessionTtlSeconds,
    });
  }
  async authenticate(token?: string) {
    if (!token || token.length > 4096)
      throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
    let claims: jwt.JwtPayload;
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256'],
        issuer,
        audience,
        maxAge: this.config.sessionTtlSeconds,
      });
      if (
        typeof decoded === 'string' ||
        typeof decoded.sub !== 'string' ||
        !Number.isInteger(decoded.version) ||
        typeof decoded.exp !== 'number'
      )
        throw new Error('Invalid claims');
      claims = decoded;
    } catch {
      throw new AppError(
        401,
        'SESSION_EXPIRED',
        'Your session has expired. Please sign in again.',
      );
    }
    // Load the role from storage on every call, never from client input/JWT roles.
    const user = await this.repository.findUserById(claims.sub!);
    if (!user || user.sessionVersion !== claims.version)
      throw new AppError(
        401,
        'SESSION_EXPIRED',
        'Your session has expired. Please sign in again.',
      );
    return publicUser(user);
  }
  logout(userId: string) {
    return this.repository.invalidateSessions(userId);
  }
}
