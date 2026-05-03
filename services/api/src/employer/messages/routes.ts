import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { CreateConversationBody, SendMessageBody, ConversationListQuery } from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

export const employerMessagesRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerMessagesRoutes.use('*', requireAuth);
employerMessagesRoutes.use('*', requireRole('employer'));
employerMessagesRoutes.use('*', requireTenant);

employerMessagesRoutes.get('/', validate('query', ConversationListQuery), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const q = c.var.body;

  const convs = await c.var.db.conversation.findMany({
    where: { tenantId, employerId: userId, deletedAt: null },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
      participants: {
        where: { leftAt: null },
        include: { user: { select: { id: true, phone: true } } },
      },
    },
  });

  const shaped = convs.map((co) => {
    const myParticipant = co.participants.find((p) => p.userId === userId);
    const others = co.participants.filter((p) => p.userId !== userId);
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
      foremanPhone: co.channel === 'whatsapp' && others[0]?.user.phone ? others[0].user.phone : null,
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
  if (channel === 'whatsapp') return 'foremen';
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

employerMessagesRoutes.post('/', validate('json', CreateConversationBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const created = await c.var.db.$transaction(async (tx) => {
    const co = await tx.conversation.create({
      data: {
        tenantId,
        employerId: userId,
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

employerMessagesRoutes.get('/contacts', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const q = (c.req.query('q') ?? '').trim().toLowerCase();

  const applications = await c.var.db.application.findMany({
    where: { tenantId, job: { employerId: userId } },
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
    where: { tenantId, leftAt: null, crew: { employerId: userId, deletedAt: null } },
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

employerMessagesRoutes.get('/:id/messages', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const co = await c.var.db.conversation.findFirst({
    where: { id, tenantId, employerId: userId, deletedAt: null },
  });
  if (!co) return err(c, 404, 'not_found');

  const msgs = await c.var.db.message.findMany({
    where: { conversationId: id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  // Mark as read for the requesting user.
  await c.var.db.conversationParticipant.updateMany({
    where: { conversationId: id, userId },
    data: { unreadCount: 0, lastReadAt: new Date() },
  });

  return ok(c, {
    messages: msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderUserId: m.senderUserId,
      body: m.body,
      channel: m.channel,
      direction: m.direction,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

employerMessagesRoutes.post('/:id/messages', validate('json', SendMessageBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const co = await c.var.db.conversation.findFirst({
    where: { id, tenantId, employerId: userId, deletedAt: null },
  });
  if (!co) return err(c, 404, 'not_found');

  const msg = await c.var.db.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        tenantId,
        conversationId: id,
        senderUserId: userId,
        body: body.body,
        channel: body.channel ?? co.channel,
      },
    });
    await tx.conversation.update({
      where: { id },
      data: { lastMessageAt: created.createdAt },
    });
    // Bump unread on every other participant.
    await tx.conversationParticipant.updateMany({
      where: { conversationId: id, userId: { not: userId }, leftAt: null },
      data: { unreadCount: { increment: 1 } },
    });
    return created;
  });

  await c.var.audit.log({
    action: 'employer.message.sent',
    resourceId: msg.id,
    metadata: { conversationId: id, channel: msg.channel },
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
    },
  });
});
