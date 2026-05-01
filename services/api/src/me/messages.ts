import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import { MessageChannel, MessageDirection } from '@agconn/db';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

// Worker-facing inbox + thread view. Only conversations the worker is a
// participant in are returned. Sending is mirrored to SMS when the
// conversation channel is sms/whatsapp; otherwise the message stays in-app.

export const meMessagesRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
meMessagesRoutes.use('*', requireAuth);
meMessagesRoutes.use('*', requireRole('worker'));

meMessagesRoutes.get('/', async (c) => {
  const workerId = c.var.userId;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');

  const participations = await c.var.db.conversationParticipant.findMany({
    where: { userId: workerId, leftAt: null, conversation: { deletedAt: null } },
    include: {
      conversation: {
        include: {
          employer: { include: { employerProfile: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: 'desc' } },
    take: 50,
  });

  const totalUnread = participations.reduce(
    (acc, p) => acc + (p.unreadCount ?? 0),
    0,
  );

  return ok(c, {
    threads: participations.map((p) => {
      const last = p.conversation.messages[0];
      return {
        id: p.conversation.id,
        title: p.conversation.title,
        channel: p.conversation.channel,
        unreadCount: p.unreadCount,
        lastMessageAt: p.conversation.lastMessageAt?.toISOString() ?? null,
        employer:
          p.conversation.employer?.employerProfile?.dbaName ??
          p.conversation.employer?.employerProfile?.legalName ??
          'AgConn employer',
        lastMessage: last
          ? {
              body: last.body,
              senderUserId: last.senderUserId,
              direction: last.direction,
              createdAt: last.createdAt.toISOString(),
            }
          : null,
      };
    }),
    totalUnread,
  });
});

meMessagesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const workerId = c.var.userId;

  const participant = await c.var.db.conversationParticipant.findFirst({
    where: { conversationId: id, userId: workerId, leftAt: null },
  });
  if (!participant) return err(c, 404, 'not_found');

  const conv = await c.var.db.conversation.findFirst({
    where: { id, deletedAt: null },
    include: { employer: { include: { employerProfile: true } } },
  });
  if (!conv) return err(c, 404, 'not_found');

  const messages = await c.var.db.message.findMany({
    where: { conversationId: id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  // Mark read on access — bumps unreadCount to 0 + records lastReadAt.
  await c.var.db.conversationParticipant.update({
    where: { id: participant.id },
    data: { unreadCount: 0, lastReadAt: new Date() },
  });

  return ok(c, {
    conversation: {
      id: conv.id,
      title: conv.title,
      channel: conv.channel,
      employer:
        conv.employer?.employerProfile?.dbaName ??
        conv.employer?.employerProfile?.legalName ??
        'AgConn employer',
      pinnedShiftId: conv.pinnedShiftId,
    },
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderUserId: m.senderUserId,
      direction: m.direction,
      channel: m.channel,
      isMe: m.senderUserId === workerId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

const SendBody = z.object({ body: z.string().min(1).max(2000) });

meMessagesRoutes.post('/:id/send', validate('json', SendBody), async (c) => {
  const id = c.req.param('id');
  const workerId = c.var.userId;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');

  const participant = await c.var.db.conversationParticipant.findFirst({
    where: { conversationId: id, userId: workerId, leftAt: null },
  });
  if (!participant) return err(c, 404, 'not_found');

  const conv = await c.var.db.conversation.findFirst({
    where: { id, deletedAt: null },
  });
  if (!conv) return err(c, 404, 'not_found');

  const message = await c.var.db.message.create({
    data: {
      tenantId,
      conversationId: id,
      senderUserId: workerId,
      body: c.var.body.body,
      direction: MessageDirection.outbound,
      channel: conv.channel ?? MessageChannel.app,
    },
  });

  await c.var.db.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  // Bump unread for everyone else.
  await c.var.db.conversationParticipant.updateMany({
    where: { conversationId: id, userId: { not: workerId } },
    data: { unreadCount: { increment: 1 } },
  });

  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: id,
    metadata: { fields: 'message.sent' },
  });

  return ok(c, {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  });
});
