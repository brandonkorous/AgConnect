// Accept an employer membership invitation. The caller is authenticated but
// not yet a member of the inviting employer, so the token lookup runs under
// the elevated (admin) role inside the shared pool — employer_contacts RLS is
// employer-scoped and would otherwise hide the row. Accepting links the
// invitation to the *current* identity (reusing an existing worker/user
// account if there is one); no second account is ever created.

import { Hono } from 'hono';
import { createHash } from 'node:crypto';
import { ok, err } from '@agconn/api-client/server';
import { dbClients } from '@agconn/db';
import { requireAuth, type AuthVars } from '../middleware/authContext.js';
import type { AuditCtxVars } from '../middleware/audit.js';

export const meEmployerInvitationsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
meEmployerInvitationsRoutes.use('*', requireAuth('shared'));

meEmployerInvitationsRoutes.post('/:token/accept', async (c) => {
  const token = c.req.param('token');
  const userId = c.var.userId;
  const hash = createHash('sha256').update(token).digest('hex');

  const result = await dbClients.shared.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);

    const contact = await tx.employerContact.findFirst({
      where: { inviteTokenHash: hash, deletedAt: null },
      select: {
        id: true,
        userId: true,
        acceptedAt: true,
        inviteExpiresAt: true,
        employer: { select: { id: true, legalName: true, dbaName: true } },
        role: { select: { key: true } },
      },
    });
    if (!contact) return { error: 'invalid' as const };
    if (contact.acceptedAt) return { error: 'already_accepted' as const };
    if (contact.inviteExpiresAt && contact.inviteExpiresAt.getTime() < Date.now()) {
      return { error: 'expired' as const };
    }
    if (contact.userId && contact.userId !== userId) {
      return { error: 'bound_elsewhere' as const };
    }

    await tx.employerContact.update({
      where: { id: contact.id },
      data: {
        userId,
        acceptedAt: new Date(),
        inviteTokenHash: null,
        inviteExpiresAt: null,
      },
    });

    return {
      ok: true as const,
      employerId: contact.employer.id,
      employerName: contact.employer.dbaName || contact.employer.legalName,
      roleKey: contact.role.key,
    };
  });

  if ('error' in result) {
    if (result.error === 'invalid') return err(c, 404, 'invalid_invite');
    if (result.error === 'already_accepted') return err(c, 409, 'already_accepted');
    if (result.error === 'expired') return err(c, 410, 'invite_expired');
    return err(c, 409, 'invite_bound_elsewhere');
  }

  await c.var.audit.log({
    action: 'employer.member.invite_accepted',
    resourceId: result.employerId,
    metadata: { roleKey: result.roleKey },
  });

  return ok(c, {
    employerId: result.employerId,
    employerName: result.employerName,
    roleKey: result.roleKey,
  });
});
