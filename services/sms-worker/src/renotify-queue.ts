// Mirror of the contract published by services/api/src/employer/jobs/
// renotify-queue.ts. Kept here too so the worker doesn't reach into the api
// service. If the contract changes, update both — they're load-bearing on the
// queue's JSON payload shape.

export const RENOTIFY_QUEUE = 'job.edit.renotify' as const;

export type RenotifyJob = {
  tenantId: string;
  jobId: string;
  editEventId: string;
  applicationId: string;
  workerId: string;
  channel: 'sms' | 'email' | 'app';
  changeSummary: {
    fields: string[];
    titleEn: string;
    titleEs: string;
    employerName: string;
  };
};
