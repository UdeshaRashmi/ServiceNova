import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createDatabase } from '../../repositories/client.js';

export async function testDatabase() {
  const directory = await mkdtemp(join(tmpdir(), 'servicenova-test-'));
  const url = `file:${join(directory, 'test.db').replaceAll('\\', '/')}`;
  const backendDirectory = fileURLToPath(new URL('../../../', import.meta.url));
  const migration = spawnSync(
    process.execPath,
    [join(backendDirectory, 'scripts/prisma.mjs'), 'migrate', 'deploy'],
    {
      cwd: backendDirectory,
      env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: url },
      encoding: 'utf8',
      timeout: 30000,
    },
  );
  if (migration.status !== 0)
    throw new Error(
      `Test database migration failed: ${migration.stderr || migration.stdout}`,
    );
  const db = createDatabase(url);
  async function close() {
    await db.$disconnect();
    // Remove only the unique directory allocated by this test helper.
    if (
      dirname(resolve(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith('servicenova-test-')
    )
      throw new Error('Unsafe test cleanup path.');
    await rm(directory, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  }
  return { db, url, close };
}
