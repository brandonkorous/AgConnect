// One-shot: remove translation keys for the WhatsApp channel after the
// 2026-05-22 deferral. The seed bundles drop these; this script removes
// the matching DB rows so translation_keys mirrors the seed source of
// truth. Re-add the seed entries + re-run seed when WhatsApp returns.

import { config as loadEnv } from 'dotenv';
loadEnv({ path: '../../.env' });

const { prisma } = await import('../src/index.js');

const STALE_KEYS = [
  { namespace: 'worker', key: 'dashboard.messages.channels.whatsapp' },
  { namespace: 'worker', key: 'messages.channels.whatsapp' },
  { namespace: 'worker', key: 'job_detail.share_body' },
  { namespace: 'employer', key: 'crews.edit_crew.comms.name.whatsappForeman' },
  { namespace: 'employer', key: 'crews.edit_crew.comms.help.whatsappForeman' },
  { namespace: 'employer', key: 'crews.edit_shift.notify.channel.whatsappMorning.title' },
  { namespace: 'employer', key: 'crews.edit_shift.notify.channel.whatsappMorning.help' },
  { namespace: 'employer', key: 'messages.channel.whatsapp' },
  { namespace: 'employer', key: 'messages.composer.channel_whatsapp' },
  { namespace: 'employer', key: 'messages.new_conversation.channel.whatsapp' },
] as const;

const result = await prisma.$transaction(async (tx) => {
  await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
  let total = 0;
  for (const k of STALE_KEYS) {
    const r = await tx.translationKey.deleteMany({ where: { ...k, tenantId: null } });
    total += r.count;
  }
  return total;
});

console.log(`Deleted ${result} stale translation row(s).`);
await prisma.$disconnect();
