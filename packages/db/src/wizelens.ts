import { SpanKind } from '@opentelemetry/api';
import { CATEGORY_ATTR, createWizeLens, prismaExtension, type WizeLens } from '@wizeworks/lens-node';

// WizeLens: request and job tracing for the api and the pg-boss workers, with
// every Prisma query and outgoing fetch inside the request or job that made it.
//
// On in development (NODE_ENV unset or "development"); the api serves its
// dashboard at /_wizelens. Off in tests. In production only with
// WIZELENS_ENABLED=true (deploy/k8s/base/configmap.yaml), and then SEND-ONLY:
// traces go to WIZELENS_HUB with this pod's WIZELENS_HUB_TOKEN, sampled by
// WIZELENS_SAMPLE_RATE. A failure to start is logged and never stops the
// process: tracing is not worth an outage.

const env = process.env.NODE_ENV;
const development = env !== 'production' && env !== 'test';
const enabled = development || process.env.WIZELENS_ENABLED === 'true';

// pools.ts reads this when it builds each client, so it must be set before the
// first query. Every pool is built lazily, on first use.
type PrismaHook = { __wizelensPrisma?: unknown };

/** Starts WizeLens for this process, or returns null when it is off or fails to start. */
export function startWizeLens(serviceName: string): WizeLens | null {
    if (!enabled) return null;
    try {
        const wizelens = createWizeLens({ serviceName, enabled: true });
        (globalThis as PrismaHook).__wizelensPrisma = prismaExtension(wizelens, {
            system: 'postgresql',
        });
        return wizelens;
    } catch (err) {
        console.warn('[wizelens] tracing did not start', err);
        return null;
    }
}

type JobBatch = { id?: string }[];
type Handler = (jobs: JobBatch) => Promise<unknown>;
type Work = (...args: unknown[]) => Promise<string>;
type BossClass = { prototype: object };

const PATCHED = Symbol.for('agconn.wizelens.pg-boss');

// pg-boss has no WizeLens adapter, so each batch a worker handles becomes one
// consumer span. The Prisma queries and fetches the handler makes nest inside it.
function traced(wizelens: WizeLens, queue: string, handler: Handler): Handler {
    return (jobs) =>
        wizelens.tracer.startActiveSpan(
            `process ${queue}`,
            {
                kind: SpanKind.CONSUMER,
                attributes: {
                    [CATEGORY_ATTR]: 'messaging',
                    'messaging.system': 'pg-boss',
                    'messaging.operation.type': 'process',
                    'messaging.destination.name': queue,
                    'messaging.batch.message_count': jobs.length,
                    ...(jobs.length === 1 && jobs[0]?.id ? { 'messaging.message.id': jobs[0].id } : {}),
                },
            },
            async (span) => {
                try {
                    return await handler(jobs);
                } catch (err) {
                    wizelens.recordException(err);
                    throw err;
                } finally {
                    span.end();
                }
            },
        );
}

/** Traces every pg-boss `work` handler in this process. Pass the PgBoss class. */
export function traceJobs(wizelens: WizeLens | null, PgBoss: BossClass): void {
    const proto = PgBoss.prototype as { work: Work; [PATCHED]?: true };
    if (!wizelens || proto[PATCHED]) return;
    const work = proto.work;
    proto.work = function (this: unknown, ...args: unknown[]) {
        const last = args.length - 1;
        if (typeof args[0] === 'string' && typeof args[last] === 'function') {
            args[last] = traced(wizelens, args[0], args[last] as Handler);
        }
        return work.apply(this, args);
    };
    proto[PATCHED] = true;
}

/** Starts WizeLens for a pg-boss worker and traces each job it handles. */
export function traceWorker(serviceName: string, PgBoss: BossClass): WizeLens | null {
    const wizelens = startWizeLens(serviceName);
    traceJobs(wizelens, PgBoss);
    return wizelens;
}
