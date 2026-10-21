import { resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve relative SQLite paths against backend/, even when launched elsewhere.
// This module lives in src/utils and dist/utils at the same directory depth.
const backendDirectory = fileURLToPath(new URL('../../', import.meta.url));
export function databaseUrl(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV === 'production' && !env.DATABASE_URL)
    throw new Error('DATABASE_URL is required in production.');
  const value = env.DATABASE_URL || 'file:./prisma/dev.db';
  if (
    !value.startsWith('file:') ||
    !value.slice(5) ||
    value.includes('?') ||
    value.includes('#') ||
    value === 'file::memory:'
  ) {
    throw new Error(
      'DATABASE_URL must be a local SQLite file URL without query parameters.',
    );
  }
  const path = value.slice(5);
  return `file:${(isAbsolute(path) ? path : resolve(backendDirectory, path)).replaceAll('\\', '/')}`;
}
