import type { Repository } from '../repositories/repository.js';
import type { PageQuery, PublicUser } from '../types/domain.js';
import { AppError } from '../utils/errors.js';

export class UserService {
  constructor(private readonly repository: Repository) {}
  private authorize(actor: PublicUser) {
    if (actor.role !== 'ADMIN')
      throw new AppError(403, 'FORBIDDEN', 'Administrator access is required.');
  }
  list(actor: PublicUser, query: PageQuery) {
    this.authorize(actor);
    return this.repository.listUsers(query);
  }
  async get(actor: PublicUser, id: string) {
    this.authorize(actor);
    const user = await this.repository.getUserDetail(id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    return user;
  }
  async update(actor: PublicUser, id: string, name: string) {
    this.authorize(actor);
    const user = await this.repository.updateUserName(id, name);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    return user;
  }
}
