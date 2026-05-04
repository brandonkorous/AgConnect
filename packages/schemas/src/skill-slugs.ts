// Single source of truth for valid Job.skills slugs. Mirrored manually from
// `packages/db/scripts/seed-lookups.ts`. Add a new slug here AND there when
// extending the SkillTag lookup.
export const SKILL_SLUGS = [
  // Tasks
  'pre_shake',
  'hand_harvest',
  'harvesting',
  'pruning',
  'thinning',
  'packing',
  'sort_line',
  'irrigation',
  'planting',
  'crew_leadership',
  // Equipment
  'forklift',
  'tractor_op',
  'ladder_safety',
  // Certs / safety
  'wps_cert',
  'heat_illness',
  'cdl_a',
  'cdl_b',
  'first_aid',
  // Languages
  'bilingual_en_es',
] as const;

export type SkillSlug = (typeof SKILL_SLUGS)[number];
