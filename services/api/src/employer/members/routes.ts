// Employer roster + membership management. employer_contacts is the single
// roster: a row with userId + acceptedAt is a platform member scoped by role;
// userId null is an SMS-only contact / pending invite. The owner is mirrored
// by employer_profiles.ownerContactId and reassigned only via transfer-owner.

import { Hono } from 'hono';
import { randomBytes, createHash } from 'node:crypto';
import { ok, err, validate } from '@agconn/api-client/server';
import { dbClients, type Tx } from '@agconn/db';
import {
  MemberInput,
  MemberPatch,
  TransferOwnerBody,
  type MemberView,
} from '@agconn/schemas';
import { enqueueEmployerEmail } from '@agconn/email';
import {
  requireAuth,
  requireActiveEmployer,
  requireEmployerPermission,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';

export const employerMembersRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerMembersRoutes.use('*', requireAuth('employer'));
employerMembersRoutes.use('*', requireActiveEmployer);
employerMembersRoutes.use('*', requireTenant);

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

type RosterRow = {
  id: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string;
  languages: string[];
  sortOrder: number;
  invitedAt: Date | null;
  acceptedAt: Date | null;
  role: { key: string; scopeQualifier: string | null };
};

function statusOf(r: RosterRow): MemberView['status'] {
  if (r.acceptedAt) return 'active';
  if (r.invitedAt) return 'invited';
  return 'sms_only';
}

function toView(r: RosterRow, ownerContactId: string | null): MemberView {
  return {
    id: r.id,
    userId: r.userId,
    name: r.name,
    email: r.email,
    phone: r.phone,
    roleKey: r.role.key,
    scopeQualifier: r.role.scopeQualifier,
    languages: r.languages as ('en' | 'es')[],
    sortOrder: r.sortOrder,
    status: statusOf(r),
    isOwner: r.id === ownerContactId,
    invitedAt: r.invitedAt?.toISOString() ?? null,
    acceptedAt: r.acceptedAt?.toISOString() ?? null,
  };
}

const ROW_SELECT = {
  id: true,
  userId: true,
  name: true,
  email: true,
  phone: true,
  languages: true,
  sortOrder: true,
  invitedAt: true,
  acceptedAt: true,
  role: { select: { key: true, scopeQualifier: true } },
} as const;

async function resolveAssignableRole(db: Tx, key: string) {
  return db.role.findFirst({
    where: { tenantId: null, key, deletedAt: null },
    select: { id: true, key: true },
  });
}

async function ownerContactId(db: Tx, employerId: string): Promise<string | null> {
  const ep = await db.employerProfile.findUnique({
    where: { id: employerId },
    select: { ownerContactId: true },
  });
  return ep?.ownerContactId ?? null;
}

function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

type MembersDb = AuthVars['db'];

async function sendInvite(
  db: MembersDb,
  ctx: { employerId: string; tenantId: string; userId: string },
  contact: { id: string; email: string; name: string; languages: string[]; roleKey: string },
  token: string,
) {
  const inviter = await db.employerContact.findFirst({
    where: { employerId: ctx.employerId, userId: ctx.userId, deletedAt: null },
    select: { name: true },
  });
  const profile = await db.employerProfile.findUnique({
    where: { id: ctx.employerId },
    select: { legalName: true, dbaName: true },
  });
  const locale = contact.languages[0] === 'en' ? 'en' : 'es';
  await enqueueEmployerEmail({
    template: 'employer.member_invite',
    employerId: ctx.employerId,
    tenantId: ctx.tenantId,
    to: contact.email,
    locale,
    vars: {
      token,
      inviterName: inviter?.name ?? 'A teammate',
      employerName: profile?.dbaName || profile?.legalName || 'AGCONN',
      roleLabel: contact.roleKey.replace(/_/g, ' '),
    },
    idempotencyKey: `member-invite-${contact.id}-${Date.now()}`,
  });
}

employerMembersRoutes.get(
  '/',
  requireEmployerPermission('members.read'),
  async (c) => {
    const employerId = c.var.employerId!;
    const [rows, ownerId] = await Promise.all([
      c.var.db.employerContact.findMany({
        where: { employerId, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: ROW_SELECT,
      }),
      ownerContactId(c.var.db as unknown as Tx, employerId),
    ]);
    return ok(c, { members: rows.map((r) => toView(r as RosterRow, ownerId)) });
  },
);

employerMembersRoutes.post(
  '/',
  requireEmployerPermission('members.manage'),
  validate('json', MemberInput),
  async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const body = c.var.body;

    const role = await resolveAssignableRole(c.var.db as unknown as Tx, body.roleKey);
    if (!role) return err(c, 422, 'unknown_role');

    const wantsInvite = body.invite && Boolean(body.email);
    const tok = wantsInvite ? newToken() : null;

    const created = await c.var.db.employerContact.create({
      data: {
        tenantId,
        employerId,
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        roleId: role.id,
        languages: body.languages,
        sortOrder: body.sortOrder,
        ...(tok
          ? {
              invitedAt: new Date(),
              inviteTokenHash: tok.hash,
              inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
            }
          : {}),
      },
      select: ROW_SELECT,
    });

    if (tok && body.email) {
      await sendInvite(
        c.var.db,
        { employerId, tenantId, userId: c.var.userId },
        { id: created.id, email: body.email, name: body.name, languages: body.languages, roleKey: role.key },
        tok.token,
      );
    }

    await c.var.audit.log({
      action: 'employer.member.created',
      resourceId: created.id,
      metadata: { roleKey: role.key, invited: Boolean(tok) },
    });

    const ownerId = await ownerContactId(c.var.db as unknown as Tx, employerId);
    return ok(c, { member: toView(created as RosterRow, ownerId) });
  },
);

employerMembersRoutes.post(
  '/:id/invite',
  requireEmployerPermission('members.manage'),
  async (c) => {
    const employerId = c.var.employerId!;
    const id = c.req.param('id');
    const contact = await c.var.db.employerContact.findFirst({
      where: { id, employerId, deletedAt: null },
      select: { id: true, email: true, name: true, languages: true, role: { select: { key: true } } },
    });
    if (!contact) return err(c, 404, 'not_found');
    if (!contact.email) return err(c, 422, 'no_email', 'contact has no email to invite');

    const tok = newToken();
    await c.var.db.employerContact.update({
      where: { id },
      data: {
        invitedAt: new Date(),
        inviteTokenHash: tok.hash,
        inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
    await sendInvite(
      c.var.db,
      { employerId, tenantId: c.var.tenantId!, userId: c.var.userId },
      {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        languages: contact.languages,
        roleKey: contact.role.key,
      },
      tok.token,
    );
    await c.var.audit.log({ action: 'employer.member.invited', resourceId: id, metadata: {} });
    return ok(c, { ok: true });
  },
);

employerMembersRoutes.patch(
  '/:id',
  requireEmployerPermission('members.manage'),
  validate('json', MemberPatch),
  async (c) => {
    const employerId = c.var.employerId!;
    const id = c.req.param('id');
    const body = c.var.body;

    const existing = await c.var.db.employerContact.findFirst({
      where: { id, employerId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return err(c, 404, 'not_found');

    const ownerId = await ownerContactId(c.var.db as unknown as Tx, employerId);
    if (body.roleKey && id === ownerId) {
      return err(c, 409, 'last_owner', 'reassign ownership via transfer-owner');
    }

    let roleId: string | undefined;
    if (body.roleKey) {
      const role = await resolveAssignableRole(c.var.db as unknown as Tx, body.roleKey);
      if (!role) return err(c, 422, 'unknown_role');
      roleId = role.id;
    }

    const updated = await c.var.db.employerContact.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email === undefined ? undefined : body.email,
        roleId,
        languages: body.languages ?? undefined,
        sortOrder: body.sortOrder ?? undefined,
      },
      select: ROW_SELECT,
    });
    await c.var.audit.log({ action: 'employer.member.updated', resourceId: id, metadata: {} });
    return ok(c, { member: toView(updated as RosterRow, ownerId) });
  },
);

employerMembersRoutes.delete(
  '/:id',
  requireEmployerPermission('members.manage'),
  async (c) => {
    const employerId = c.var.employerId!;
    const id = c.req.param('id');
    const existing = await c.var.db.employerContact.findFirst({
      where: { id, employerId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return err(c, 404, 'not_found');

    const ownerId = await ownerContactId(c.var.db as unknown as Tx, employerId);
    if (id === ownerId) {
      return err(c, 409, 'last_owner', 'transfer ownership before removing the owner');
    }

    await c.var.db.employerContact.update({ where: { id }, data: { deletedAt: new Date() } });
    await c.var.audit.log({ action: 'employer.member.deleted', resourceId: id, metadata: {} });
    return ok(c, { ok: true });
  },
);

employerMembersRoutes.post(
  '/transfer-owner',
  requireEmployerPermission('members.manage'),
  validate('json', TransferOwnerBody),
  async (c) => {
    const employerId = c.var.employerId!;
    const { contactId } = c.var.body;

    const result = await c.var.db.$transaction(async (tx) => {
      const ep = await tx.employerProfile.findUnique({
        where: { id: employerId },
        select: { ownerContactId: true },
      });
      const currentOwnerId = ep?.ownerContactId ?? null;
      if (!currentOwnerId) return { error: 'not_found' as const };
      if (contactId === currentOwnerId) return { error: 'noop' as const };

      const target = await tx.employerContact.findFirst({
        where: { id: contactId, employerId, deletedAt: null },
        select: { id: true, userId: true, acceptedAt: true },
      });
      if (!target) return { error: 'target_not_found' as const };
      if (!target.userId || !target.acceptedAt) {
        return { error: 'target_not_active' as const };
      }

      const [ownerRole, managerRole] = await Promise.all([
        tx.role.findFirst({ where: { tenantId: null, key: 'owner', deletedAt: null }, select: { id: true } }),
        tx.role.findFirst({ where: { tenantId: null, key: 'manager', deletedAt: null }, select: { id: true } }),
      ]);
      if (!ownerRole || !managerRole) return { error: 'catalog' as const };

      await tx.employerContact.update({ where: { id: contactId }, data: { roleId: ownerRole.id } });
      await tx.employerContact.update({
        where: { id: currentOwnerId },
        data: { roleId: managerRole.id },
      });
      await tx.employerProfile.update({
        where: { id: employerId },
        data: { ownerContactId: contactId },
      });
      return { ok: true as const };
    });

    if ('error' in result) {
      if (result.error === 'noop') return ok(c, { ok: true });
      if (result.error === 'target_not_found') return err(c, 404, 'not_found');
      if (result.error === 'target_not_active') {
        return err(c, 422, 'target_not_active', 'new owner must be an active member');
      }
      return err(c, 409, 'transfer_failed');
    }

    await c.var.audit.log({
      action: 'employer.member.owner_transferred',
      resourceId: contactId,
      metadata: {},
    });
    return ok(c, { ok: true });
  },
);

export type { Tx };
