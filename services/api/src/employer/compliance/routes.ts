import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { ComplianceItemStatus, type Tx } from '@agconn/db';
import { CreateComplianceItemBody, PatchComplianceItemBody } from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

export const employerComplianceRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerComplianceRoutes.use('*', requireAuth);
employerComplianceRoutes.use('*', requireRole('employer'));
employerComplianceRoutes.use('*', requireTenant);

employerComplianceRoutes.get('/items', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;

  const profile = await c.var.db.employerProfile.findUnique({
    where: { userId },
    select: { id: true, participatesInH2a: true },
  });

  const items = await c.var.db.complianceItem.findMany({
    where: {
      tenantId,
      employerId: userId,
      ...(profile?.participatesInH2a ? {} : { category: { not: 'h2a' } }),
    },
    orderBy: [{ category: 'asc' }, { itemKey: 'asc' }],
  });

  const byCategory = new Map<string, typeof items>();
  for (const i of items) {
    const list = byCategory.get(i.category) ?? [];
    list.push(i);
    byCategory.set(i.category, list);
  }

  const categories = Array.from(byCategory.entries()).map(([category, list]) => {
    const score = computeScore(list);
    return {
      category,
      score,
      items: list.map(shapeItem),
    };
  });

  const actions = items
    .filter((i) => i.status !== ComplianceItemStatus.ok && !i.resolvedAt)
    .sort(
      (a, b) =>
        (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER),
    )
    .map((i) => ({
      id: i.id,
      severity: i.status === ComplianceItemStatus.fail ? 'urgent' : 'soon',
      label: i.label,
      details: i.details ?? '',
      dueAt: i.dueAt?.toISOString() ?? null,
    }));

  if (profile && items.length > 0) {
    await snapshotScore(c.var.db, tenantId, profile.id, items);
  }

  return ok(c, { categories, actions });
});

employerComplianceRoutes.get('/summary', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;

  const profile = await c.var.db.employerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      participatesInH2a: true,
      dolLastInspectionAt: true,
      dolLastInspectionResult: true,
    },
  });
  if (!profile) return err(c, 404, 'not_found');

  const items = await c.var.db.complianceItem.findMany({
    where: {
      tenantId,
      employerId: userId,
      ...(profile.participatesInH2a ? {} : { category: { not: 'h2a' } }),
    },
    select: { status: true, category: true },
  });

  const overall = items.length === 0 ? 100 : computeScore(items);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const priorSnapshot = await c.var.db.complianceScoreSnapshot.findFirst({
    where: {
      employerProfileId: profile.id,
      snapshotDate: { lte: ninetyDaysAgo },
    },
    orderBy: { snapshotDate: 'desc' },
    select: { score: true, snapshotDate: true },
  });

  return ok(c, {
    overall,
    priorScore: priorSnapshot?.score ?? null,
    priorSnapshotDate: priorSnapshot?.snapshotDate?.toISOString().slice(0, 10) ?? null,
    delta: priorSnapshot ? overall - priorSnapshot.score : null,
    participatesInH2a: profile.participatesInH2a,
    dolLastInspectionAt: profile.dolLastInspectionAt?.toISOString() ?? null,
    dolLastInspectionResult: profile.dolLastInspectionResult,
  });
});

employerComplianceRoutes.post('/items', validate('json', CreateComplianceItemBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const created = await c.var.db.complianceItem.create({
    data: {
      tenantId,
      employerId: userId,
      category: body.category,
      itemKey: body.itemKey,
      label: body.label,
      status: body.status,
      details: body.details ?? null,
      evidenceUrl: body.evidenceUrl ?? null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    },
  });

  await c.var.audit.log({
    action: 'employer.compliance.item.created',
    resourceId: created.id,
    metadata: { itemId: created.id, category: body.category, itemKey: body.itemKey },
  });

  return ok(c, { item: shapeItem(created) });
});

employerComplianceRoutes.patch('/items/:id', validate('json', PatchComplianceItemBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.complianceItem.findFirst({
    where: { id, tenantId, employerId: userId },
  });
  if (!existing) return err(c, 404, 'not_found');

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.details !== undefined) data.details = body.details;
  if (body.evidenceUrl !== undefined) data.evidenceUrl = body.evidenceUrl;
  if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (body.resolved) data.resolvedAt = new Date();

  const updated = await c.var.db.complianceItem.update({ where: { id }, data });

  await c.var.audit.log({
    action: 'employer.compliance.item.updated',
    resourceId: id,
    metadata: { itemId: id, fields: Object.keys(body) },
  });

  return ok(c, { item: shapeItem(updated) });
});

function computeScore(items: { status: ComplianceItemStatus }[]): number {
  if (items.length === 0) return 100;
  const okCount = items.filter((i) => i.status === ComplianceItemStatus.ok).length;
  const warnCount = items.filter((i) => i.status === ComplianceItemStatus.warn).length;
  const total = items.length;
  return Math.round(((okCount + warnCount * 0.5) / total) * 100);
}

async function snapshotScore(
  db: Tx,
  tenantId: string,
  employerProfileId: string,
  items: { status: ComplianceItemStatus }[],
): Promise<void> {
  const score = computeScore(items);
  const okCount = items.filter((i) => i.status === ComplianceItemStatus.ok).length;
  const warnCount = items.filter((i) => i.status === ComplianceItemStatus.warn).length;
  const failCount = items.filter((i) => i.status === ComplianceItemStatus.fail).length;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  try {
    await db.complianceScoreSnapshot.upsert({
      where: { employerProfileId_snapshotDate: { employerProfileId, snapshotDate: today } },
      create: {
        tenantId,
        employerProfileId,
        snapshotDate: today,
        score,
        okCount,
        warnCount,
        failCount,
      },
      update: { score, okCount, warnCount, failCount },
    });
  } catch {
    // Snapshot is best-effort; never fail the read on a snapshot write error.
  }
}

function shapeItem(i: {
  id: string;
  category: string;
  itemKey: string;
  label: string;
  status: ComplianceItemStatus;
  details: string | null;
  evidenceUrl: string | null;
  dueAt: Date | null;
  resolvedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    id: i.id,
    category: i.category,
    itemKey: i.itemKey,
    label: i.label,
    status: i.status,
    details: i.details,
    evidenceUrl: i.evidenceUrl,
    dueAt: i.dueAt?.toISOString() ?? null,
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
    updatedAt: i.updatedAt.toISOString(),
  };
}
