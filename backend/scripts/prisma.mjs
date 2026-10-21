import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(
  new URL('../node_modules/prisma/build/index.js', import.meta.url),
);
// Prisma's SQLite migration engine can fail when an inherited RUST_LOG is
// warn/error. Set its required level on the child only (prisma/orm#29355).
const result = spawnSync(
  process.execPath,
  ['--env-file-if-exists=.env', cli, ...process.argv.slice(2)],
  {
    cwd: backendDirectory,
    env: { ...process.env, RUST_LOG: 'info' },
    stdio: 'inherit',
  },
);
if (result.error)
  console.error(
    'Unable to launch Prisma CLI. Check Node and installed dependencies.',
  );
process.exitCode = result.status ?? 1;
