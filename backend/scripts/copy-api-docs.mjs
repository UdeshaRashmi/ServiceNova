import { copyFileSync } from 'node:fs';

copyFileSync(
  new URL('../../docs/openapi.json', import.meta.url),
  new URL('../dist/openapi.json', import.meta.url),
);
