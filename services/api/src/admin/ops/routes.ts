import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { rowsToCsv, csvResponse } from '../_lib/csv.js';

export const adminOpsRoutes = new Hono<{ Variables: AdminOrgVars & AuditCtxVars }>();

adminOpsRoutes.use('*', clerkAdminAuthMiddleware);
adminOpsRoutes.use('*', requireAdminOrg('admin'));

// PII redaction: phone → +1 (***) ***-1234; email → j***@example.com.
// Defaults to redacted; admin requests ?reveal=true and the call is logged.
function redactPhone(p: string | null | undefined): string {
  if (!p) return '—';
  const tail = p.slice(-4);
  return `+1 (***) ***-${tail}`;
}
function redactEmail(e: string | null | undefined): string {
  if (!e) return '—';
  const [user, host] = e.split('@');
  if (!user || !host) return '***@***';
  return `${user[0] ?? '*'}***@${host}`;
}

// ─── messaging ──────────────────────────────────────────────────────────────

const listConversationsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    employerId: z.string().optional(),
    channel: z.enum(['app', 'sms']).optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminOpsRoutes.get(
  '/conversations',
  validate('query', listConversationsQuery),
  async (c) => {
    const q = c.var.body;
    const where: Record<string, unknown> = { deletedAt: null };
    if (q.employerId) where['employerId'] = q.employerId;
    if (q.channel) where['channel'] = q.channel;
    if (q.tenantId) where['tenantId'] = q.tenantId;
    if (q.search) {
      where['title'] = { contains: q.search, mode: 'insensitive' };
    }

    const rows = await c.var.db.conversation.findMany({
      where,
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      take: q.limit,
      include: {
        _count: { select: { messages: true, participants: true } },
      },
    });

    return ok(c, {
      conversations: rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        employerId: r.employerId,
        title: r.title,
        isGroup: r.isGroup,
        channel: r.channel,
        messageCount: r._count.messages,
        participantCount: r._count.participants,
        lastMessageAt: r.lastMessageAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  },
);

adminOpsRoutes.get('/conversations/:id', async (c) => {
  const id = c.req.param('id');
  const reveal = c.req.query('reveal') === 'true';
  const conv = await c.var.db.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: { id: true, email: true, phone: true, role: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 100 },
    },
  });
  if (!conv) return err(c, 404, 'not_found');

  if (reveal) {
    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'messaging.reveal',
        rowCount: conv.messages.length,
        filterDigest: JSON.stringify({ conversationId: id }),
      },
    });
  }

  return ok(c, {
    conversation: {
      id: conv.id,
      tenantId: conv.tenantId,
      employerId: conv.employerId,
      title: conv.title,
      isGroup: conv.isGroup,
      channel: conv.channel,
      pinnedShiftId: conv.pinnedShiftId,
      lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
      createdAt: conv.createdAt.toISOString(),
    },
    reveal,
    participants: conv.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      role: p.user.role,
      email: reveal ? p.user.email : redactEmail(p.user.email),
      phone: reveal ? p.user.phone : redactPhone(p.user.phone),
    })),
    messages: conv.messages.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      direction: m.direction,
      channel: m.channel,
      body: reveal ? m.body : '[redacted]',
      smsLogId: m.smsLogId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

const listKeywordsQuery = z
  .object({
    active: z.enum(['true', 'false']).optional(),
    tenantId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .strict();

adminOpsRoutes.get('/keywords', validate('query', listKeywordsQuery), async (c) => {
  const q = c.var.body;
  const where: Record<string, unknown> = {};
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.active === 'true') where['active'] = true;
  if (q.active === 'false') where['active'] = false;

  const rows = await c.var.db.smsKeyword.findMany({
    where,
    orderBy: [{ active: 'desc' }, { lastUsedAt: { sort: 'desc', nulls: 'last' } }],
    take: q.limit,
  });

  return ok(c, {
    keywords: rows.map((k) => ({
      id: k.id,
      tenantId: k.tenantId,
      keyword: k.keyword,
      kind: k.kind,
      entityId: k.entityId,
      active: k.active,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    })),
  });
});

// ─── sms ────────────────────────────────────────────────────────────────────

const listSmsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: z
      .enum(['queued', 'sent', 'delivered', 'failed', 'undelivered'])
      .optional(),
    template: z.string().max(100).optional(),
    tenantId: z.string().uuid().optional(),
    reveal: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminOpsRoutes.get('/sms', validate('query', listSmsQuery), async (c) => {
  const q = c.var.body;
  const reveal = q.reveal === 'true';
  const where: Record<string, unknown> = {};
  if (q.status) where['status'] = q.status;
  if (q.template) where['template'] = q.template;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.search) {
    where['OR'] = [
      { toPhone: { contains: q.search } },
      { providerSid: { contains: q.search } },
      { userId: { contains: q.search } },
    ];
  }

  const rows = await c.var.db.smsLog.findMany({
    where,
    orderBy: { queuedAt: 'desc' },
    take: q.limit,
  });

  if (reveal && rows.length > 0) {
    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'sms.reveal',
        rowCount: rows.length,
        filterDigest: JSON.stringify({ status: q.status, template: q.template }),
      },
    });
  }

  return ok(c, {
    reveal,
    sms: rows.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      userId: s.userId,
      template: s.template,
      locale: s.locale,
      toPhone: reveal ? s.toPhone : redactPhone(s.toPhone),
      body: reveal ? s.body : '[redacted]',
      status: s.status,
      providerSid: s.providerSid,
      errorCode: s.errorCode,
      queuedAt: s.queuedAt.toISOString(),
      sentAt: s.sentAt?.toISOString() ?? null,
      deliveredAt: s.deliveredAt?.toISOString() ?? null,
      failedAt: s.failedAt?.toISOString() ?? null,
    })),
  });
});

// CSV export — uses the same filter shape as the JSON endpoint. Limit is
// raised to 10k since downloads typically pull the full result set; reveal is
// honored and logged the same way.
const exportSmsQuery = listSmsQuery.extend({
  limit: z.coerce.number().int().min(1).max(10000).default(5000),
});

adminOpsRoutes.get('/sms/export.csv', validate('query', exportSmsQuery), async (c) => {
  const q = c.var.body;
  const reveal = q.reveal === 'true';
  const where: Record<string, unknown> = {};
  if (q.status) where['status'] = q.status;
  if (q.template) where['template'] = q.template;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.search) {
    where['OR'] = [
      { toPhone: { contains: q.search } },
      { providerSid: { contains: q.search } },
      { userId: { contains: q.search } },
    ];
  }
  const rows = await c.var.db.smsLog.findMany({
    where,
    orderBy: { queuedAt: 'desc' },
    take: q.limit,
  });

  await c.var.audit.log({
    action: 'admin.data.exported',
    metadata: {
      exportType: reveal ? 'sms.reveal' : 'sms.redacted',
      rowCount: rows.length,
      filterDigest: JSON.stringify({ status: q.status, template: q.template, search: q.search }),
    },
  });

  const csv = rowsToCsv(rows, [
    { header: 'queued_at', value: (r) => r.queuedAt.toISOString() },
    { header: 'tenant_id', value: (r) => r.tenantId },
    { header: 'user_id', value: (r) => r.userId },
    { header: 'template', value: (r) => r.template },
    { header: 'locale', value: (r) => r.locale },
    { header: 'to_phone', value: (r) => (reveal ? r.toPhone : '[redacted]') },
    { header: 'body', value: (r) => (reveal ? r.body : '[redacted]') },
    { header: 'status', value: (r) => r.status },
    { header: 'provider_sid', value: (r) => r.providerSid ?? '' },
    { header: 'error_code', value: (r) => r.errorCode ?? '' },
    { header: 'sent_at', value: (r) => r.sentAt?.toISOString() ?? '' },
    { header: 'delivered_at', value: (r) => r.deliveredAt?.toISOString() ?? '' },
    { header: 'failed_at', value: (r) => r.failedAt?.toISOString() ?? '' },
  ]);

  return csvResponse(c, `sms_log_${new Date().toISOString().slice(0, 10)}.csv`, csv);
});

const listOptOutsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    reveal: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .strict();

adminOpsRoutes.get('/sms/opt-outs', validate('query', listOptOutsQuery), async (c) => {
  const q = c.var.body;
  const reveal = q.reveal === 'true';
  const where: Record<string, unknown> = {};
  if (q.search) where['phone'] = { contains: q.search };

  const rows = await c.var.db.smsOptOut.findMany({
    where,
    orderBy: { optedOutAt: 'desc' },
    take: q.limit,
  });

  return ok(c, {
    reveal,
    optOuts: rows.map((r) => ({
      phone: reveal ? r.phone : redactPhone(r.phone),
      optedOutAt: r.optedOutAt.toISOString(),
      source: r.source,
    })),
  });
});

// ─── email ──────────────────────────────────────────────────────────────────

const listEmailQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    status: z
      .enum(['queued', 'sent', 'delivered', 'bounced', 'complained', 'failed'])
      .optional(),
    template: z.string().max(100).optional(),
    tenantId: z.string().uuid().optional(),
    reveal: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminOpsRoutes.get('/email', validate('query', listEmailQuery), async (c) => {
  const q = c.var.body;
  const reveal = q.reveal === 'true';
  const where: Record<string, unknown> = {};
  if (q.status) where['status'] = q.status;
  if (q.template) where['template'] = q.template;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.search) {
    where['OR'] = [
      { toEmail: { contains: q.search, mode: 'insensitive' } },
      { providerId: { contains: q.search } },
      { subject: { contains: q.search, mode: 'insensitive' } },
    ];
  }

  const rows = await c.var.db.emailLog.findMany({
    where,
    orderBy: { queuedAt: 'desc' },
    take: q.limit,
  });

  if (reveal && rows.length > 0) {
    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'email.reveal',
        rowCount: rows.length,
        filterDigest: JSON.stringify({ status: q.status, template: q.template }),
      },
    });
  }

  return ok(c, {
    reveal,
    emails: rows.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      template: e.template,
      locale: e.locale,
      toEmail: reveal ? e.toEmail : redactEmail(e.toEmail),
      fromEmail: e.fromEmail,
      subject: e.subject,
      status: e.status,
      providerId: e.providerId,
      errorMsg: e.errorMsg,
      refType: e.refType,
      refId: e.refId,
      queuedAt: e.queuedAt.toISOString(),
      sentAt: e.sentAt?.toISOString() ?? null,
      deliveredAt: e.deliveredAt?.toISOString() ?? null,
      bouncedAt: e.bouncedAt?.toISOString() ?? null,
      complainedAt: e.complainedAt?.toISOString() ?? null,
      failedAt: e.failedAt?.toISOString() ?? null,
    })),
  });
});

const exportEmailQuery = listEmailQuery.extend({
  limit: z.coerce.number().int().min(1).max(10000).default(5000),
});

adminOpsRoutes.get('/email/export.csv', validate('query', exportEmailQuery), async (c) => {
  const q = c.var.body;
  const reveal = q.reveal === 'true';
  const where: Record<string, unknown> = {};
  if (q.status) where['status'] = q.status;
  if (q.template) where['template'] = q.template;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.search) {
    where['OR'] = [
      { toEmail: { contains: q.search, mode: 'insensitive' } },
      { providerId: { contains: q.search } },
      { subject: { contains: q.search, mode: 'insensitive' } },
    ];
  }
  const rows = await c.var.db.emailLog.findMany({
    where,
    orderBy: { queuedAt: 'desc' },
    take: q.limit,
  });

  await c.var.audit.log({
    action: 'admin.data.exported',
    metadata: {
      exportType: reveal ? 'email.reveal' : 'email.redacted',
      rowCount: rows.length,
      filterDigest: JSON.stringify({ status: q.status, template: q.template, search: q.search }),
    },
  });

  const csv = rowsToCsv(rows, [
    { header: 'queued_at', value: (r) => r.queuedAt.toISOString() },
    { header: 'template', value: (r) => r.template },
    { header: 'locale', value: (r) => r.locale },
    { header: 'to_email', value: (r) => (reveal ? r.toEmail : '[redacted]') },
    { header: 'subject', value: (r) => r.subject },
    { header: 'status', value: (r) => r.status },
    { header: 'provider_id', value: (r) => r.providerId ?? '' },
    { header: 'error_msg', value: (r) => r.errorMsg ?? '' },
    { header: 'sent_at', value: (r) => r.sentAt?.toISOString() ?? '' },
    { header: 'delivered_at', value: (r) => r.deliveredAt?.toISOString() ?? '' },
    { header: 'bounced_at', value: (r) => r.bouncedAt?.toISOString() ?? '' },
    { header: 'complained_at', value: (r) => r.complainedAt?.toISOString() ?? '' },
  ]);

  return csvResponse(c, `email_log_${new Date().toISOString().slice(0, 10)}.csv`, csv);
});

const listSuppressionsQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    reason: z.enum(['bounce', 'complaint', 'manual', 'unsubscribe']).optional(),
    reveal: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .strict();

adminOpsRoutes.get(
  '/email/suppressions',
  validate('query', listSuppressionsQuery),
  async (c) => {
    const q = c.var.body;
    const reveal = q.reveal === 'true';
    const where: Record<string, unknown> = {};
    if (q.reason) where['reason'] = q.reason;
    if (q.search)
      where['email'] = { contains: q.search, mode: 'insensitive' };

    const rows = await c.var.db.emailSuppression.findMany({
      where,
      orderBy: { suppressedAt: 'desc' },
      take: q.limit,
    });

    return ok(c, {
      reveal,
      suppressions: rows.map((s) => ({
        email: reveal ? s.email : redactEmail(s.email),
        reason: s.reason,
        source: s.source,
        suppressedAt: s.suppressedAt.toISOString(),
      })),
    });
  },
);

// ─── billing ────────────────────────────────────────────────────────────────

const listBillingQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    eventType: z.string().max(100).optional(),
    employerId: z.string().uuid().optional(),
    tenantId: z.string().uuid().optional(),
    processed: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100),
  })
  .strict();

adminOpsRoutes.get('/billing', validate('query', listBillingQuery), async (c) => {
  const q = c.var.body;
  const where: Record<string, unknown> = {};
  if (q.eventType) where['eventType'] = q.eventType;
  if (q.employerId) where['employerId'] = q.employerId;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.processed === 'true') where['processedAt'] = { not: null };
  if (q.processed === 'false') where['processedAt'] = null;
  if (q.search) where['stripeEventId'] = { contains: q.search };

  const rows = await c.var.db.billingEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: q.limit,
    include: { employer: { select: { id: true, legalName: true } } },
  });

  return ok(c, {
    events: rows.map((b) => ({
      id: b.id,
      tenantId: b.tenantId,
      employerId: b.employerId,
      employerName: b.employer.legalName,
      eventType: b.eventType,
      stripeEventId: b.stripeEventId,
      processedAt: b.processedAt?.toISOString() ?? null,
      errorMsg: b.errorMsg,
      createdAt: b.createdAt.toISOString(),
    })),
  });
});

const exportBillingQuery = listBillingQuery.extend({
  limit: z.coerce.number().int().min(1).max(10000).default(5000),
});

adminOpsRoutes.get('/billing/export.csv', validate('query', exportBillingQuery), async (c) => {
  const q = c.var.body;
  const where: Record<string, unknown> = {};
  if (q.eventType) where['eventType'] = q.eventType;
  if (q.employerId) where['employerId'] = q.employerId;
  if (q.tenantId) where['tenantId'] = q.tenantId;
  if (q.processed === 'true') where['processedAt'] = { not: null };
  if (q.processed === 'false') where['processedAt'] = null;
  if (q.search) where['stripeEventId'] = { contains: q.search };

  const rows = await c.var.db.billingEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: q.limit,
    include: { employer: { select: { id: true, legalName: true } } },
  });

  await c.var.audit.log({
    action: 'admin.data.exported',
    metadata: {
      exportType: 'billing.events',
      rowCount: rows.length,
      filterDigest: JSON.stringify({
        eventType: q.eventType,
        processed: q.processed,
        search: q.search,
      }),
    },
  });

  const csv = rowsToCsv(rows, [
    { header: 'created_at', value: (r) => r.createdAt.toISOString() },
    { header: 'event_type', value: (r) => r.eventType },
    { header: 'employer_id', value: (r) => r.employerId },
    { header: 'employer_name', value: (r) => r.employer.legalName },
    { header: 'stripe_event_id', value: (r) => r.stripeEventId },
    { header: 'processed_at', value: (r) => r.processedAt?.toISOString() ?? '' },
    { header: 'error_msg', value: (r) => r.errorMsg ?? '' },
  ]);

  return csvResponse(c, `billing_events_${new Date().toISOString().slice(0, 10)}.csv`, csv);
});

adminOpsRoutes.get('/billing/:id', async (c) => {
  const id = c.req.param('id');
  const b = await c.var.db.billingEvent.findUnique({
    where: { id },
    include: { employer: { select: { id: true, legalName: true } } },
  });
  if (!b) return err(c, 404, 'not_found');

  return ok(c, {
    event: {
      id: b.id,
      tenantId: b.tenantId,
      employerId: b.employerId,
      employerName: b.employer.legalName,
      eventType: b.eventType,
      stripeEventId: b.stripeEventId,
      payload: b.payload,
      processedAt: b.processedAt?.toISOString() ?? null,
      errorMsg: b.errorMsg,
      createdAt: b.createdAt.toISOString(),
    },
  });
});

// ─── waitlist ───────────────────────────────────────────────────────────────

const listWaitlistQuery = z
  .object({
    search: z.string().min(1).max(200).optional(),
    audience: z.enum(['worker', 'employer', 'training_org', 'other']).optional(),
    source: z.string().max(100).optional(),
    state: z
      .enum(['pending', 'confirmed', 'welcomed', 'unsubscribed'])
      .optional(),
    reveal: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .strict();

const exportWaitlistQuery = listWaitlistQuery.extend({
  limit: z.coerce.number().int().min(1).max(20000).default(10000),
});

adminOpsRoutes.get('/waitlist/export.csv', validate('query', exportWaitlistQuery), async (c) => {
  const q = c.var.body;
  const reveal = q.reveal === 'true';
  const where: Record<string, unknown> = {};
  if (q.audience) where['audience'] = q.audience;
  if (q.source) where['source'] = q.source;
  if (q.state === 'pending') {
    where['confirmedAt'] = null;
    where['unsubscribedAt'] = null;
  }
  if (q.state === 'confirmed') {
    where['confirmedAt'] = { not: null };
    where['welcomedAt'] = null;
    where['unsubscribedAt'] = null;
  }
  if (q.state === 'welcomed') where['welcomedAt'] = { not: null };
  if (q.state === 'unsubscribed') where['unsubscribedAt'] = { not: null };
  if (q.search) {
    where['OR'] = [
      { email: { contains: q.search, mode: 'insensitive' } },
      { phone: { contains: q.search } },
    ];
  }
  const rows = await c.var.db.waitlist.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: q.limit,
  });

  await c.var.audit.log({
    action: 'admin.data.exported',
    metadata: {
      exportType: reveal ? 'waitlist.reveal' : 'waitlist.redacted',
      rowCount: rows.length,
      filterDigest: JSON.stringify({ audience: q.audience, state: q.state, search: q.search }),
    },
  });

  const csv = rowsToCsv(rows, [
    { header: 'created_at', value: (r) => r.createdAt.toISOString() },
    { header: 'audience', value: (r) => r.audience ?? '' },
    { header: 'email', value: (r) => (reveal ? (r.email ?? '') : '[redacted]') },
    { header: 'phone', value: (r) => (reveal ? (r.phone ?? '') : '[redacted]') },
    { header: 'county', value: (r) => r.county ?? '' },
    { header: 'preferred_lang', value: (r) => r.preferredLang },
    { header: 'source', value: (r) => r.source ?? '' },
    { header: 'confirmed_at', value: (r) => r.confirmedAt?.toISOString() ?? '' },
    { header: 'welcomed_at', value: (r) => r.welcomedAt?.toISOString() ?? '' },
    { header: 'unsubscribed_at', value: (r) => r.unsubscribedAt?.toISOString() ?? '' },
  ]);

  return csvResponse(c, `waitlist_${new Date().toISOString().slice(0, 10)}.csv`, csv);
});

adminOpsRoutes.get('/waitlist', validate('query', listWaitlistQuery), async (c) => {
  const q = c.var.body;
  const reveal = q.reveal === 'true';
  const where: Record<string, unknown> = {};
  if (q.audience) where['audience'] = q.audience;
  if (q.source) where['source'] = q.source;
  if (q.state === 'pending') {
    where['confirmedAt'] = null;
    where['unsubscribedAt'] = null;
  }
  if (q.state === 'confirmed') {
    where['confirmedAt'] = { not: null };
    where['welcomedAt'] = null;
    where['unsubscribedAt'] = null;
  }
  if (q.state === 'welcomed') where['welcomedAt'] = { not: null };
  if (q.state === 'unsubscribed') where['unsubscribedAt'] = { not: null };
  if (q.search) {
    where['OR'] = [
      { email: { contains: q.search, mode: 'insensitive' } },
      { phone: { contains: q.search } },
    ];
  }

  const rows = await c.var.db.waitlist.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: q.limit,
  });

  const summary = await c.var.db.waitlist.groupBy({
    by: ['audience'],
    _count: { _all: true },
  });

  if (reveal && rows.length > 0) {
    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'waitlist.reveal',
        rowCount: rows.length,
        filterDigest: JSON.stringify({ audience: q.audience, state: q.state }),
      },
    });
  }

  return ok(c, {
    reveal,
    summary: summary.map((s) => ({
      audience: s.audience ?? 'unspecified',
      count: s._count._all,
    })),
    rows: rows.map((w) => ({
      id: w.id,
      tenantId: w.tenantId,
      email: reveal ? w.email : redactEmail(w.email),
      phone: reveal ? w.phone : redactPhone(w.phone),
      county: w.county,
      preferredLang: w.preferredLang,
      audience: w.audience,
      source: w.source,
      confirmedAt: w.confirmedAt?.toISOString() ?? null,
      welcomedAt: w.welcomedAt?.toISOString() ?? null,
      unsubscribedAt: w.unsubscribedAt?.toISOString() ?? null,
      createdAt: w.createdAt.toISOString(),
    })),
  });
});
