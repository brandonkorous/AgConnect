// Diff a JobPosting before/after, write a JobEditEvent row, and (when the job
// is published) enqueue one re-notify per (active applicant × channel).
//
// Material fields = the ones a worker would care about being notified of:
// wages, schedule, working days, site, pickup, deadline, description, working
// hours. Title + skills count too. Photo / contact / screening Q changes are
// logged but DON'T trigger notifications by default.
//
// audit-required:exempt — helper that mutates inside the caller's transaction;
// the calling route (employer/jobs/routes.ts) writes audit.log({ action:
// 'job.posting.edited' }) on the return value.

import type { Tx, Prisma } from '@agconn/db';
import { AppStatus, JobEditEventKind } from '@agconn/db';
import { enqueueRenotify } from './renotify-queue.js';

const MATERIAL_FIELDS: Array<keyof JobLikeShape> = [
  'titleEn',
  'titleEs',
  'descriptionEn',
  'descriptionEs',
  'wageMin',
  'wageMax',
  'wageStructure',
  'pieceRate',
  'pieceUnit',
  'startDate',
  'endDate',
  'dailyStartTime',
  'dailyEndTime',
  'workingDays',
  'positionsTotal',
  'siteAddress',
  'pickupPoint',
  'transport',
  'housing',
  'mealsProvided',
  'applicationDeadlineAt',
  'foremanContactId',
  'minExperience',
  'minAge',
  'skills',
];

export type JobLikeShape = Record<string, unknown>;

export type EditEventArgs = {
  tx: Tx;
  tenantId: string;
  jobId: string;
  actorUserId: string;
  before: JobLikeShape;
  after: JobLikeShape;
  status: 'draft' | 'active' | 'closed' | 'filled';
  employerName: string;
  // Renotify gate: undefined = auto (queue when status is active + material
  // diff + active applicants); true = same as undefined but explicit; false =
  // suppress queue even when material diff exists. Wired from the save-bar's
  // "Save & don't notify" / "Save & notify crew" choice.
  notifyApplicants?: boolean;
  // When true, the posting has renotifications paused via the
  // /pause-renotify endpoint. Treated like notifyApplicants === false but
  // surfaces a distinct telemetry signal.
  renotifyPaused?: boolean;
};

export type EditEventResult = {
  changedFields: string[];
  eventId: string | null;
  renotificationsQueued: number;
  // True when notifyApplicants === false suppressed a queue that would
  // otherwise have fired (active job + material diff + active applicants).
  // Lets the UI confirm "Saved without notifying — N applicants will not see
  // the changes."
  renotificationsSuppressed: boolean;
  suppressedRecipientCount: number;
};

export async function recordEditAndMaybeRenotify(args: EditEventArgs): Promise<EditEventResult> {
  const changed = diffMaterialFields(args.before, args.after);
  if (changed.length === 0) {
    return {
      changedFields: [],
      eventId: null,
      renotificationsQueued: 0,
      renotificationsSuppressed: false,
      suppressedRecipientCount: 0,
    };
  }

  const event = await args.tx.jobEditEvent.create({
    data: {
      tenantId: args.tenantId,
      jobId: args.jobId,
      actorUserId: args.actorUserId,
      kind: JobEditEventKind.field_changed,
      fieldPath: changed.join(','),
      before: pick(args.before, changed) as Prisma.InputJsonValue,
      after: pick(args.after, changed) as Prisma.InputJsonValue,
    },
  });

  if (args.status !== 'active') {
    return {
      changedFields: changed,
      eventId: event.id,
      renotificationsQueued: 0,
      renotificationsSuppressed: false,
      suppressedRecipientCount: 0,
    };
  }

  const apps = await args.tx.application.findMany({
    where: {
      jobId: args.jobId,
      deletedAt: null,
      status: { in: [AppStatus.applied, AppStatus.reviewed, AppStatus.hired] },
    },
    select: { id: true, workerId: true },
  });

  if (apps.length === 0) {
    return {
      changedFields: changed,
      eventId: event.id,
      renotificationsQueued: 0,
      renotificationsSuppressed: false,
      suppressedRecipientCount: 0,
    };
  }

  if (args.notifyApplicants === false || args.renotifyPaused) {
    return {
      changedFields: changed,
      eventId: event.id,
      renotificationsQueued: 0,
      renotificationsSuppressed: true,
      suppressedRecipientCount: apps.length,
    };
  }

  // Persist the queue rows transactionally — the consumer flips status to sent
  // / failed once it dispatches.
  const rows = apps.map((a) => ({
    tenantId: args.tenantId,
    jobId: args.jobId,
    editEventId: event.id,
    applicationId: a.id,
    channel: 'sms' as const,
  }));
  await args.tx.jobRenotification.createMany({ data: rows, skipDuplicates: true });

  await args.tx.jobEditEvent.update({
    where: { id: event.id },
    data: { renotifyDispatchedAt: new Date() },
  });

  // Enqueue outside the transaction (caller handles since pg-boss writes go to
  // the same DB but a separate schema). Caller awaits this Promise.all.
  const titleEn = String(args.after.titleEn ?? args.before.titleEn ?? '');
  const titleEs = String(args.after.titleEs ?? args.before.titleEs ?? '');
  await Promise.all(
    apps.map((a) =>
      enqueueRenotify({
        tenantId: args.tenantId,
        jobId: args.jobId,
        editEventId: event.id,
        applicationId: a.id,
        workerId: a.workerId,
        channel: 'sms',
        changeSummary: {
          fields: changed,
          titleEn,
          titleEs,
          employerName: args.employerName,
        },
      }),
    ),
  );

  return {
    changedFields: changed,
    eventId: event.id,
    renotificationsQueued: apps.length,
    renotificationsSuppressed: false,
    suppressedRecipientCount: 0,
  };
}

function diffMaterialFields(before: JobLikeShape, after: JobLikeShape): string[] {
  const out: string[] = [];
  for (const f of MATERIAL_FIELDS) {
    if (!(f in after)) continue; // patch didn't touch this field
    if (!sameValue(before[f], after[f])) out.push(String(f));
  }
  return out;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => sameValue(v, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object' && 'toString' in (a as object)) {
    return String(a) === String(b);
  }
  return false;
}

function pick(obj: JobLikeShape, fields: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = obj[f];
    out[f] = v instanceof Date ? v.toISOString() : v ?? null;
  }
  return out;
}
