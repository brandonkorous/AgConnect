import { getSmsBoss } from './queue.js';

// Identity keystone (docs/00-foundation/13-onboarding-identity-remediation/).
// The Twilio inbound webhook must respond fast and must not block on a Clerk
// network call, so unknown-phone opt-in is handed to this queue. The consumer
// (services/sms-worker) provisions a Clerk user by phone, upserts the local
// User row, and enqueues the confirm SMS. Queue plumbing only — no Clerk or
// auth dependency here, to keep the package graph acyclic.

export const SMS_PROVISION_QUEUE = 'sms.provision' as const;

export type SmsProvisionJob = {
  phone: string;
  locale: 'en' | 'es';
  // The opt-in keyword the worker texted (JOBS / TRABAJO / …). Carried for
  // audit provenance only.
  keyword: string;
};

const PROVISION_OPTS = {
  retryLimit: 5,
  retryBackoff: true,
  retryDelay: 15,
  expireInSeconds: 60 * 30,
} as const;

/**
 * Enqueue Clerk-provisioning for an unknown inbound phone. Idempotent on the
 * phone via a singleton key: duplicate inbound texts within the window fold
 * into one provisioning attempt (the consumer is itself idempotent too).
 */
export async function enqueueProvision(job: SmsProvisionJob): Promise<string | null> {
  const boss = await getSmsBoss();
  await boss.createQueue(SMS_PROVISION_QUEUE);
  return boss.send(SMS_PROVISION_QUEUE, job, {
    ...PROVISION_OPTS,
    singletonKey: `provision-${job.phone}`,
    singletonSeconds: 60 * 10,
  });
}
