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
  agconnPools?: Partial<Record<PoolName, PrismaClient>>;
};

// Idle connections stay open 5 min (pg's default is 10 s): a fresh TLS connection to the
// Supabase pooler cost ~200 ms on most API requests. Idle-client errors are handled by PrismaPg.
export function poolConfig(name: PoolName, max: number, connectionString: string) {
  return {
    connectionString,
    max,
    application_name: `agconn-${name}`,
    idleTimeoutMillis: 300_000,
    keepAlive: true,
  };
}

function createClient(name: PoolName, max: number): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set — required for @agconn/db pools');
  }
  const adapter = new PrismaPg(poolConfig(name, max, url));
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  return withWizeLens(client);
}

// Set by startWizeLens (./wizelens.ts) in a process that traces itself; unset
// everywhere else, so the client is exactly what it was.
function withWizeLens(client: PrismaClient): PrismaClient {
  const extension = (globalThis as { __wizelensPrisma?: unknown }).__wizelensPrisma;
  if (!extension) return client;
  // A one-method view: Prisma's own $extends typing is too deep for tsc here.
  const extendable = client as unknown as { $extends(extension: unknown): unknown };
  return extendable.$extends(extension) as PrismaClient;
}

// Lazy per-pool instantiation. Building a client requires DATABASE_URL, which
// is not present during `next build` page-data collection. Deferring to first
// access lets module load remain side-effect-free.
function getPool(name: PoolName): PrismaClient {
  const store = (globalForPools.agconnPools ??= {});
  let client = store[name];
  if (!client) {
    client = createClient(name, POOL_SIZES[name]);
    store[name] = client;
  }
  return client;
}

export const pools: Record<PoolName, PrismaClient> = new Proxy(
  {} as Record<PoolName, PrismaClient>,
  {
    get(_target, prop) {
      if (typeof prop !== 'string' || !(prop in POOL_SIZES)) return undefined;
      return getPool(prop as PoolName);
    },
  },
);
