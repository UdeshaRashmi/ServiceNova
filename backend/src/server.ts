import { createApp } from './app.js';
import { readConfig } from './config.js';
import { createDatabase } from './repositories/client.js';
import { PrismaRepository } from './repositories/prisma.js';
import { AppError } from './utils/errors.js';

let database: ReturnType<typeof createDatabase> | undefined;
try {
  const config = readConfig();
  database = createDatabase();
  const repository = new PrismaRepository(database);
  await repository.ready();
  const db = database;
  const server = createApp(repository, config).listen(config.port, () => {
    console.log(`ServiceNova API listening on http://localhost:${config.port}`);
  });
  server.on('error', async () => {
    console.error('Unable to start API listener. Check PORT and permissions.');
    await db.$disconnect();
    process.exitCode = 1;
  });
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.close(async () => {
      await db.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(
    error instanceof AppError
      ? error.message
      : 'Unable to start API. Check backend/.env, database location and migrations.',
  );
  await database?.$disconnect();
  process.exitCode = 1;
}
