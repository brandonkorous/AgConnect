import { prisma, LicenseType } from '@agconn/db';
import { enqueueFlcVerify } from '@agconn/flc-verify';

// Nightly sweep — picks every FLC employer whose last check is older than the
// re-verify cadence (or null) and enqueues a per-employer verify job. The
// sweep itself does not call DLSE; it just fans out work to FLC_VERIFY_QUEUE
// where the per-employer handler runs with retry + dedup.
//
// Cadence: 24h. Marketing copy promises "verified nightly," so the floor is
// daily; we don't chase shorter intervals because DLSE only refreshes on
// renewals (annual) and we want to be a polite tenant of the registry.

const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const BATCH_LIMIT = 500;

export type SweepOutcome = {
  scanned: number;
  enqueued: number;
};

export async function runFlcSweep(): Promise<SweepOutcome> {
  const cutoff = new Date(Date.now() - RECHECK_INTERVAL_MS);

  const due = await prisma.employerProfile.findMany({
    where: {
      licenseType: LicenseType.flc,
      deletedAt: null,
      flcLicenseNum: { not: null },
      OR: [
        { flcLastCheckedAt: null },
        { flcLastCheckedAt: { lt: cutoff } },
      ],
    },
    orderBy: [{ flcLastCheckedAt: 'asc' }, { createdAt: 'asc' }],
    take: BATCH_LIMIT,
    select: { id: true, tenantId: true },
  });

  let enqueued = 0;
  for (const e of due) {
    try {
      // Date-stamped jobKey so each nightly tick gets through the singleton
      // dedup window even if the per-employer key from a same-day signup
      // is still warm.
      const day = new Date().toISOString().slice(0, 10);
      await enqueueFlcVerify({
        employerId: e.id,
        tenantId: e.tenantId,
        reason: 'nightly_sweep',
        jobKey: `flc-verify-${e.id}-${day}`,
      });
      enqueued += 1;
    } catch (err) {
      console.error('[flc-verifier] sweep enqueue failed', {
        employerId: e.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { scanned: due.length, enqueued };
}
