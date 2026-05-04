// Seed crops + role_types + skill_tags lookup tables.
//
// These power the Edit Job v2 form (crop chips, role-type dropdown, skill chip
// rail). Idempotent — re-run anytime; rows upsert by `slug`.
//
// Usage: pnpm --filter @agconn/db lookups:seed
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

interface CropSeed {
  slug: string;
  labelEn: string;
  labelEs: string;
  glyphKey: string;
}

interface RoleTypeSeed {
  slug: string;
  labelEn: string;
  labelEs: string;
}

interface SkillSeed {
  slug: string;
  labelEn: string;
  labelEs: string;
  category: 'task' | 'cert' | 'equipment' | 'language' | 'general';
}

const CROPS: CropSeed[] = [
  { slug: 'grape',      labelEn: 'Grapes',      labelEs: 'Uva',          glyphKey: 'grape' },
  { slug: 'almond',     labelEn: 'Almonds',     labelEs: 'Almendra',     glyphKey: 'almond' },
  { slug: 'citrus',     labelEn: 'Citrus',      labelEs: 'Cítricos',     glyphKey: 'citrus' },
  { slug: 'tomato',     labelEn: 'Tomatoes',    labelEs: 'Tomate',       glyphKey: 'tomato' },
  { slug: 'lettuce',    labelEn: 'Lettuce',     labelEs: 'Lechuga',      glyphKey: 'lettuce' },
  { slug: 'strawberry', labelEn: 'Strawberries', labelEs: 'Fresa',       glyphKey: 'strawberry' },
  { slug: 'pistachio',  labelEn: 'Pistachios',  labelEs: 'Pistacho',     glyphKey: 'almond' },
  { slug: 'walnut',     labelEn: 'Walnuts',     labelEs: 'Nuez',         glyphKey: 'almond' },
  { slug: 'stone_fruit', labelEn: 'Stone fruit', labelEs: 'Fruta de hueso', glyphKey: 'almond' },
  { slug: 'leafy_greens', labelEn: 'Leafy greens', labelEs: 'Verdes de hoja', glyphKey: 'lettuce' },
  { slug: 'other',      labelEn: 'Other crop',  labelEs: 'Otro cultivo', glyphKey: 'lettuce' },
];

const ROLE_TYPES: RoleTypeSeed[] = [
  { slug: 'harvest_crew',   labelEn: 'Harvest crew',              labelEs: 'Cuadrilla de cosecha' },
  { slug: 'orchard_setup',  labelEn: 'Vineyard / orchard setup',  labelEs: 'Preparación de viñedo / huerto' },
  { slug: 'sort_pack',      labelEn: 'Sort line / packing',       labelEs: 'Línea de selección / empaque' },
  { slug: 'equipment_op',   labelEn: 'Equipment operator',         labelEs: 'Operador de equipo' },
  { slug: 'foreman_lead',   labelEn: 'Foreman / lead',             labelEs: 'Mayordomo / líder' },
  { slug: 'irrigation',     labelEn: 'Irrigation',                 labelEs: 'Riego' },
  { slug: 'pruning',        labelEn: 'Pruning',                    labelEs: 'Poda' },
  { slug: 'general_labor',  labelEn: 'General labor',              labelEs: 'Labor general' },
];

const SKILLS: SkillSeed[] = [
  // Tasks
  { slug: 'pre_shake',      labelEn: 'Pre-shake',         labelEs: 'Pre-vareo',       category: 'task' },
  { slug: 'hand_harvest',   labelEn: 'Hand harvest',      labelEs: 'Cosecha a mano',  category: 'task' },
  { slug: 'harvesting',     labelEn: 'Harvesting',        labelEs: 'Cosecha',         category: 'task' },
  { slug: 'pruning',        labelEn: 'Pruning',           labelEs: 'Poda',            category: 'task' },
  { slug: 'thinning',       labelEn: 'Thinning',          labelEs: 'Aclareo',         category: 'task' },
  { slug: 'packing',        labelEn: 'Packing',           labelEs: 'Empaque',         category: 'task' },
  { slug: 'sort_line',      labelEn: 'Sort line',         labelEs: 'Línea de selección', category: 'task' },
  { slug: 'irrigation',     labelEn: 'Irrigation',        labelEs: 'Riego',           category: 'task' },
  { slug: 'planting',       labelEn: 'Planting',          labelEs: 'Plantación',      category: 'task' },
  { slug: 'crew_leadership', labelEn: 'Crew leadership',  labelEs: 'Liderazgo de cuadrilla', category: 'task' },
  // Equipment
  { slug: 'forklift',       labelEn: 'Forklift',          labelEs: 'Montacargas',     category: 'equipment' },
  { slug: 'tractor_op',     labelEn: 'Tractor op.',       labelEs: 'Operador de tractor', category: 'equipment' },
  { slug: 'ladder_safety',  labelEn: 'Ladder safety',     labelEs: 'Seguridad en escalera', category: 'equipment' },
  // Certs / safety
  { slug: 'wps_cert',       labelEn: 'WPS cert',          labelEs: 'Cert. WPS',       category: 'cert' },
  { slug: 'heat_illness',   labelEn: 'Heat illness',      labelEs: 'Enfermedad por calor', category: 'cert' },
  { slug: 'cdl_a',          labelEn: 'CDL-A',             labelEs: 'Licencia CDL-A',  category: 'cert' },
  { slug: 'cdl_b',          labelEn: 'CDL-B',             labelEs: 'Licencia CDL-B',  category: 'cert' },
  { slug: 'first_aid',      labelEn: 'First aid',         labelEs: 'Primeros auxilios', category: 'cert' },
  // Languages
  { slug: 'bilingual_en_es', labelEn: 'Bilingual EN/ES',  labelEs: 'Bilingüe EN/ES',  category: 'language' },
];

async function upsertCrops() {
  for (let i = 0; i < CROPS.length; i++) {
    const c = CROPS[i]!;
    await prisma.crop.upsert({
      where: { slug: c.slug },
      create: { ...c, sortOrder: i, active: true },
      update: { labelEn: c.labelEn, labelEs: c.labelEs, glyphKey: c.glyphKey, sortOrder: i, active: true },
    });
  }
  console.log(`crops: upserted ${CROPS.length}`);
}

async function upsertRoleTypes() {
  for (let i = 0; i < ROLE_TYPES.length; i++) {
    const r = ROLE_TYPES[i]!;
    await prisma.roleType.upsert({
      where: { slug: r.slug },
      create: { ...r, sortOrder: i, active: true },
      update: { labelEn: r.labelEn, labelEs: r.labelEs, sortOrder: i, active: true },
    });
  }
  console.log(`role_types: upserted ${ROLE_TYPES.length}`);
}

async function upsertSkills() {
  for (let i = 0; i < SKILLS.length; i++) {
    const s = SKILLS[i]!;
    await prisma.skillTag.upsert({
      where: { slug: s.slug },
      create: { ...s, sortOrder: i, active: true },
      update: { labelEn: s.labelEn, labelEs: s.labelEs, category: s.category, sortOrder: i, active: true },
    });
  }
  console.log(`skill_tags: upserted ${SKILLS.length}`);
}

await upsertCrops();
await upsertRoleTypes();
await upsertSkills();

await prisma.$disconnect();
