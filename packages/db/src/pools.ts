import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Per-domain Prisma connection pools. Each domain folder under
// services/api/src/* gets its own PrismaClient with its own pool, so that
// a burst in one domain (or a single runaway query) cannot starve every
// other domain of database capacity.
//
// All clients connect to the same Postgres but advertise distinct
// application_name values, which makes pg_stat_activity immediately
// readable when diagnosing where connections are being held.
//
// Pool sizes are starting values informed by domain traffic shape, not
// load-tested values. Revisit when production telemetry exists.

export type PoolName =
  | 'shared'
  | 'me'
  | 'worker'
  | 'employer'
  | 'crews'
  | 'jobs'
  | 'applications'
  | 'landing'
  | 'training'
  | 'wallet'
  | 'admin'
  | 'i18n'
  | 'webhooks';

const POOL_SIZES: Record<PoolName, number> = {
  shared: 10,
  me: 10,
  worker: 15,
  employer: 15,
  crews: 10,
  jobs: 10,
  applications: 8,
  landing: 8,
  training: 5,
  wallet: 5,
  admin: 5,
  i18n: 5,
  webhooks: 5,
};

const globalForPools = globalThis as unknown as {
  agconnPools?: Record<PoolName, PrismaClient>;
};

function createClient(name: PoolName, max: number): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — required for @agconn/db pools');
  }
  const adapter = new PrismaPg({
    connectionString: url,
    max,
    application_name: `agconn-${name}`,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

function buildPools(): Record<PoolName, PrismaClient> {
  return Object.fromEntries(
    (Object.keys(POOL_SIZES) as PoolName[]).map((name) => [name, createClient(name, POOL_SIZES[name])]),
  ) as Record<PoolName, PrismaClient>;
}

export const pools: Record<PoolName, PrismaClient> =
  globalForPools.agconnPools ?? buildPools();

if (process.env.NODE_ENV !== 'production') {
  globalForPools.agconnPools = pools;
}
