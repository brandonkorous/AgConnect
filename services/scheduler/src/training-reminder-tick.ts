import { asService, EnrollmentStatus, type Db } from '@agconn/db';
import type { enqueueSms } from '@agconn/sms';

// Looks ahead for enrollments whose program starts in ~2 hours (and ~48 hours
// for a second window) and emits a reminder SMS. Uses a per-enrollment
// idempotency key so duplicate ticks don't double-text. The 48h reminder is
// also enqueued at enrollment time directly; this loop is the safety net for
// enrollments older than that window OR programs whose schedule shifted.

export type TrainingTickDeps = {
  db: Pick<Db, 'enrollment'>;
  enqueue: typeof enqueueSms;
};

type Template = 'training.reminder.2h' | 'training.reminder.48h';

const TWO_HOURS = 2 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
const TICK_WINDOW = 16 * 60 * 1000; // 16 minutes — slightly more than the cron cadence

// enrollments are FORCE RLS with role-only policies, so the tick must run as 'service'.
export const trainingReminderTick = asService(
  async (deps: TrainingTickDeps, now: number = Date.now()): Promise<void> => {
    await fireWindow(deps, 'training.reminder.2h', now + TWO_HOURS);
    await fireWindow(deps, 'training.reminder.48h', now + FORTY_EIGHT_HOURS);
  },
);

async function fireWindow(deps: TrainingTickDeps, template: Template, centerMs: number): Promise<void> {
  const enrollments = await deps.db.enrollment.findMany({
    where: {
      status: EnrollmentStatus.enrolled,
      deletedAt: null,
      program: {
        startDate: {
          gte: new Date(centerMs - TICK_WINDOW),
          lte: new Date(centerMs + TICK_WINDOW),
        },
      },
    },
    include: { program: true },
    take: 200,
  });

  for (const e of enrollments) {
    try {
      await deps.enqueue({
        tenantId: e.tenantId,
        userId: e.workerId,
        template,
        vars: reminderVars(template, e.program) as never,
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

type Program = {
  titleEn: string;
  locationName: string | null;
  county: string;
  startDate: Date;
  sessionTimes: unknown;
};

function reminderVars(template: Template, p: Program): Record<string, string> {
  const location = p.locationName ?? `${p.county} County`;
  if (template === 'training.reminder.2h') return { programTitle: p.titleEn, location };
  return {
    programTitle: p.titleEn,
    startDate: p.startDate.toISOString().slice(0, 10),
    startTime: pickStartTime(p.sessionTimes) ?? '9:00 AM',
    location,
  };
}

function pickStartTime(sessionTimes: unknown): string | null {
  if (!Array.isArray(sessionTimes) || sessionTimes.length === 0) return null;
  const first = sessionTimes[0] as { startTime?: unknown } | undefined;
  return typeof first?.startTime === 'string' ? first.startTime : null;
}
