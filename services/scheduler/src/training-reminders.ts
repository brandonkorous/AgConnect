import type { PgBoss } from 'pg-boss';
import { prisma, EnrollmentStatus } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';

const QUEUE = 'training-reminder.tick';
// Every 15 minutes — covers the 2h window with 7-minute granularity worst case.
const SCHEDULE = '*/15 * * * *';

// Looks ahead for enrollments whose program starts in ~2 hours (and ~48 hours
// for a second window) and emits a reminder SMS. Uses a per-enrollment
// idempotency key so duplicate ticks don't double-text. The 48h reminder is
// also enqueued at enrollment time directly; this loop is the safety net for
// enrollments older than that window OR programs whose schedule shifted.

const TWO_HOURS = 2 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
const TICK_WINDOW = 16 * 60 * 1000; // 16 minutes — slightly more than the cron cadence

export async function runTrainingReminders(boss: PgBoss): Promise<void> {
  await boss.createQueue(QUEUE);
  await boss.work(QUEUE, async () => {
    await tick();
  });
  await boss.schedule(QUEUE, SCHEDULE);
  console.log(`[training-reminders] subscribed; cron=${SCHEDULE}`);
}

async function tick(): Promise<void> {
  const now = Date.now();
  await fireWindow('training.reminder.2h', now + TWO_HOURS, TICK_WINDOW);
  await fireWindow('training.reminder.48h', now + FORTY_EIGHT_HOURS, TICK_WINDOW);
}

async function fireWindow(
  template: 'training.reminder.2h' | 'training.reminder.48h',
  centerMs: number,
  spreadMs: number,
): Promise<void> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: EnrollmentStatus.enrolled,
      deletedAt: null,
      program: {
        startDate: {
          gte: new Date(centerMs - spreadMs),
          lte: new Date(centerMs + spreadMs),
        },
      },
    },
    include: { program: true },
    take: 200,
  });

  for (const e of enrollments) {
    try {
      const vars =
        template === 'training.reminder.2h'
          ? {
              programTitle: e.program.titleEn,
              location: e.program.locationName ?? `${e.program.county} County`,
            }
          : {
              programTitle: e.program.titleEn,
              startDate: e.program.startDate.toISOString().slice(0, 10),
              startTime: pickStartTime(e.program.sessionTimes) ?? '9:00 AM',
              location: e.program.locationName ?? `${e.program.county} County`,
            };

      await enqueueSms({
        tenantId: e.tenantId,
        userId: e.workerId,
        template,
        vars: vars as never,
        jobKey: `${template}-${e.id}`,
      });
    } catch (err) {
      console.error('[training-reminders] enqueue failed', {
        enrollmentId: e.id,
        template,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

function pickStartTime(sessionTimes: unknown): string | null {
  if (!Array.isArray(sessionTimes) || sessionTimes.length === 0) return null;
  const first = sessionTimes[0] as { startTime?: unknown } | undefined;
  return typeof first?.startTime === 'string' ? first.startTime : null;
}
