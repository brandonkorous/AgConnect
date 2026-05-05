// Match preview — counts qualifying workers for the form's right-rail card
// ("52 workers within 25mi qualify; auto-match will SMS the top 30").
//
// Heuristic, not exact: workers without precise geo fall back to county
// centroid. Score = skill overlap (0..1) + cert match (0..1, capped) + radius
// fit (0..1). qualifying = score >= 0.55. top-match cap = 30.

import { Hono } from 'hono';
import { ok, validate } from '@agconn/api-client/server';
import { MatchPreviewQuery } from '@agconn/schemas';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';
import { COUNTY_CENTROIDS, haversineMiles } from '../../lib/distance';

const QUALIFY_THRESHOLD = 0.55;
const TOP_MATCH_CAP = 30;

export const employerJobMatchPreviewRoutes = new Hono<{
  Variables: AuthVars & AuditCtxVars;
}>();
employerJobMatchPreviewRoutes.use('*', requireAuth('employer'));
employerJobMatchPreviewRoutes.use('*', requireRole('employer'));
employerJobMatchPreviewRoutes.use('*', requireTenant);

employerJobMatchPreviewRoutes.get('/', validate('query', MatchPreviewQuery), async (c) => {
  const q = c.var.body;
  const wantedSkills = (q.skills ?? []).map((s) => s.toLowerCase());
  const radius = q.radiusMiles;

  const origin: { lat: number; lng: number } | null =
    q.siteLat != null && q.siteLng != null
      ? { lat: q.siteLat, lng: q.siteLng }
      : (q.county && COUNTY_CENTROIDS[q.county]) || null;

  // Workers in the same county (cheap pre-filter), with their profile + cert
  // counts. We score in JS to keep this readable; volume is in the low
  // thousands at most.
  const workers = await c.var.db.workerProfile.findMany({
    where: {
      ...(q.county ? { county: q.county } : {}),
      deletedAt: null,
    },
    select: {
      id: true,
      county: true,
      skills: true,
    },
    take: 1000,
  });

  let qualifying = 0;
  for (const w of workers) {
    const wSkills = (w.skills ?? []).map((s) => s.toLowerCase());
    const skillOverlap = wantedSkills.length
      ? wSkills.filter((s) => wantedSkills.includes(s)).length / wantedSkills.length
      : 0.5;

    let radiusFit = 0.7;
    const wCentroid = w.county ? COUNTY_CENTROIDS[w.county] : null;
    if (origin && wCentroid) {
      const d = haversineMiles(origin, wCentroid);
      radiusFit = d <= radius ? 1 : Math.max(0, 1 - (d - radius) / radius);
    }

    const score = 0.6 * skillOverlap + 0.4 * radiusFit;
    if (score >= QUALIFY_THRESHOLD) qualifying += 1;
  }

  const topMatchCount = Math.min(qualifying, TOP_MATCH_CAP);
  return ok(c, { qualifyingCount: qualifying, topMatchCount, radiusMiles: radius });
});
