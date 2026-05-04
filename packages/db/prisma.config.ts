import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, '..', '..', '.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    // Schema-engine ops (db push, migrate) need a direct connection — pgbouncer
    // transaction-mode pooling breaks Prisma's prepared statements. Runtime
    // queries continue to use the pooler via env('DATABASE_URL').
    url: env('DIRECT_URL') ?? env('DATABASE_URL'),
  },
});
