import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, '..', '..', '.env') });

// Schema-engine ops (db push, migrate) need a direct connection — pgbouncer
// transaction-mode pooling breaks Prisma's prepared statements. Runtime queries
// continue to use the pooler via DATABASE_URL through PrismaPg in pools.ts.
//
// We read process.env directly instead of prisma's env() helper because env()
// throws on a missing var (even inside `??`), which breaks `prisma generate`
// in CI where no DB URL is set. The placeholder is never connected to —
// generate only needs the schema, and migrate/push commands won't accept it.
const datasourceUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? 'postgresql://placeholder';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: { url: datasourceUrl },
});
