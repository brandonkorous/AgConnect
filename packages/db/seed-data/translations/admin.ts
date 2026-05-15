// AUTO-GENERATED initial dump on 2026-05-01.
// Source of truth for namespace "admin".
// Edit this file to update copy; run `pnpm --filter @agconn/db i18n:seed` to apply.

import type { TranslationBundle } from '../types';

export const admin: TranslationBundle = {
    "audit.action.admin.audit.redacted.description": {
        en: "PII redacted from audit events",
        es: "",
    },
    "audit.action.admin.audit.redacted.label": {
        en: "Audit redacted",
        es: "",
    },
    "audit.action.admin.data.exported.description": {
        en: "Admin exported a CSV / report",
        es: "",
    },
    "audit.action.admin.data.exported.label": {
        en: "Data exported",
        es: "",
    },
    "audit.action.admin.impersonation.ended.description": {
        en: "Admin ended an impersonation",
        es: "",
    },
    "audit.action.admin.impersonation.ended.label": {
        en: "Impersonation ended",
        es: "",
    },
    "audit.action.admin.impersonation.started.description": {
        en: "Admin began impersonating a user",
        es: "",
    },
    "audit.action.admin.impersonation.started.label": {
        en: "Impersonation started",
        es: "",
    },
    "audit.action.admin.user.deleted.description": {
        en: "Admin deleted a user account",
        es: "",
    },
    "audit.action.admin.user.deleted.label": {
        en: "User deleted",
        es: "",
    },
    "audit.action.application.hired.description": {
        en: "Application reached hired status",
        es: "",
    },
    "audit.action.application.hired.label": {
        en: "Worker hired",
        es: "",
    },
    "audit.action.application.status.changed.description": {
        en: "Application moved stage",
        es: "",
    },
    "audit.action.application.status.changed.label": {
        en: "Application status changed",
        es: "",
    },
    "audit.action.auth.failed_login.description": {
        en: "Sign-in attempt was rejected",
        es: "",
    },
    "audit.action.auth.failed_login.label": {
        en: "Failed login",
        es: "",
    },
    "audit.action.auth.login.description": {
        en: "Successful sign-in",
        es: "",
    },
    "audit.action.auth.login.label": {
        en: "Logged in",
        es: "",
    },
    "audit.action.auth.logout.description": {
        en: "Session ended",
        es: "",
    },
    "audit.action.auth.logout.label": {
        en: "Logged out",
        es: "",
    },
    "audit.action.auth.role_changed.description": {
        en: "A user role was modified",
        es: "",
    },
    "audit.action.auth.role_changed.label": {
        en: "Role changed",
        es: "",
    },
    "audit.action.billing.payment.failed.description": {
        en: "A Stripe charge failed",
        es: "",
    },
    "audit.action.billing.payment.failed.label": {
        en: "Payment failed",
        es: "",
    },
    "audit.action.billing.payment.succeeded.description": {
        en: "Stripe charged successfully",
        es: "",
    },
    "audit.action.billing.payment.succeeded.label": {
        en: "Payment succeeded",
        es: "",
    },
    "audit.action.billing.subscription.canceled.description": {
        en: "Stripe subscription canceled",
        es: "",
    },
    "audit.action.billing.subscription.canceled.label": {
        en: "Subscription canceled",
        es: "",
    },
    "audit.action.billing.subscription.created.description": {
        en: "Stripe subscription created",
        es: "",
    },
    "audit.action.billing.subscription.created.label": {
        en: "Subscription started",
        es: "",
    },
    "audit.action.cert.issued.description": {
        en: "AGCONN issued a certificate",
        es: "",
    },
    "audit.action.cert.issued.label": {
        en: "Certificate issued",
        es: "",
    },
    "audit.action.cert.revoked.description": {
        en: "A certificate was revoked",
        es: "",
    },
    "audit.action.cert.revoked.label": {
        en: "Certificate revoked",
        es: "",
    },
    "audit.action.employer.flc.rejected.description": {
        en: "Admin rejected an FLC license",
        es: "",
    },
    "audit.action.employer.flc.rejected.label": {
        en: "FLC license rejected",
        es: "",
    },
    "audit.action.employer.flc.submitted.description": {
        en: "Employer submitted an FLC license",
        es: "",
    },
    "audit.action.employer.flc.submitted.label": {
        en: "FLC license submitted",
        es: "",
    },
    "audit.action.employer.flc.verified.description": {
        en: "Admin verified an FLC license",
        es: "",
    },
    "audit.action.employer.flc.verified.label": {
        en: "FLC license verified",
        es: "",
    },
    "audit.action.error.unhandled.description": {
        en: "A request failed with an unhandled exception",
        es: "",
    },
    "audit.action.error.unhandled.label": {
        en: "Unhandled error",
        es: "",
    },
    "audit.action.job.posting.closed.description": {
        en: "A posting was closed",
        es: "",
    },
    "audit.action.job.posting.closed.label": {
        en: "Job posting closed",
        es: "",
    },
    "audit.action.job.posting.created.description": {
        en: "Employer created a job posting",
        es: "",
    },
    "audit.action.job.posting.created.label": {
        en: "Job posting created",
        es: "",
    },
    "audit.action.job.posting.published.description": {
        en: "A draft posting went live",
        es: "",
    },
    "audit.action.job.posting.published.label": {
        en: "Job posting published",
        es: "",
    },
    "audit.action.system.audit.breaker.recovered.description": {
        en: "Audit circuit breaker drained",
        es: "",
    },
    "audit.action.system.audit.breaker.recovered.label": {
        en: "Breaker recovered",
        es: "",
    },
    "audit.action.system.audit.retention.purged.description": {
        en: "Nightly retention job removed expired events",
        es: "",
    },
    "audit.action.system.audit.retention.purged.label": {
        en: "Retention purge",
        es: "",
    },
    "audit.action.system.audit.tamper_detected.description": {
        en: "HMAC mismatch found",
        es: "",
    },
    "audit.action.system.audit.tamper_detected.label": {
        en: "Tamper detected",
        es: "",
    },
    "audit.action.system.audit.verified.description": {
        en: "HMAC verification completed",
        es: "",
    },
    "audit.action.system.audit.verified.label": {
        en: "Audit verified",
        es: "",
    },
    "audit.action.tenant.created.description": {
        en: "A new tenant was provisioned",
        es: "",
    },
    "audit.action.tenant.created.label": {
        en: "Tenant created",
        es: "",
    },
    "audit.action.tenant.disabled.description": {
        en: "Tenant was soft-deleted",
        es: "",
    },
    "audit.action.tenant.disabled.label": {
        en: "Tenant disabled",
        es: "",
    },
    "audit.action.tenant.restored.description": {
        en: "A previously disabled tenant was restored",
        es: "",
    },
    "audit.action.tenant.restored.label": {
        en: "Tenant restored",
        es: "",
    },
    "audit.action.tenant.updated.description": {
        en: "Tenant settings or metadata changed",
        es: "",
    },
    "audit.action.tenant.updated.label": {
        en: "Tenant updated",
        es: "",
    },
    "audit.action.training.completion.recorded.description": {
        en: "Worker completed a program",
        es: "",
    },
    "audit.action.training.completion.recorded.label": {
        en: "Training completed",
        es: "",
    },
    "audit.action.training.enrollment.created.description": {
        en: "Worker enrolled in a program",
        es: "",
    },
    "audit.action.training.enrollment.created.label": {
        en: "Training enrollment",
        es: "",
    },
    "audit.action.worker.application.submitted.description": {
        en: "Worker applied to a job",
        es: "",
    },
    "audit.action.worker.application.submitted.label": {
        en: "Application submitted",
        es: "",
    },
    "audit.action.worker.application.withdrawn.description": {
        en: "Worker withdrew an application",
        es: "",
    },
    "audit.action.worker.application.withdrawn.label": {
        en: "Application withdrawn",
        es: "",
    },
    "audit.action.worker.profile.updated.description": {
        en: "Worker edited their profile",
        es: "",
    },
    "audit.action.worker.profile.updated.label": {
        en: "Profile updated",
        es: "",
    },
    "audit.action.worker.resume.uploaded.description": {
        en: "Worker uploaded a resume",
        es: "",
    },
    "audit.action.worker.resume.uploaded.label": {
        en: "Resume uploaded",
        es: "",
    },
    "audit.drawer.action.copy_json": {
        en: "Copy as JSON",
        es: "",
    },
    "audit.drawer.action.verify": {
        en: "Verify HMAC",
        es: "",
    },
    "audit.drawer.action.view_actor": {
        en: "View actor timeline",
        es: "",
    },
    "audit.drawer.action.view_correlation": {
        en: "View correlation timeline",
        es: "",
    },
    "audit.drawer.section.actor": {
        en: "Actor",
        es: "",
    },
    "audit.drawer.section.correlation": {
        en: "Correlation",
        es: "",
    },
    "audit.drawer.section.metadata": {
        en: "Metadata",
        es: "",
    },
    "audit.drawer.section.outcome": {
        en: "Outcome",
        es: "",
    },
    "audit.drawer.section.resource": {
        en: "Resource",
        es: "",
    },
    "audit.drawer.verified.false": {
        en: "HMAC mismatch — possible tampering",
        es: "",
    },
    "audit.drawer.verified.true": {
        en: "HMAC verified",
        es: "",
    },
    "audit.filter.action.label": {
        en: "Action",
        es: "",
    },
    "audit.filter.action.prefix_mode": {
        en: "Match prefix",
        es: "",
    },
    "audit.filter.actor.label": {
        en: "Actor",
        es: "",
    },
    "audit.filter.correlation_id.label": {
        en: "Correlation ID",
        es: "",
    },
    "audit.filter.date.label": {
        en: "Date range",
        es: "",
    },
    "audit.filter.date.preset.1h": {
        en: "Last hour",
        es: "",
    },
    "audit.filter.date.preset.24h": {
        en: "Last 24 hours",
        es: "",
    },
    "audit.filter.date.preset.30d": {
        en: "Last 30 days",
        es: "",
    },
    "audit.filter.date.preset.7d": {
        en: "Last 7 days",
        es: "",
    },
    "audit.filter.date.preset.custom": {
        en: "Custom",
        es: "",
    },
    "audit.filter.outcome.both": {
        en: "All",
        es: "",
    },
    "audit.filter.outcome.failure": {
        en: "Failure",
        es: "",
    },
    "audit.filter.outcome.label": {
        en: "Outcome",
        es: "",
    },
    "audit.filter.outcome.success": {
        en: "Success",
        es: "",
    },
    "audit.filter.reset": {
        en: "Reset filters",
        es: "",
    },
    "audit.filter.resource.label": {
        en: "Resource",
        es: "",
    },
    "audit.filter.tenant.label": {
        en: "Tenant",
        es: "",
    },
    "audit.filter.tenant.placeholder": {
        en: "Select tenant",
        es: "",
    },
    "audit.page.subtitle": {
        en: "Every consequential action across this tenant",
        es: "",
    },
    "audit.page.title": {
        en: "Audit log",
        es: "",
    },
    "audit.table.column.action": {
        en: "Action",
        es: "",
    },
    "audit.table.column.actor": {
        en: "Actor",
        es: "",
    },
    "audit.table.column.outcome": {
        en: "Outcome",
        es: "",
    },
    "audit.table.column.resource": {
        en: "Resource",
        es: "",
    },
    "audit.table.column.time": {
        en: "Time",
        es: "",
    },
    "audit.table.empty.description": {
        en: "Try widening the date range or removing a filter.",
        es: "",
    },
    "audit.table.empty.title": {
        en: "No events match your filters",
        es: "",
    },
};
