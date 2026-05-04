// One-shot: remove translation keys whose leaf-name collides with a
// namespace path of the same prefix (e.g. `crews.edit_crew` vs
// `crews.edit_crew.title`). The seed `assemble()` overwrites the leaf with
// an object when the namespace child loads, so the leaf renders as a raw
// key path. Run any time the seed is reorganised in this way.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

const { prisma } = await import('../src/index.js');

const STALE_KEYS = [
  // Renamed → crews.edit_crew_button
  { namespace: 'employer', key: 'crews.edit_crew' },
  // Renamed → crews.new_shift_button
  { namespace: 'employer', key: 'crews.new_shift' },
  // Replaced → crews.edit_shift.crew_picker.create_crew (link → in-place modal)
  { namespace: 'employer', key: 'crews.edit_shift.crew_picker.manage_crews' },
  // Replaced → real Mapbox static map (the hardcoded "0.4 mi · 2 min drive" pill is gone)
  { namespace: 'employer', key: 'crews.edit_shift.location_section.map_caption' },
] as const;

const STALE_PREFIXES = [
  // Replaced wholesale by crews.new_shift.* rich editor keys
  { namespace: 'employer', prefix: 'crews.new_shift_form.' },
] as const;

const result = await prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
  let total = 0;
  for (const k of STALE_KEYS) {
    const r = await tx.translationKey.deleteMany({ where: k });
    total += r.count;
  }
  for (const p of STALE_PREFIXES) {
    const r = await tx.translationKey.deleteMany({
      where: { namespace: p.namespace, key: { startsWith: p.prefix } },
    });
    total += r.count;
  }
  return total;
});

console.log(`Deleted ${result} stale translation row(s).`);
await prisma.$disconnect();
