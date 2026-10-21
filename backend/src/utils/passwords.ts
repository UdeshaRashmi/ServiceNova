import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

// Prehash prevents bcrypt's 72-byte truncation for long and Unicode passwords.
// The base64 SHA-256 output is 44 ASCII bytes. Passwords are never normalized.
const prehash = (password: string) =>
  createHash('sha256')
    .update('ServiceNova:password:v1\0')
    .update(password, 'utf8')
    .digest('base64');
export const hashPassword = (password: string) =>
  bcrypt.hash(prehash(password), 12);
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(prehash(password), hash);
