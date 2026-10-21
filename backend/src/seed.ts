import { createDatabase } from './repositories/client.js';
import { seedAdmin } from './services/seed-admin.js';
import { AppError } from './utils/errors.js';

const db = createDatabase();
try {
  const result = await seedAdmin(db, {
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  console.log(
    result.created
      ? 'Administrator created.'
      : 'Administrator already exists; credentials were not changed.',
  );
} catch (error) {
  console.error(
    error instanceof AppError
      ? error.message
      : 'Unable to seed administrator. Check ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD and database migrations.',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
