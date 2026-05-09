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

// Sets app.role / app.user_id / app.tenant_id for the duration of `tx`.
// One round-trip via three set_config(_, _, true) calls in a single SELECT.
// `true` = transaction-local — equivalent to SET LOCAL but composable.
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
      set_config('app.tenant_id', ${ctx.tenantId ?? ''}, true)
  `;
}

const RAW_OPS = new Set(['$queryRaw', '$queryRawUnsafe', '$executeRaw', '$executeRawUnsafe']);
const PASSTHROUGH_OPS = new Set(['$connect', '$disconnect', '$on', '$use', '$extends']);

// Wraps a PrismaClient with a per-query short-transaction proxy. Every model
// operation, raw query, or $transaction(callback) routed through the returned
// client opens a Prisma transaction on `prisma`, applies the current ALS
// RlsContext (if any), runs the work, and commits — releasing the pooled
// connection immediately. This keeps a connection pinned only for the duration
// of one statement (or one explicit handler-level transaction) instead of for
// an entire HTTP request.
export function makeRlsClient(prisma: PrismaClient): PrismaClient {
  const handler: ProxyHandler<PrismaClient> = {
    get(_target, prop, _receiver) {
      if (typeof prop !== 'string') return undefined;

      // Prevent accidental thenable behavior (e.g. `await db`).
      if (prop === 'then') return undefined;

      if (prop === '$transaction') {
        return ((arg: unknown, opts?: unknown) => {
          if (typeof arg === 'function') {
            return prisma.$transaction(
              async (tx) => {
                const ctx = als.getStore();
                if (ctx) await applyRlsToTx(tx, ctx);
                return (arg as (tx: Prisma.TransactionClient) => Promise<unknown>)(tx);
              },
              opts as Parameters<PrismaClient['$transaction']>[1],
            );
          }
          throw new Error(
            'rlsClient.$transaction(array) is not supported — use the callback form so RLS context can be applied inside the transaction.',
          );
        }) as PrismaClient['$transaction'];
      }

      if (RAW_OPS.has(prop)) {
        return (...args: unknown[]) =>
          prisma.$transaction(async (tx) => {
            const ctx = als.getStore();
            if (ctx) await applyRlsToTx(tx, ctx);
            return (tx as unknown as Record<string, (...a: unknown[]) => unknown>)[prop]!(
              ...args,
            );
          });
      }

      if (PASSTHROUGH_OPS.has(prop)) {
        const fn = (prisma as unknown as Record<string, unknown>)[prop];
        return typeof fn === 'function' ? (fn as Function).bind(prisma) : fn;
      }

      // Treat as a model accessor: prisma.user, prisma.tenant, ...
      const modelTarget = (prisma as unknown as Record<string, unknown>)[prop];
      if (!modelTarget || typeof modelTarget !== 'object') {
        return undefined;
      }
      return new Proxy(modelTarget as object, {
        get(_t, op, _r) {
          if (typeof op !== 'string') return undefined;
          if (op === 'then') return undefined;
          const fn = (modelTarget as Record<string, unknown>)[op];
          if (typeof fn !== 'function') return fn;
          return (...args: unknown[]) =>
            prisma.$transaction(async (tx) => {
              const ctx = als.getStore();
              if (ctx) await applyRlsToTx(tx, ctx);
              const txModel = (tx as unknown as Record<string, Record<string, Function>>)[prop]!;
              return txModel[op]!.apply(txModel, args);
            });
        },
      });
    },
  };
  return new Proxy({} as PrismaClient, handler);
}

// Pre-built RLS-aware proxies, one per pool. Routes import the one that matches
// their domain (e.g. `dbClients.worker`, `dbClients.employer`, …) and pass it
// through the auth middleware factory.
export const dbClients: Record<PoolName, PrismaClient> = Object.fromEntries(
  (Object.keys(pools) as PoolName[]).map((name) => [name, makeRlsClient(pools[name])]),
) as Record<PoolName, PrismaClient>;
