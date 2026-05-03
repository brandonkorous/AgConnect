// Renotify consumer — drains job.edit.renotify and dispatches one outbound
// SMS per applicant via the existing sms.send queue. Idempotency lives in
// job_renotifications: we flip status from queued → sent / failed.
//
// We don't send SMS directly here; we hand off to the sms.send queue so quiet
// hours, opt-outs, and the audit trail still apply.

import type { Job, PgBoss } from 'pg-boss';
import { prisma } from '@agconn/db';
import { enqueueSms } from '@agconn/sms';
import { RENOTIFY_QUEUE, type RenotifyJob } from './renotify-queue';

const FIELD_LABEL_EN: Record<string, string> = {
  titleEn: 'title',
  titleEs: 'title',
  descriptionEn: 'description',
  descriptionEs: 'description',
  wageMin: 'wage',
  wageMax: 'wage',
  wageStructure: 'wage structure',
  pieceRate: 'piece rate',
  pieceUnit: 'piece unit',
  startDate: 'start date',
  endDate: 'end date',
  dailyStartTime: 'start time',
  dailyEndTime: 'end time',
  workingDays: 'working days',
  positionsTotal: 'crew size',
  siteAddress: 'work site',
  pickupPoint: 'pickup point',
  transport: 'transport',
  housing: 'housing',
  mealsProvided: 'meals',
  applicationDeadlineAt: 'deadline',
  foremanContactId: 'foreman',
  minExperience: 'experience',
  minAge: 'age',
  skills: 'skills',
};

function summarizeFields(fields: string[]): string {
  const labels = fields
    .map((f) => FIELD_LABEL_EN[f] ?? f)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3);
  if (labels.length === 0) return 'details';
  if (fields.length > 3) return labels.join(', ') + ', and more';
  return labels.join(', ');
}

async function handle(job: Job<RenotifyJob>): Promise<void> {
  const { tenantId, applicationId, editEventId, channel, changeSummary, workerId } = job.data;

  // Idempotency: if this row's already sent, exit. The unique constraint
  // (editEventId, applicationId, channel) backstops duplicate enqueues.
  const row = await prisma.jobRenotification.findFirst({
    where: { editEventId, applicationId, channel },
  });
  if (!row) {
    console.warn('[renotify] no row for', { editEventId, applicationId, channel });
    return;
  }
  if (row.status === 'sent') return;

  if (channel === 'sms') {
    await enqueueSms({
      tenantId,
      userId: workerId,
      template: 'job.posting.edited',
      vars: {
        employer: changeSummary.employerName,
        jobTitle: changeSummary.titleEn,
        fields: summarizeFields(changeSummary.fields),
      },
      jobKey: `renotify-${editEventId}-${applicationId}`,
    });
  }

  await prisma.jobRenotification.update({
    where: { id: row.id },
    data: { status: 'sent', sentAt: new Date() },
  });
}

export async function startRenotifyWorker(boss: PgBoss): Promise<void> {
  await boss.createQueue(RENOTIFY_QUEUE);
  await boss.work<RenotifyJob>(
    RENOTIFY_QUEUE,
    { batchSize: 5, pollingIntervalSeconds: 3 },
    async (jobs) => {
      for (const j of jobs) {
        try {
          await handle(j);
        } catch (err) {
          console.error('[renotify] failed', { id: j.id, err });
          throw err;
        }
      }
    },
  );
  console.log('[renotify] started — listening on', RENOTIFY_QUEUE);
}
