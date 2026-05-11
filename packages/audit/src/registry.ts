// Action retention durations are derived from binding obligations:
//   13 mo (395 d) — auth events: SOC-2 CC7.2 YoY window
//   4 y  (1460)   — employment + recruitment records: CA Labor Code §1174(d)
//   7 y  (2555)   — placement, billing, training, cert, FLC, tenant, admin:
//                   composite of WIOA §116, 2 CFR §200.334, IRS §6001
//   90 d          — error.unhandled (Sentry has the detail)
// See docs/00-foundation/12-audit-log/02-data-model.md.

type RegistryEntry = {
  resourceType: string;
  retentionDays: number;
  metadata: ReadonlyArray<string>;
};

export const auditRegistry = {
  'auth.login': {
    resourceType: 'session',
    retentionDays: 395,
    metadata: ['method'],
  },
  'auth.logout': {
    resourceType: 'session',
    retentionDays: 395,
    metadata: [],
  },
  'auth.failed_login': {
    resourceType: 'session',
    retentionDays: 395,
    metadata: ['method', 'reason'],
  },
  'auth.role_changed': {
    resourceType: 'user',
    retentionDays: 2555,
    metadata: ['fromRole', 'toRole'],
  },
  'worker.profile.updated': {
    resourceType: 'worker_profile',
    retentionDays: 1460,
    metadata: ['fields'],
  },
  'worker.resume.uploaded': {
    resourceType: 'resume',
    retentionDays: 1460,
    metadata: ['fileBytes', 'mimeType', 'parserVersion'],
  },
  'worker.application.submitted': {
    resourceType: 'application',
    retentionDays: 2555,
    metadata: ['jobId', 'employerId'],
  },
  'worker.application.withdrawn': {
    resourceType: 'application',
    retentionDays: 2555,
    metadata: ['jobId', 'reason'],
  },
  'employer.flc.submitted': {
    resourceType: 'flc_license',
    retentionDays: 2555,
    metadata: ['licenseNumber'],
  },
  'employer.flc.verified': {
    resourceType: 'flc_license',
    retentionDays: 2555,
    metadata: ['licenseNumber', 'verifiedBy'],
  },
  'employer.flc.rejected': {
    resourceType: 'flc_license',
    retentionDays: 2555,
    metadata: ['licenseNumber', 'reason'],
  },
  'job.posting.created': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: ['title', 'county', 'wage', 'wageUnit'],
  },
  'job.posting.published': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: [],
  },
  'job.posting.closed': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: ['reason'],
  },
  'job.posting.edited': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: ['fields', 'renotificationsQueued', 'renotificationsSuppressed'],
  },
  'job.posting.republished': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: ['enqueued', 'autoMatchEnabled'],
  },
  'job.posting.reopened': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: [],
  },
  'job.posting.renotify.paused': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: [],
  },
  'job.posting.renotify.resumed': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: [],
  },
  'job.photo.uploaded': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: ['photoId', 'bytes'],
  },
  'job.photo.deleted': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: ['photoId'],
  },
  'job.screening.replaced': {
    resourceType: 'job_posting',
    retentionDays: 1460,
    metadata: ['count'],
  },
  'employer.contact.created': {
    resourceType: 'employer_contact',
    retentionDays: 1460,
    metadata: ['name', 'role'],
  },
  'employer.contact.deleted': {
    resourceType: 'employer_contact',
    retentionDays: 1460,
    metadata: [],
  },
  'application.status.changed': {
    resourceType: 'application',
    retentionDays: 2555,
    metadata: ['fromStatus', 'toStatus', 'jobId'],
  },
  'application.hired': {
    resourceType: 'application',
    retentionDays: 2555,
    metadata: ['jobId', 'employerId', 'startDate'],
  },
  'billing.subscription.created': {
    resourceType: 'stripe_subscription',
    retentionDays: 2555,
    metadata: ['plan', 'stripeSubscriptionId', 'priceId'],
  },
  'billing.subscription.canceled': {
    resourceType: 'stripe_subscription',
    retentionDays: 2555,
    metadata: ['plan', 'stripeSubscriptionId', 'reason'],
  },
  'billing.payment.succeeded': {
    resourceType: 'stripe_invoice',
    retentionDays: 2555,
    metadata: ['amountCents', 'currency', 'stripeInvoiceId'],
  },
  'billing.payment.failed': {
    resourceType: 'stripe_invoice',
    retentionDays: 2555,
    metadata: ['amountCents', 'currency', 'stripeInvoiceId', 'failureCode'],
  },
  'training.enrollment.created': {
    resourceType: 'training_enrollment',
    retentionDays: 2555,
    metadata: ['programId', 'workerId'],
  },
  'training.completion.recorded': {
    resourceType: 'training_completion',
    retentionDays: 2555,
    metadata: ['programId', 'workerId', 'hoursCompleted'],
  },
  'cert.issued': {
    resourceType: 'certificate',
    retentionDays: 2555,
    metadata: ['programId', 'workerId', 'completionDate', 'pdfUrl'],
  },
  'cert.revoked': {
    resourceType: 'certificate',
    retentionDays: 2555,
    metadata: ['reason'],
  },
  'tenant.created': {
    resourceType: 'tenant',
    retentionDays: 2555,
    metadata: ['slug', 'plan'],
  },
  'tenant.updated': {
    resourceType: 'tenant',
    retentionDays: 2555,
    metadata: ['fields'],
  },
  'tenant.disabled': {
    resourceType: 'tenant',
    retentionDays: 2555,
    metadata: [],
  },
  'tenant.restored': {
    resourceType: 'tenant',
    retentionDays: 2555,
    metadata: [],
  },
  'admin.impersonation.started': {
    resourceType: 'user',
    retentionDays: 2555,
    metadata: ['targetUserId', 'reason'],
  },
  'admin.impersonation.ended': {
    resourceType: 'user',
    retentionDays: 2555,
    metadata: ['durationSec'],
  },
  'admin.user.deleted': {
    resourceType: 'user',
    retentionDays: 2555,
    metadata: ['userType', 'reason'],
  },
  'admin.data.exported': {
    resourceType: 'export',
    retentionDays: 2555,
    metadata: ['exportType', 'rowCount', 'filterDigest'],
  },
  'admin.audit.redacted': {
    resourceType: 'audit_event',
    retentionDays: 2555,
    metadata: ['targetActorId', 'eventCount', 'requestId'],
  },
  'admin.translation.created': {
    resourceType: 'translation_key',
    retentionDays: 2555,
    metadata: ['namespace', 'key', 'locale', 'tenantScope'],
  },
  'admin.translation.updated': {
    resourceType: 'translation_key',
    retentionDays: 2555,
    metadata: ['namespace', 'key', 'locale', 'tenantScope', 'valueBytes'],
  },
  'admin.translation.deleted': {
    resourceType: 'translation_key',
    retentionDays: 2555,
    metadata: ['namespace', 'key', 'locale', 'tenantScope'],
  },
  'system.audit.retention.purged': {
    resourceType: 'audit_event',
    retentionDays: 2555,
    metadata: ['action', 'deletedCount', 'cutoff'],
  },
  'system.audit.verified': {
    resourceType: 'audit_event',
    retentionDays: 2555,
    metadata: ['rowCount', 'mismatchCount', 'partition'],
  },
  'system.audit.tamper_detected': {
    resourceType: 'audit_event',
    retentionDays: 2555,
    metadata: ['mismatchedIds', 'partition'],
  },
  'system.audit.breaker.recovered': {
    resourceType: 'audit_event',
    retentionDays: 2555,
    metadata: ['drainedCount', 'openedDurationMs', 'droppedCount'],
  },
  'system.sms.sent': {
    resourceType: 'sms_log',
    retentionDays: 395,
    metadata: ['template', 'providerSid', 'toPhone', 'dryRun'],
  },
  'system.sms.dropped': {
    resourceType: 'sms_log',
    retentionDays: 395,
    metadata: ['template', 'reason', 'toPhone'],
  },
  'system.sms.failed': {
    resourceType: 'sms_log',
    retentionDays: 395,
    metadata: ['template', 'errorCode', 'errorMessage', 'toPhone'],
  },
  'system.sms.opt_out_received': {
    resourceType: 'sms_opt_out',
    retentionDays: 2555,
    metadata: ['phone', 'source'],
  },
  'system.sms.opt_in_pending': {
    resourceType: 'user',
    retentionDays: 2555,
    metadata: ['phone', 'keyword', 'lang'],
  },
  'system.sms.opt_in_confirmed': {
    resourceType: 'user',
    retentionDays: 2555,
    metadata: ['phone', 'userId', 'lang'],
  },
  'system.sms.opt_in_expired': {
    resourceType: 'user',
    retentionDays: 2555,
    metadata: ['phone', 'userId', 'pendingSince'],
  },
  'auth.tenant.access_denied': {
    resourceType: 'tenant',
    retentionDays: 395,
    metadata: ['requestedTenantId', 'reason'],
  },
  'error.unhandled': {
    resourceType: 'request',
    retentionDays: 90,
    metadata: ['errorCode', 'route', 'method'],
  },
  'employer.crew.created': {
    resourceType: 'crew',
    retentionDays: 1460,
    metadata: ['crewId', 'name'],
  },
  'employer.crew.updated': {
    resourceType: 'crew',
    retentionDays: 1460,
    metadata: ['crewId', 'fields'],
  },
  'employer.crew.archived': {
    resourceType: 'crew',
    retentionDays: 1460,
    metadata: ['crewId'],
  },
  'employer.crew.member.added': {
    resourceType: 'crew_member',
    retentionDays: 1460,
    metadata: ['crewId', 'workerUserId', 'role'],
  },
  'employer.crew.member.removed': {
    resourceType: 'crew_member',
    retentionDays: 1460,
    metadata: ['crewId', 'workerUserId'],
  },
  'employer.shift.created': {
    resourceType: 'shift',
    retentionDays: 1460,
    metadata: ['shiftId', 'crewId', 'shiftDate'],
  },
  'employer.shift.updated': {
    resourceType: 'shift',
    retentionDays: 1460,
    metadata: ['shiftId', 'fields'],
  },
  'employer.shift.cancelled': {
    resourceType: 'shift',
    retentionDays: 1460,
    metadata: ['shiftId', 'reason'],
  },
  'employer.shift.assignment.created': {
    resourceType: 'shift_assignment',
    retentionDays: 1460,
    metadata: ['shiftId', 'workerUserId'],
  },
  'employer.shift.assignment.updated': {
    resourceType: 'shift_assignment',
    retentionDays: 1460,
    metadata: ['shiftId', 'assignmentId', 'fields'],
  },
  'employer.payroll.period.created': {
    resourceType: 'payroll_period',
    retentionDays: 2555,
    metadata: ['periodId', 'startDate', 'endDate'],
  },
  'employer.payroll.period.status_changed': {
    resourceType: 'payroll_period',
    retentionDays: 2555,
    metadata: ['periodId', 'fromStatus', 'toStatus'],
  },
  'employer.payroll.line.updated': {
    resourceType: 'payroll_line',
    retentionDays: 2555,
    metadata: ['lineId', 'periodId', 'fields'],
  },
  'employer.compliance.item.created': {
    resourceType: 'compliance_item',
    retentionDays: 2555,
    metadata: ['itemId', 'category', 'itemKey'],
  },
  'employer.compliance.item.updated': {
    resourceType: 'compliance_item',
    retentionDays: 2555,
    metadata: ['itemId', 'fields'],
  },
  'employer.compliance.item.deleted': {
    resourceType: 'compliance_item',
    retentionDays: 2555,
    metadata: ['itemId', 'label'],
  },
  'employer.compliance.item.evidence.uploaded': {
    resourceType: 'compliance_item',
    retentionDays: 2555,
    metadata: ['itemId', 'fileName', 'size', 'contentType'],
  },
  'employer.compliance.item.evidence.removed': {
    resourceType: 'compliance_item',
    retentionDays: 2555,
    metadata: ['itemId'],
  },
  'employer.message.conversation.created': {
    resourceType: 'conversation',
    retentionDays: 1460,
    metadata: ['conversationId', 'participantCount'],
  },
  'employer.message.sent': {
    resourceType: 'message',
    retentionDays: 1460,
    metadata: ['conversationId', 'channel'],
  },
} as const satisfies Record<string, RegistryEntry>;

export type AuditAction = keyof typeof auditRegistry;

export const isKnownAction = (action: string): action is AuditAction =>
  Object.prototype.hasOwnProperty.call(auditRegistry, action);
