import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import {
  ComplianceItemStatus,
  type ComplianceItemContent,
  type Tx,
} from '@agconn/db';
import { CreateComplianceItemBody, PatchComplianceItemBody } from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  uploadComplianceEvidence,
  deleteComplianceEvidence,
  signComplianceEvidenceUrl,
  isAllowedEvidenceType,
} from '../../lib/supabase-storage.js';

const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;

export const employerComplianceRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerComplianceRoutes.use('*', requireAuth('employer'));
employerComplianceRoutes.use('*', requireRole('employer'));
employerComplianceRoutes.use('*', requireTenant);

employerComplianceRoutes.get('/items', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const locale = pickLocaleFromHeader(c.req.header('accept-language'));

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

  const uniqueKeys = Array.from(new Set(items.map((i) => i.itemKey)));
  const [contentMap, labelsMap] = await Promise.all([
    loadContentMap(c.var.db, uniqueKeys, locale),
    loadSeedItemLabelsMap(c.var.db, uniqueKeys, locale),
  ]);

  // Apply locale overrides to the in-memory items so all downstream consumers
  // (categories + actions + sidebar) see the translated copy.
  const localized = items.map((i) => {
    const o = labelsMap.get(i.itemKey);
    return o ? { ...i, label: o.label ?? i.label, details: o.details ?? i.details } : i;
  });

  const byCategory = new Map<string, typeof localized>();
  for (const i of localized) {
    const list = byCategory.get(i.category) ?? [];
    list.push(i);
    byCategory.set(i.category, list);
  }

  const categories = Array.from(byCategory.entries()).map(([category, list]) => {
    const score = computeScore(list);
    return {
      category,
      score,
      items: list.map((it) => shapeItem(it, contentMap)),
    };
  });

  const actions = localized
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
      evidenceUrl: i.evidenceUrl,
      evidence: i.evidenceStorageKey
        ? {
            fileName: i.evidenceFileName,
            contentType: i.evidenceContentType,
            size: i.evidenceSize,
            downloadPath: `/v1/employer/compliance/items/${i.id}/evidence`,
          }
        : null,
      instructions: contentMap.get(i.itemKey) ?? null,
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
  }).catch(async (e: unknown) => {
    const msg = e instanceof Error ? e.message : 'create_failed';
    if (msg.includes('Unique constraint')) {
      return null;
    }
    throw e;
  });
  if (!created) return err(c, 409, 'conflict', 'item_key_in_use');

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
  if (body.evidenceUrl !== undefined) {
    data.evidenceUrl = body.evidenceUrl;
    // Setting an external URL clears any uploaded file — they're mutually exclusive.
    if (body.evidenceUrl && existing.evidenceStorageKey) {
      try { await deleteComplianceEvidence(existing.evidenceStorageKey); } catch { /* best-effort */ }
      data.evidenceStorageKey = null;
      data.evidenceFileName = null;
      data.evidenceContentType = null;
      data.evidenceSize = null;
    }
  }
  if (body.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (body.resolved !== undefined) data.resolvedAt = body.resolved ? new Date() : null;
  if (body.noteAppend) {
    const stamp = new Date().toISOString().slice(0, 10);
    const line = `[${stamp}] ${body.noteAppend}`;
    data.details = existing.details ? `${existing.details}\n\n${line}` : line;
  }

  const updated = await c.var.db.complianceItem.update({ where: { id }, data });

  await c.var.audit.log({
    action: 'employer.compliance.item.updated',
    resourceId: id,
    metadata: { itemId: id, fields: Object.keys(body) },
  });

  return ok(c, { item: shapeItem(updated) });
});

employerComplianceRoutes.delete('/items/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.complianceItem.findFirst({
    where: { id, tenantId, employerId: userId },
  });
  if (!existing) return err(c, 404, 'not_found');

  if (existing.evidenceStorageKey) {
    try { await deleteComplianceEvidence(existing.evidenceStorageKey); } catch { /* best-effort */ }
  }
  await c.var.db.complianceItem.delete({ where: { id } });

  await c.var.audit.log({
    action: 'employer.compliance.item.deleted',
    resourceId: id,
    metadata: { itemId: id, label: existing.label },
  });

  return ok(c, { ok: true });
});

employerComplianceRoutes.post('/items/:id/evidence', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.complianceItem.findFirst({
    where: { id, tenantId, employerId: userId },
  });
  if (!existing) return err(c, 404, 'not_found');

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return err(c, 400, 'invalid_body');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return err(c, 400, 'invalid_body', 'missing_file');
  if (file.size > MAX_EVIDENCE_BYTES) return err(c, 413, 'payload_too_large');
  if (!isAllowedEvidenceType(file.type)) return err(c, 415, 'unsupported_media_type');

  const buf = Buffer.from(await file.arrayBuffer());
  const upload = await uploadComplianceEvidence({
    tenantId,
    itemId: id,
    fileName: file.name || 'evidence',
    contentType: file.type,
    body: buf,
  });

  // Replacing an existing file: remove the old one (best-effort).
  if (existing.evidenceStorageKey) {
    try { await deleteComplianceEvidence(existing.evidenceStorageKey); } catch { /* best-effort */ }
  }

  const updated = await c.var.db.complianceItem.update({
    where: { id },
    data: {
      evidenceStorageKey: upload.storageKey,
      evidenceFileName: file.name || 'evidence',
      evidenceContentType: file.type,
      evidenceSize: file.size,
      // Uploaded file replaces any external URL — mutually exclusive.
      evidenceUrl: null,
    },
  });

  await c.var.audit.log({
    action: 'employer.compliance.item.evidence.uploaded',
    resourceId: id,
    metadata: { itemId: id, fileName: file.name, size: file.size, contentType: file.type },
  });

  return ok(c, { item: shapeItem(updated) });
});

employerComplianceRoutes.delete('/items/:id/evidence', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.complianceItem.findFirst({
    where: { id, tenantId, employerId: userId },
  });
  if (!existing) return err(c, 404, 'not_found');
  if (!existing.evidenceStorageKey) return err(c, 404, 'no_evidence');

  try { await deleteComplianceEvidence(existing.evidenceStorageKey); } catch { /* best-effort */ }

  const updated = await c.var.db.complianceItem.update({
    where: { id },
    data: {
      evidenceStorageKey: null,
      evidenceFileName: null,
      evidenceContentType: null,
      evidenceSize: null,
    },
  });

  await c.var.audit.log({
    action: 'employer.compliance.item.evidence.removed',
    resourceId: id,
    metadata: { itemId: id },
  });

  return ok(c, { item: shapeItem(updated) });
});

// Issues a 60-second signed Supabase URL and 302-redirects to it. Browsers
// follow the redirect, so users see a normal "click to view" link.
employerComplianceRoutes.get('/items/:id/evidence', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.complianceItem.findFirst({
    where: { id, tenantId, employerId: userId },
    select: { evidenceStorageKey: true },
  });
  if (!existing?.evidenceStorageKey) return err(c, 404, 'not_found');

  const signed = await signComplianceEvidenceUrl(existing.evidenceStorageKey, 60);
  return c.redirect(signed, 302);
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

// Resolves the bilingual content map down to one locale's strings.
type ResolvedInstructions = {
  why: string;
  how: string[];
  acceptableEvidence: string[];
  deadline: string | null;
  source: { label: string; url: string };
  extraSources?: { label: string; url: string }[];
  lastVerified: string;
};

function pickLocale(c: ComplianceItemContent, locale: 'en' | 'es'): ResolvedInstructions | null {
  const pickedWhy = c.why[locale];
  if (!pickedWhy) return null;
  return {
    why: pickedWhy,
    how: c.how.map((s) => s[locale]).filter(Boolean),
    acceptableEvidence: c.acceptableEvidence.map((s) => s[locale]).filter(Boolean),
    deadline: c.deadline ? c.deadline[locale] || null : null,
    source: c.source,
    extraSources: c.extraSources,
    lastVerified: c.lastVerified,
  };
}

// Loads all rows once per request and indexes by item_key. Cheaper than 9
// separate lookups when shaping a category list.
async function loadContentMap(
  db: Tx,
  itemKeys: string[],
  locale: 'en' | 'es',
): Promise<Map<string, ResolvedInstructions>> {
  if (itemKeys.length === 0) return new Map();
  const rows = await db.complianceItemContent.findMany({
    where: { itemKey: { in: itemKeys } },
    select: { itemKey: true, content: true },
  });
  const out = new Map<string, ResolvedInstructions>();
  for (const r of rows) {
    const resolved = pickLocale(r.content as unknown as ComplianceItemContent, locale);
    if (resolved) out.set(r.itemKey, resolved);
  }
  return out;
}

// Loads translation overrides for seeded items' label/details. The DB stores
// English copy at seed time; this lookup lets ES (or any future locale) ship
// without a schema change. Custom items created by employers don't have
// translations and fall back to the user's own copy.
async function loadSeedItemLabelsMap(
  db: Tx,
  itemKeys: string[],
  locale: 'en' | 'es',
): Promise<Map<string, { label?: string; details?: string }>> {
  const out = new Map<string, { label?: string; details?: string }>();
  if (itemKeys.length === 0) return out;
  const namespacePrefixes = itemKeys.flatMap((k) => [
    `compliance.seed_item.${k}.label`,
    `compliance.seed_item.${k}.details`,
  ]);
  const rows = await db.translationKey.findMany({
    where: {
      namespace: 'employer',
      key: { in: namespacePrefixes },
      locale: locale as 'en' | 'es',
      tenantId: null,
      status: 'published',
    },
    select: { key: true, value: true },
  });
  for (const r of rows) {
    // key is e.g. "compliance.seed_item.i9_on_file.label"
    const m = r.key.match(/^compliance\.seed_item\.(.+)\.(label|details)$/);
    if (!m) continue;
    const [, itemKey, field] = m;
    const cur = out.get(itemKey!) ?? {};
    cur[field as 'label' | 'details'] = r.value;
    out.set(itemKey!, cur);
  }
  return out;
}

function pickLocaleFromHeader(acceptLanguage: string | undefined): 'en' | 'es' {
  if (!acceptLanguage) return 'en';
  return acceptLanguage.toLowerCase().startsWith('es') ? 'es' : 'en';
}

function shapeItem(
  i: {
    id: string;
    category: string;
    itemKey: string;
    label: string;
    status: ComplianceItemStatus;
    details: string | null;
    evidenceUrl: string | null;
    evidenceStorageKey: string | null;
    evidenceFileName: string | null;
    evidenceContentType: string | null;
    evidenceSize: number | null;
    dueAt: Date | null;
    resolvedAt: Date | null;
    updatedAt: Date;
  },
  contentMap: Map<string, ResolvedInstructions> = new Map(),
) {
  return {
    id: i.id,
    category: i.category,
    itemKey: i.itemKey,
    label: i.label,
    status: i.status,
    details: i.details,
    evidenceUrl: i.evidenceUrl,
    evidence: i.evidenceStorageKey
      ? {
          fileName: i.evidenceFileName,
          contentType: i.evidenceContentType,
          size: i.evidenceSize,
          downloadPath: `/v1/employer/compliance/items/${i.id}/evidence`,
        }
      : null,
    instructions: contentMap.get(i.itemKey) ?? null,
    dueAt: i.dueAt?.toISOString() ?? null,
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
    updatedAt: i.updatedAt.toISOString(),
  };
}
