import { createApp } from '../../app.js';
import { readConfig } from '../../config.js';
import { PrismaRepository } from '../../repositories/prisma.js';
import { seedAdmin } from '../../services/seed-admin.js';
import { testDatabase } from './test-database.js';

// This process creates its OWN migrated temporary database, never backend/.env.
const database = await testDatabase();
const config = readConfig({
  NODE_ENV: 'test',
  PORT: '3010',
  JWT_SECRET: 'e2e-only-session-secret-not-for-production-use',
  FRONTEND_ORIGINS: 'http://127.0.0.1:5174',
});
try {
  await seedAdmin(database.db, {
    name: 'Browser Test Admin',
    email: 'admin.e2e@example.com',
    password: 'browser-test-admin-password',
  });
  const server = createApp(new PrismaRepository(database.db), config).listen(
    config.port,
    '127.0.0.1',
    () => console.log('Isolated browser-test API ready.'),
  );
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    server.close(async () => {
      await database.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  server.on('error', async () => {
    await database.close();
    process.exit(1);
  });
} catch {
  await database.close();
  throw new Error('Unable to start isolated browser-test API.');
}
