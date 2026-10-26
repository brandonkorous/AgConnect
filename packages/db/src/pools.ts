import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { checkRoleOnce } from './boot-check.js';

// One Prisma pool per API domain, so a burst in one domain cannot starve the rest; application_name tells them apart.
// Pools open on first use, so a process only connects the pools it touches.

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

// DB_POOL_<NAME> sets one pool's size; DB_POOL_MAX caps every pool in the process (set per Deployment).
export function poolSize(name: PoolName, env: NodeJS.ProcessEnv = process.env): number {
  const own = Number(env[`DB_POOL_${name.toUpperCase()}`]);
  if (Number.isInteger(own) && own > 0) return own;
  const cap = Number(env.DB_POOL_MAX);
  return Number.isInteger(cap) && cap > 0 ? Math.min(cap, POOL_SIZES[name]) : POOL_SIZES[name];
}

const globalForPools = globalThis as unknown as {
  agconnPools?: Partial<Record<PoolName, PrismaClient>>;
};

// Idle connections stay open 5 min (pg's default is 10 s) so requests skip a fresh connect; PrismaPg handles idle errors.
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
  void checkRoleOnce(client);
  return withWizeLens(client);
}

// Set by startWizeLens (./wizelens.ts) in a process that traces itself; unset elsewhere.
function withWizeLens(client: PrismaClient): PrismaClient {
  const extension = (globalThis as { __wizelensPrisma?: unknown }).__wizelensPrisma;
  if (!extension) return client;
  // A one-method view: Prisma's own $extends typing is too deep for tsc here.
  const extendable = client as unknown as { $extends(extension: unknown): unknown };
  return extendable.$extends(extension) as PrismaClient;
}

// Built on first access: `next build` page-data collection has no DATABASE_URL.
function getPool(name: PoolName): PrismaClient {
  const store = (globalForPools.agconnPools ??= {});
  let client = store[name];
  if (!client) {
    client = createClient(name, poolSize(name));
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
