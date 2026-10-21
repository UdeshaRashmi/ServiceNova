import { defineConfig } from 'prisma/config';
import { databaseUrl } from './src/utils/database.ts';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx --env-file-if-exists=.env src/seed.ts',
  },
  datasource: { url: databaseUrl() },
});
