import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma, PrismaClient } from '@prisma/client';
import { pools, type PoolName } from './pools.js';

export type RlsRole =
  | 'anonymous'
  | 'authenticated'
  | 'service'
  | 'webhook'
  | 'admin'
  | 'system'
  | 'audit_redact'
  | 'audit_purge';

export interface RlsContext {
  role: RlsRole;
  userId?: string;
  tenantId?: string;
  // Active employer profile id; unset reads as NULL in policies (app.setting_uuid), so it matches nothing.
  employerId?: string;
}

const ALLOWED_ROLES: ReadonlySet<RlsRole> = new Set([
  'anonymous',
  'authenticated',
  'service',
  'webhook',
  'admin',
  'system',
  'audit_redact',
  'audit_purge',
]);

const als = new AsyncLocalStorage<RlsContext>();

export function getRlsContext(): RlsContext | undefined {
  return als.getStore();
}

export function runWithRlsContext<T>(ctx: RlsContext, fn: () => Promise<T> | T): Promise<T> {
  if (!ALLOWED_ROLES.has(ctx.role)) {
    throw new Error(`runWithRlsContext: invalid RLS role ${JSON.stringify(ctx.role)}`);
  }
  return Promise.resolve(als.run(ctx, fn));
}

// Wraps a background job handler so dbClients.* queries in it run as app.role = 'service'.
export function asService<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  return (...args) => runWithRlsContext({ role: 'service' }, () => fn(...args));
}

// Sets the app.* settings transaction-locally (set_config(..., true)) in one round trip.
export async function applyRlsToTx(
  tx: Prisma.TransactionClient,
  ctx: RlsContext,
): Promise<void> {
  if (!ALLOWED_ROLES.has(ctx.role)) {
    throw new Error(`applyRlsToTx: invalid RLS role ${JSON.stringify(ctx.role)}`);
  }
  await tx.$queryRaw`
    SELECT
      set_config('app.role', ${ctx.role}, true),
      set_config('app.user_id', ${ctx.userId ?? ''}, true),
      set_config('app.tenant_id', ${ctx.tenantId ?? ''}, true),
      set_config('app.employer_id', ${ctx.employerId ?? ''}, true)
  `;
}

const RAW_OPS = new Set(['$queryRaw', '$queryRawUnsafe', '$executeRaw', '$executeRawUnsafe']);
const PASSTHROUGH_OPS = new Set(['$connect', '$disconnect', '$on', '$use', '$extends']);

type AnyFn = (...a: unknown[]) => unknown;
type TxWork<T> = (tx: Prisma.TransactionClient) => Promise<T>;

// One short transaction per call: apply the ALS context (or the fixed one), run the work, commit.
function inRlsTx<T>(prisma: PrismaClient, fixed: RlsContext | undefined, work: TxWork<T>, opts?: unknown) {
  return prisma.$transaction(async (tx) => {
    const ctx = als.getStore() ?? fixed;
    if (ctx) await applyRlsToTx(tx, ctx);
    return work(tx);
  }, opts as Parameters<PrismaClient['$transaction']>[1]);
}

function transactionOp(prisma: PrismaClient, fixed: RlsContext | undefined) {
  return ((arg: unknown, opts?: unknown) => {
    if (typeof arg === 'function') return inRlsTx(prisma, fixed, arg as TxWork<unknown>, opts);
    throw new Error(
      'rlsClient.$transaction(array) is not supported — use the callback form so RLS context can be applied inside the transaction.',
    );
  }) as PrismaClient['$transaction'];
}

function modelProxy(prisma: PrismaClient, fixed: RlsContext | undefined, model: string, target: object) {
  return new Proxy(target, {
    get(_t, op) {
      if (typeof op !== 'string' || op === 'then') return undefined;
      const fn = (target as Record<string, unknown>)[op];
      if (typeof fn !== 'function') return fn;
      return (...args: unknown[]) => inRlsTx(prisma, fixed, async (tx) => {
        const txModel = (tx as unknown as Record<string, Record<string, AnyFn>>)[model]!;
        return txModel[op]!.apply(txModel, args);
      });
    },
  });
}

// A client whose every model call, raw query and $transaction(callback) runs in its own RLS-scoped transaction.
// `fixed` applies when no runWithRlsContext is active (the admin client for seeds and scripts).
export function makeRlsClient(prisma: PrismaClient, fixed?: RlsContext): PrismaClient {
  const handler: ProxyHandler<PrismaClient> = {
    get(_target, prop) {
      if (typeof prop !== 'string' || prop === 'then') return undefined;
      if (prop === '$transaction') return transactionOp(prisma, fixed);
      if (RAW_OPS.has(prop)) {
        return (...args: unknown[]) => inRlsTx(prisma, fixed, async (tx) =>
          (tx as unknown as Record<string, AnyFn>)[prop]!(...args));
      }
      const value = (prisma as unknown as Record<string, unknown>)[prop];
      if (PASSTHROUGH_OPS.has(prop)) return typeof value === 'function' ? (value as AnyFn).bind(prisma) : value;
      if (!value || typeof value !== 'object') return undefined;
      return modelProxy(prisma, fixed, prop, value);
    },
  };
  return new Proxy({} as PrismaClient, handler);
}

// RLS-aware clients, one per pool, built on first use so module load needs no DATABASE_URL.
const rlsClientCache: Partial<Record<PoolName, PrismaClient>> = {};
export const dbClients: Record<PoolName, PrismaClient> = new Proxy(
  {} as Record<PoolName, PrismaClient>,
  {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      const name = prop as PoolName;
      let client = rlsClientCache[name];
      if (!client) {
        const base = pools[name];
        if (!base) return undefined;
        client = makeRlsClient(base);
        rlsClientCache[name] = client;
      }
      return client;
    },
  },
);
