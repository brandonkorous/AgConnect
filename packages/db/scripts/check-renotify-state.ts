// Inspect renotify rows for the test job after browser-driven PATCH calls.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const JOB_ID = '5b7bc70f-b13c-4b70-9473-388d243ebd65';

const events = await prisma.jobEditEvent.findMany({
  where: { jobId: JOB_ID },
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: { id: true, fieldPath: true, renotifyDispatchedAt: true, createdAt: true },
});
const renotifs = await prisma.jobRenotification.findMany({
  where: { jobId: JOB_ID },
  orderBy: { id: 'desc' },
  take: 10,
  select: { id: true, editEventId: true, applicationId: true, channel: true, status: true },
});

console.log({ events, renotifs });
await prisma.$disconnect();
