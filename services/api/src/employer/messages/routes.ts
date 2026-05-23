import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { CreateConversationBody, SendMessageBody, ConversationListQuery } from '@agconn/schemas';
import { enqueueSms } from '@agconn/sms';
import {
    requireAuth,
    requireActiveEmployer,
    requireEmployerPermission,
    requireTenant,
    type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const employerMessagesRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerMessagesRoutes.use('*', requireAuth('employer'));
employerMessagesRoutes.use('*', requireActiveEmployer);
employerMessagesRoutes.use('*', requireTenant);

employerMessagesRoutes.get('/', requireEmployerPermission('messaging.use'), validate('query', ConversationListQuery), async (c) => {
    const userId = c.var.userId;
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const q = c.var.body;

    const convs = await c.var.db.conversation.findMany({
        where: { tenantId, employerId, deletedAt: null },
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
        include: {
            messages: { take: 1, orderBy: { createdAt: 'desc' } },
            participants: {
                where: { leftAt: null },
            },
        },
    });

    const shaped = convs.map((co) => {
        const myParticipant = co.participants.find((p) => p.userId === userId);
        const category = classifyConversation(co.channel, co.isGroup);
        return {
            id: co.id,
            title: co.title,
            isGroup: co.isGroup,
            channel: co.channel,
            pinnedShiftId: co.pinnedShiftId,
            lastMessageAt: co.lastMessageAt?.toISOString() ?? null,
            unreadCount: myParticipant?.unreadCount ?? 0,
            preview: co.messages[0]?.body.slice(0, 200) ?? '',
            category,
            foremanPhone: null,
            participantCount: co.participants.length,
        };
    });

    const filtered =
        q.folder === 'all' ? shaped : shaped.filter((co) => co.category === q.folder);

    return ok(c, {
        conversations: filtered.slice(0, q.limit),
        counts: countByFolder(shaped),
    });
});

function classifyConversation(
    channel: 'app' | 'sms' | 'whatsapp' | 'broadcast',
    isGroup: boolean,
): 'candidates' | 'crew' | 'foremen' | 'broadcasts' {
    if (channel === 'broadcast') return 'broadcasts';
    if (isGroup) return 'crew';
    return 'candidates';
}

function countByFolder(items: { category: string }[]): {
    all: number;
    candidates: number;
    crew: number;
    foremen: number;
    broadcasts: number;
} {
    const counts = { all: items.length, candidates: 0, crew: 0, foremen: 0, broadcasts: 0 };
    for (const it of items) {
        if (it.category === 'candidates') counts.candidates += 1;
        else if (it.category === 'crew') counts.crew += 1;
        else if (it.category === 'foremen') counts.foremen += 1;
        else if (it.category === 'broadcasts') counts.broadcasts += 1;
    }
    return counts;
}

employerMessagesRoutes.post('/', requireEmployerPermission('messaging.use'), validate('json', CreateConversationBody), async (c) => {
    const userId = c.var.userId;
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const body = c.var.body;

    const created = await c.var.db.$transaction(async (tx) => {
        const co = await tx.conversation.create({
            data: {
                tenantId,
                employerId,
                title: body.title,
                isGroup: body.isGroup,
                channel: body.channel,
                pinnedShiftId: body.pinnedShiftId ?? null,
            },
        });
        const participantIds = Array.from(new Set([userId, ...body.participantUserIds]));
        await tx.conversationParticipant.createMany({
            data: participantIds.map((uid) => ({
                tenantId,
                conversationId: co.id,
                userId: uid,
            })),
        });
        return co;
    });

    await c.var.audit.log({
        action: 'employer.message.conversation.created',
        resourceId: created.id,
        metadata: {
            conversationId: created.id,
            participantCount: body.participantUserIds.length + 1,
        },
    });

    return ok(c, {
        conversation: {
            id: created.id,
            title: created.title,
            isGroup: created.isGroup,
            channel: created.channel,
            pinnedShiftId: created.pinnedShiftId,
            lastMessageAt: null,
            unreadCount: 0,
            preview: '',
        },
    });
});

employerMessagesRoutes.get('/contacts', requireEmployerPermission('messaging.use'), async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const q = (c.req.query('q') ?? '').trim().toLowerCase();

    const applications = await c.var.db.application.findMany({
        where: { tenantId, job: { employerId } },
        select: {
            status: true,
            worker: {
                select: {
                    id: true,
                    phone: true,
                    workerProfile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            county: true,
                        },
                    },
                },
            },
        },
    });

    const crewMembers = await c.var.db.crewMember.findMany({
        where: { tenantId, leftAt: null, crew: { employerId, deletedAt: null } },
        select: {
            role: true,
            worker: {
                select: {
                    id: true,
                    phone: true,
                    workerProfile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            county: true,
                        },
                    },
                },
            },
        },
    });

    type Contact = {
        id: string;
        firstName: string;
        lastInitial: string;
        county: string | null;
        phone: string | null;
        relationship: 'hired' | 'crew' | 'applied' | 'reviewed';
    };

    const byId = new Map<string, Contact>();
    const rank: Record<Contact['relationship'], number> = {
        crew: 0,
        hired: 1,
        reviewed: 2,
        applied: 3,
    };

    for (const a of applications) {
        if (!a.worker) continue;
        const profile = a.worker.workerProfile;
        if (!profile) continue;
        const rel: Contact['relationship'] =
            a.status === 'hired'
                ? 'hired'
                : a.status === 'reviewed'
                    ? 'reviewed'
                    : 'applied';
        const c0: Contact = {
            id: a.worker.id,
            firstName: profile.firstName,
            lastInitial: profile.lastName?.charAt(0).toUpperCase() ?? '',
            county: profile.county,
            phone: a.worker.phone,
            relationship: rel,
        };
        const existing = byId.get(c0.id);
        if (!existing || rank[c0.relationship] < rank[existing.relationship]) {
            byId.set(c0.id, c0);
        }
    }

    for (const m of crewMembers) {
        if (!m.worker) continue;
        const profile = m.worker.workerProfile;
        if (!profile) continue;
        const c0: Contact = {
            id: m.worker.id,
            firstName: profile.firstName,
            lastInitial: profile.lastName?.charAt(0).toUpperCase() ?? '',
            county: profile.county,
            phone: m.worker.phone,
            relationship: 'crew',
        };
        const existing = byId.get(c0.id);
        if (!existing || rank[c0.relationship] < rank[existing.relationship]) {
            byId.set(c0.id, c0);
        }
    }

    const all = Array.from(byId.values());
    const filtered = q
        ? all.filter(
            (c2) =>
                c2.firstName.toLowerCase().includes(q) ||
                c2.lastInitial.toLowerCase().includes(q) ||
                (c2.county?.toLowerCase().includes(q) ?? false),
        )
        : all;

    filtered.sort((a, b) => {
        const r = rank[a.relationship] - rank[b.relationship];
        if (r !== 0) return r;
        return a.firstName.localeCompare(b.firstName);
    });

    return ok(c, { contacts: filtered.slice(0, 200) });
});

employerMessagesRoutes.get('/:id/messages', requireEmployerPermission('messaging.use'), async (c) => {
    const userId = c.var.userId;
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');

    const co = await c.var.db.conversation.findFirst({
        where: { id, tenantId, employerId, deletedAt: null },
    });
    if (!co) return err(c, 404, 'not_found');

    const [msgs, otherParticipants] = await Promise.all([
        c.var.db.message.findMany({
            where: { conversationId: id, deletedAt: null },
            orderBy: { createdAt: 'asc' },
            take: 200,
        }),
        c.var.db.conversationParticipant.findMany({
            where: { conversationId: id, userId: { not: userId }, leftAt: null },
            select: { userId: true, lastReadAt: true },
        }),
    ]);

    // Mark as read for the requesting user.
    await c.var.db.conversationParticipant.updateMany({
        where: { conversationId: id, userId },
        data: { unreadCount: 0, lastReadAt: new Date() },
    });

    return ok(c, {
        messages: msgs.map((m) => {
            const meta = (m.metadata ?? {}) as { broadcast?: { queued: number; optedOut: number; noPhone: number } };
            return {
                id: m.id,
                conversationId: m.conversationId,
                senderUserId: m.senderUserId,
                body: m.body,
                channel: m.channel,
                direction: m.direction,
                createdAt: m.createdAt.toISOString(),
                broadcastDelivery: meta.broadcast ?? null,
            };
        }),
        counterpartiesRead: otherParticipants.map((p) => ({
            userId: p.userId,
            lastReadAt: p.lastReadAt?.toISOString() ?? null,
        })),
    });
});

employerMessagesRoutes.post('/:id/messages', requireEmployerPermission('messaging.use'), validate('json', SendMessageBody), async (c) => {
    const userId = c.var.userId;
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const body = c.var.body;

    const co = await c.var.db.conversation.findFirst({
        where: { id, tenantId, employerId, deletedAt: null },
    });
    if (!co) return err(c, 404, 'not_found');

    const isBroadcast = co.channel === 'broadcast';

    let queued = 0;
    let optedOut = 0;
    let noPhone = 0;

    if (isBroadcast) {
        const recipients = await c.var.db.conversationParticipant.findMany({
            where: { conversationId: id, userId: { not: userId }, leftAt: null },
            include: { user: { select: { id: true, phone: true } } },
        });
        const phones = recipients.map((r) => r.user.phone).filter((p): p is string => Boolean(p));
        const optOuts = phones.length
            ? await c.var.db.smsOptOut.findMany({ where: { phone: { in: phones } } })
            : [];
        const optOutSet = new Set(optOuts.map((o) => o.phone));
        for (const r of recipients) {
            if (!r.user.phone) noPhone += 1;
            else if (optOutSet.has(r.user.phone)) optedOut += 1;
            else queued += 1;
        }
    }

    const employer = await c.var.db.employerProfile.findUnique({
        where: { id: employerId },
        select: { dbaName: true, legalName: true },
    });
    const employerLabel = employer?.dbaName ?? employer?.legalName ?? 'AGCONN';

    const msg = await c.var.db.$transaction(async (tx) => {
        const created = await tx.message.create({
            data: {
                tenantId,
                conversationId: id,
                senderUserId: userId,
                body: body.body,
                channel: body.channel ?? co.channel,
                metadata: isBroadcast
                    ? { broadcast: { queued, optedOut, noPhone } }
                    : {},
            },
        });
        await tx.conversation.update({
            where: { id },
            data: { lastMessageAt: created.createdAt },
        });
        await tx.conversationParticipant.updateMany({
            where: { conversationId: id, userId: { not: userId }, leftAt: null },
            data: { unreadCount: { increment: 1 } },
        });
        return created;
    });

    if (isBroadcast) {
        const recipients = await c.var.db.conversationParticipant.findMany({
            where: { conversationId: id, userId: { not: userId }, leftAt: null },
            include: { user: { select: { id: true, phone: true } } },
        });
        for (const r of recipients) {
            if (!r.user.phone) continue;
            try {
                await enqueueSms({
                    tenantId,
                    userId: r.userId,
                    template: 'employer.broadcast',
                    vars: { employer: employerLabel, body: body.body },
                    jobKey: `broadcast-${msg.id}-${r.userId}`,
                    messageId: msg.id,
                });
            } catch (e) {
                console.error('[broadcast] enqueueSms failed', {
                    messageId: msg.id,
                    recipient: r.userId,
                    err: e instanceof Error ? e.message : String(e),
                });
            }
        }
    }

    await c.var.audit.log({
        action: 'employer.message.sent',
        resourceId: msg.id,
        metadata: {
            conversationId: id,
            channel: msg.channel,
            broadcast: isBroadcast,
            queued,
            optedOut,
            noPhone,
        },
    });

    return ok(c, {
        message: {
            id: msg.id,
            conversationId: msg.conversationId,
            senderUserId: msg.senderUserId,
            body: msg.body,
            channel: msg.channel,
            direction: msg.direction,
            createdAt: msg.createdAt.toISOString(),
            broadcastDelivery: isBroadcast ? { queued, optedOut, noPhone } : null,
        },
    });
});

// Per-recipient delivery state for a broadcast message.
employerMessagesRoutes.get('/:id/messages/:messageId/deliveries', requireEmployerPermission('messaging.use'), async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const messageId = c.req.param('messageId');

    const co = await c.var.db.conversation.findFirst({
        where: { id, tenantId, employerId, deletedAt: null },
    });
    if (!co) return err(c, 404, 'not_found');

    const message = await c.var.db.message.findFirst({
        where: { id: messageId, conversationId: id, tenantId },
    });
    if (!message) return err(c, 404, 'not_found');

    const logs = await c.var.db.smsLog.findMany({
        where: { tenantId, messageId },
        orderBy: { queuedAt: 'asc' },
    });

    return ok(c, {
        deliveries: logs.map((l) => ({
            id: l.id,
            userId: l.userId,
            toPhone: l.toPhone,
            status: l.status,
            queuedAt: l.queuedAt.toISOString(),
            sentAt: l.sentAt?.toISOString() ?? null,
            deliveredAt: l.deliveredAt?.toISOString() ?? null,
            failedAt: l.failedAt?.toISOString() ?? null,
            optedOutAt: l.optedOutAt?.toISOString() ?? null,
            errorCode: l.errorCode,
        })),
        summary: summarize(logs.map((l) => l.status)),
    });
});

function summarize(statuses: string[]): {
    queued: number;
    sending: number;
    sent: number;
    delivered: number;
    failed: number;
    dropped: number;
} {
    const out = { queued: 0, sending: 0, sent: 0, delivered: 0, failed: 0, dropped: 0 };
    for (const s of statuses) {
        if (s === 'queued') out.queued += 1;
        else if (s === 'sending') out.sending += 1;
        else if (s === 'sent') out.sent += 1;
        else if (s === 'delivered') out.delivered += 1;
        else if (s === 'failed') out.failed += 1;
        else if (s === 'dropped') out.dropped += 1;
    }
    return out;
}
