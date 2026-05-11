import { Hono } from 'hono';
import { ok } from '@agconn/api-client/server';
import type { AdminOrgVars } from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

// Service health board. Each entry reports either a live ping result (when we
// know the service URL) or a recency probe from the database (last-write
// timestamp on a table the service owns). The combination lets us tell apart
// "service is up but idle" from "service hasn't written in N minutes".

export const adminSystemHealthRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

type ServiceEntry = {
  name: string;
  description: string;
  url: string | null;
  ping: { status: 'ok' | 'degraded' | 'down' | 'unknown'; latencyMs: number | null; error: string | null };
  lastActivity: { at: string | null; what: string };
};

async function ping(url: string, timeoutMs = 1500): Promise<ServiceEntry['ping']> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const latencyMs = Date.now() - started;
    if (res.ok) return { status: 'ok', latencyMs, error: null };
    return { status: 'degraded', latencyMs, error: `HTTP ${res.status}` };
  } catch (e) {
    return {
      status: 'down',
      latencyMs: null,
      error: e instanceof Error ? e.message : 'unknown',
    };
  } finally {
    clearTimeout(t);
  }
}

adminSystemHealthRoutes.get('/', async (c) => {
  const SERVICES: { name: string; description: string; url: string | null }[] = [
    {
      name: 'api',
      description: 'Public + admin REST API (Hono).',
      url: process.env.SELF_HEALTH_URL ?? `http://localhost:${process.env.PORT ?? 3001}/health`,
    },
    {
      name: 'web',
      description: 'Worker / employer / marketing PWA (Next.js).',
      url: process.env.WEB_INTERNAL_BASE_URL ? `${process.env.WEB_INTERNAL_BASE_URL}/api/health` : null,
    },
    {
      name: 'sms-worker',
      description: 'Twilio outbound worker + automatch + renotify consumers.',
      url: process.env.SMS_WORKER_HEALTH_URL ?? null,
    },
    {
      name: 'resume-parser',
      description: 'Anthropic resume → ResumeSchema parser.',
      url: process.env.RESUME_PARSER_HEALTH_URL ?? null,
    },
    {
      name: 'cert-generator',
      description: 'React-PDF certificate renderer.',
      url: process.env.CERT_GENERATOR_HEALTH_URL ?? null,
    },
    {
      name: 'flc-verifier',
      description: 'CA DIR FLC license lookup + nightly sweep.',
      url: process.env.FLC_VERIFIER_HEALTH_URL ?? null,
    },
    {
      name: 'scheduler',
      description: 'pg-boss producer for time-based jobs.',
      url: process.env.SCHEDULER_HEALTH_URL ?? null,
    },
  ];

  // Run pings in parallel.
  const pings = await Promise.all(
    SERVICES.map((s) =>
      s.url
        ? ping(s.url)
        : Promise.resolve<ServiceEntry['ping']>({
            status: 'unknown',
            latencyMs: null,
            error: 'no health URL configured',
          }),
    ),
  );

  // Recency probes — last-write per service domain.
  const [lastAudit, lastSms, lastEmail, lastFlc, lastApplication] = await Promise.all([
    c.var.db.auditEvent.findFirst({ orderBy: { occurredAt: 'desc' }, select: { occurredAt: true } }),
    c.var.db.smsLog.findFirst({ orderBy: { queuedAt: 'desc' }, select: { queuedAt: true } }),
    c.var.db.emailLog.findFirst({ orderBy: { queuedAt: 'desc' }, select: { queuedAt: true } }),
    c.var.db.verificationLog
      .findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
      .catch(() => null),
    c.var.db.application.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);

  const services: ServiceEntry[] = SERVICES.map((s, i) => {
    let lastActivity: ServiceEntry['lastActivity'] = { at: null, what: 'n/a' };
    if (s.name === 'api') {
      lastActivity = { at: lastAudit?.occurredAt.toISOString() ?? null, what: 'last audit event' };
    } else if (s.name === 'sms-worker') {
      lastActivity = { at: lastSms?.queuedAt.toISOString() ?? null, what: 'last SMS queued' };
    } else if (s.name === 'resume-parser') {
      lastActivity = { at: lastApplication?.createdAt.toISOString() ?? null, what: 'last application' };
    } else if (s.name === 'cert-generator') {
      lastActivity = { at: null, what: 'no cert table yet' };
    } else if (s.name === 'flc-verifier') {
      lastActivity = { at: lastFlc?.createdAt.toISOString() ?? null, what: 'last FLC check' };
    } else if (s.name === 'web') {
      lastActivity = { at: lastApplication?.createdAt.toISOString() ?? null, what: 'last application' };
    } else if (s.name === 'scheduler') {
      lastActivity = { at: lastEmail?.queuedAt.toISOString() ?? null, what: 'last email queued' };
    }
    return { ...s, ping: pings[i]!, lastActivity };
  });

  const env = {
    node: process.version,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    gitSha: process.env.GIT_SHA ?? process.env.K_REVISION ?? null,
    region: process.env.K8S_REGION ?? process.env.GKE_LOCATION ?? null,
  };

  return ok(c, { services, env, checkedAt: new Date().toISOString() });
});
