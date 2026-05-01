import './instrument';
import * as Sentry from '@sentry/node';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { ok, err, onErrorEnvelope } from '@agconn/api-client/server';
import { auditMiddleware, emitSystemAudit, type AuditCtxVars } from './middleware/audit';
import { clerkAuthMiddleware } from './middleware/authContext';
import { landingRoutes } from './landing/routes';
import { resendWebhookRoutes } from './webhooks/resend';
import { clerkWebhookRoutes } from './webhooks/clerk';
import { twilioWebhookRoutes } from './webhooks/twilio';
import { adminAuditRoutes } from './admin/audit/routes';
import { meRoutes } from './me/routes';
import { onboardingRoutes, onboardingWaitlistRoute } from './worker/onboarding/routes';
import { profileRoutes } from './worker/profile/routes';
import { jobsRoutes, savedSearchRoutes } from './jobs/routes';
import { applicationsRoutes, jobApplyRoute } from './applications/routes';
import {
  enrollmentsRoutes,
  orgTrainingRoutes,
  trainingRoutes,
} from './training/routes';
import { walletRoutes } from './wallet/routes';

const app = new Hono<{ Variables: AuditCtxVars }>();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    exposeHeaders: ['x-correlation-id'],
  }),
);

// Clerk parses the session cookie / Authorization header into c.var.auth.
// No-ops if Clerk env keys are missing (dev without Clerk works).
app.use('*', clerkAuthMiddleware);

// Audit middleware mounts correlation id + c.var.audit.log() on every request.
// Must precede route mounts so handlers see c.var.audit.
app.use('*', auditMiddleware);

app.onError(
  onErrorEnvelope({
    log: (info) => {
      console.error('[api] unhandled error', {
        correlationId: info.correlationId,
        status: info.status,
        message: info.err instanceof Error ? info.err.message : String(info.err),
        stack: info.err instanceof Error ? info.err.stack : undefined,
      });
      if (info.status >= 500) {
        Sentry.captureException(info.err, {
          tags: { correlationId: info.correlationId, status: String(info.status) },
        });
      }
    },
    onUnhandled: async ({ err: e, correlationId }) => {
      // Best-effort: never throw out of the audit emit so the caller still
      // receives the envelope.
      try {
        await emitSystemAudit({
          action: 'error.unhandled',
          outcome: 'failure',
          metadata: {
            errorCode: e instanceof Error ? e.name : 'unknown',
            route: '',
            method: '',
          },
        });
      } catch (logErr) {
        console.error('[api] failed to record error.unhandled audit', {
          correlationId,
          err: logErr instanceof Error ? logErr.message : String(logErr),
        });
      }
    },
  }),
);

app.notFound((c) => err(c, 404, 'not_found'));

app.get('/health', (c) => ok(c, { status: 'ok' }));
app.get('/ready', (c) => ok(c, { status: 'ready' }));

app.route('/v1/landing', landingRoutes);
app.route('/v1/me', meRoutes);
app.route('/v1/me/enrollments', enrollmentsRoutes);
app.route('/v1/onboarding', onboardingRoutes);
app.route('/v1/onboarding', onboardingWaitlistRoute);
app.route('/v1/profile', profileRoutes);
app.route('/v1/jobs', jobsRoutes);
app.route('/v1/jobs', jobApplyRoute);
app.route('/v1/saved-searches', savedSearchRoutes);
app.route('/v1/applications', applicationsRoutes);
app.route('/v1/training', trainingRoutes);
app.route('/v1/wallet', walletRoutes);
app.route('/v1/org', orgTrainingRoutes);
app.route('/v1/webhooks/resend', resendWebhookRoutes);
app.route('/v1/webhooks/clerk', clerkWebhookRoutes);
app.route('/v1/webhooks/twilio', twilioWebhookRoutes);
app.route('/admin/v1/audit', adminAuditRoutes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
