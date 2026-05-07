// Seed enrollment + conversation data for a worker so that
// /worker/wallet/cert/[id] and /worker/messages?thread=… render with real
// records during browser testing. Idempotent — re-running is a no-op once
// the records exist.
//
// Pass the worker's user_id (Clerk id) as argv[2]:
//   pnpm tsx packages/db/scripts/seed-test-worker-data.ts user_2abc...
//
// If omitted, picks the most-recently-active worker_profile.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const explicitUserId = process.argv[2];

let worker = explicitUserId
  ? await prisma.workerProfile.findUnique({
      where: { id: explicitUserId },
      select: { id: true, tenantId: true, firstName: true, lastName: true },
    })
  : await prisma.workerProfile.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, tenantId: true, firstName: true, lastName: true },
    });

if (!worker) {
  console.error('No worker_profile found. Pass a userId as the first argument.');
  process.exit(1);
}

console.log(`Seeding for worker: ${worker.firstName ?? '?'} ${worker.lastName ?? ''} (${worker.id})`);

const program = await prisma.trainingProgram.findFirst({
  where: { deletedAt: null },
  select: { id: true, tenantId: true, titleEn: true },
});
if (!program) {
  console.error('No TrainingProgram found. Seed compliance data first.');
  process.exit(1);
}

const existingEnrollment = await prisma.enrollment.findFirst({
  where: { workerId: worker.id, programId: program.id, deletedAt: null },
  select: { id: true, completedAt: true, certificateId: true },
});

const completedAt = new Date();
completedAt.setUTCMonth(completedAt.getUTCMonth() - 1);

const enrollment =
  existingEnrollment ??
  (await prisma.enrollment.create({
    data: {
      tenantId: program.tenantId,
      programId: program.id,
      workerId: worker.id,
      status: 'completed',
      completedAt,
      certGeneratedAt: completedAt,
      certificateId: `WIOA-${Date.now().toString(36).toUpperCase()}`,
    },
  }));

if (!existingEnrollment) {
  console.log(`  + enrollment ${enrollment.id} (program: ${program.titleEn})`);
} else if (!existingEnrollment.completedAt) {
  await prisma.enrollment.update({
    where: { id: existingEnrollment.id },
    data: {
      status: 'completed',
      completedAt,
      certGeneratedAt: completedAt,
      certificateId: `WIOA-${Date.now().toString(36).toUpperCase()}`,
    },
  });
  console.log(`  ~ enrollment ${enrollment.id} marked completed`);
} else {
  console.log(`  = enrollment ${enrollment.id} (already completed)`);
}

const employer = await prisma.user.findFirst({
  where: { role: 'employer', tenantId: worker.tenantId },
  select: { id: true },
});

if (!employer) {
  console.warn(`  ! no employer user found in tenant ${worker.tenantId}; skipping conversation seed`);
} else {
  const existingConv = await prisma.conversation.findFirst({
    where: {
      tenantId: worker.tenantId,
      employerId: employer.id,
      deletedAt: null,
      participants: { some: { userId: worker.id } },
    },
    select: { id: true },
  });

  let conversationId: string;
  if (existingConv) {
    conversationId = existingConv.id;
    console.log(`  = conversation ${conversationId} (already exists)`);
  } else {
    const conv = await prisma.conversation.create({
      data: {
        tenantId: worker.tenantId,
        employerId: employer.id,
        title: 'Crew opening · Walnut harvest',
        channel: 'sms',
        lastMessageAt: new Date(),
        participants: {
          create: [
            { tenantId: worker.tenantId, userId: worker.id },
            { tenantId: worker.tenantId, userId: employer.id, lastReadAt: new Date() },
          ],
        },
      },
    });
    conversationId = conv.id;

    await prisma.message.createMany({
      data: [
        {
          tenantId: worker.tenantId,
          conversationId,
          senderUserId: employer.id,
          body: 'Hi! We saw your application — are you available for a 2pm interview Friday?',
          channel: 'sms',
          direction: 'outbound',
        },
        {
          tenantId: worker.tenantId,
          conversationId,
          senderUserId: worker.id,
          body: 'Yes, Friday at 2pm works. Where should I meet you?',
          channel: 'sms',
          direction: 'inbound',
        },
        {
          tenantId: worker.tenantId,
          conversationId,
          senderUserId: employer.id,
          body: 'Great — we’re at 1820 Avenue 18, Madera. Ask for Maria at the office.',
          channel: 'sms',
          direction: 'outbound',
        },
      ],
    });
    console.log(`  + conversation ${conversationId} with 3 messages`);
  }
}

await prisma.$disconnect();
