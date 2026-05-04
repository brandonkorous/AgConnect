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
import { publicJobsRoutes } from './landing/jobs';
import { publicTrainingRoutes } from './landing/training';
import { i18nRoutes } from './i18n/routes';
import { resendWebhookRoutes } from './webhooks/resend';
import { clerkWebhookRoutes } from './webhooks/clerk';
import { twilioWebhookRoutes } from './webhooks/twilio';
import { stripeWebhookRoutes } from './webhooks/stripe';
import { adminAuditRoutes } from './admin/audit/routes';
import { adminEmployersRoutes } from './admin/employers/routes';
import { meRoutes } from './me/routes';
import { meInvitationsRoutes } from './me/invitations';
import { meShiftsRoutes } from './me/shifts';
import { mePayRoutes } from './me/pay';
import { meMessagesRoutes } from './me/messages';
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
import { employerOnboardingRoutes } from './employer/onboarding/routes';
import { employerJobsRoutes } from './employer/jobs/routes';
import { employerJobMatchPreviewRoutes } from './employer/jobs/match-preview';
import { employerContactsRoutes } from './employer/contacts/routes';
import { employerLookupsRoutes } from './employer/lookups/routes';
import {
  employerInboxRoutes,
  employerJobApplicantsRoute,
  employerApplicationsRoutes,
} from './employer/applications/routes';
import {
  employerWorkersRoutes,
  employerInvitationsRoutes,
} from './employer/workers/routes';
import { employerBillingRoutes } from './employer/billing/routes';
import { employerCrewsRoutes } from './employer/crews/routes';
import { employerShiftsRoutes } from './employer/shifts/routes';
import { employerHiresRoutes } from './employer/hires/routes';
import { employerWeatherRoutes } from './employer/weather/routes';
import { employerPayrollRoutes } from './employer/payroll/routes';
import { employerComplianceRoutes } from './employer/compliance/routes';
import { employerMessagesRoutes } from './employer/messages/routes';
import { employerReportsRoutes } from './employer/reports/routes';

const app = new Hono<{ Variables: AuditCtxVars }>();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    exposeHeaders: ['x-correlation-id'],
    credentials: true,
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
app.route('/v1/landing/jobs', publicJobsRoutes);
app.route('/v1/landing/training', publicTrainingRoutes);
app.route('/v1/i18n', i18nRoutes);
app.route('/v1/me', meRoutes);
app.route('/v1/me/invitations', meInvitationsRoutes);
app.route('/v1/me/enrollments', enrollmentsRoutes);
app.route('/v1/me/shifts', meShiftsRoutes);
app.route('/v1/me/pay', mePayRoutes);
app.route('/v1/me/messages', meMessagesRoutes);
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
app.route('/v1/employer/onboarding', employerOnboardingRoutes);
app.route('/v1/employer/jobs/match-preview', employerJobMatchPreviewRoutes);
app.route('/v1/employer/jobs', employerJobsRoutes);
app.route('/v1/employer/jobs', employerJobApplicantsRoute);
app.route('/v1/employer/contacts', employerContactsRoutes);
app.route('/v1/employer/lookups', employerLookupsRoutes);
app.route('/v1/employer', employerInboxRoutes);
app.route('/v1/employer/applications', employerApplicationsRoutes);
app.route('/v1/employer/workers', employerWorkersRoutes);
app.route('/v1/employer/invitations', employerInvitationsRoutes);
app.route('/v1/employer/billing', employerBillingRoutes);
app.route('/v1/employer/crews', employerCrewsRoutes);
app.route('/v1/employer/shifts', employerShiftsRoutes);
app.route('/v1/employer/hires', employerHiresRoutes);
app.route('/v1/employer/weather', employerWeatherRoutes);
app.route('/v1/employer/payroll', employerPayrollRoutes);
app.route('/v1/employer/compliance', employerComplianceRoutes);
app.route('/v1/employer/messages', employerMessagesRoutes);
app.route('/v1/employer/reports', employerReportsRoutes);
app.route('/v1/webhooks/resend', resendWebhookRoutes);
app.route('/v1/webhooks/clerk', clerkWebhookRoutes);
app.route('/v1/webhooks/twilio', twilioWebhookRoutes);
app.route('/v1/webhooks/stripe', stripeWebhookRoutes);
app.route('/admin/v1/audit', adminAuditRoutes);
app.route('/admin/v1/employers', adminEmployersRoutes);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
