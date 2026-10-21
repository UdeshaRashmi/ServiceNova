import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.js';
import { databaseUrl } from '../utils/database.js';

export function createDatabase(url = databaseUrl()) {
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url }),
    log: [],
  });
}
