import {
  prisma,
  FlcCheckStatus,
  LicenseType,
  VerificationAction,
  type Prisma,
  type Tx,
} from '@agconn/db';
import type { FlcVerifyJob } from '@agconn/flc-verify';
import { checkDlseLicense, type DlseScrapeResult } from './dlse.js';
import { lookupMspa, type MspaLookupResult } from './mspa-lookup.js';

// Worker entry point for an enqueued FLC verify job. Wraps the per-employer
// verification flow in a single transaction so the audit log row, the
// employer_profiles snapshot columns, and the verified-at promotion all land
// atomically.
//
// Fail-soft contract: any DLSE failure (timeout, parse error, CAPTCHA
// challenge) leaves flcVerifiedAt unchanged and writes an auto_verify_failed
// row to verification_log. The admin pending list surfaces the failed
// attempt so a human can intervene. We never auto-reject — false rejection
// is worse than a longer time-to-verify.

const SYSTEM_ACTOR_ID = 'system:flc-verifier';

export async function handleVerifyJob(job: FlcVerifyJob): Promise<void> {
  const employer = await prisma.employerProfile.findUnique({
    where: { id: job.employerId },
  });
  if (!employer) {
    console.warn('[flc-verifier] employer not found', job);
    return;
  }
  if (employer.deletedAt) return;

  // Growers don't carry a state license — they go through the manual grower
  // attestation path. Leave them alone and tag the snapshot so the sweep
  // doesn't keep retrying.
  if (employer.licenseType !== LicenseType.flc) {
    await prisma.employerProfile.update({
      where: { id: employer.id },
      data: {
        flcCheckStatus: FlcCheckStatus.not_applicable,
        flcLastCheckedAt: new Date(),
      },
    });
    return;
  }
  if (!employer.flcLicenseNum) {
    await writeAuditAndSnapshot(job, FlcCheckStatus.not_found, null, null, {
      reason: 'no_license_number_on_profile',
    });
    return;
  }

  await prisma.verificationLog.create({
    data: {
      tenantId: job.tenantId,
      employerId: job.employerId,
      action: VerificationAction.auto_verify_started,
      actorUserId: SYSTEM_ACTOR_ID,
      payload: { reason: job.reason, licenseNumber: employer.flcLicenseNum },
    },
  });

  const dlse = await checkDlseLicense(employer.flcLicenseNum);
  const mspa = await lookupMspa({
    certificateNumber: employer.dolMspaNum,
    legalName: employer.legalName,
  });

  await applyResult({
    job,
    employerId: employer.id,
    previouslyVerified: employer.flcVerifiedAt !== null,
    dlse,
    mspa,
  });
}

async function applyResult(input: {
  job: FlcVerifyJob;
  employerId: string;
  previouslyVerified: boolean;
  dlse: DlseScrapeResult;
  mspa: MspaLookupResult;
}): Promise<void> {
  const now = new Date();
  const status = mapDlseToStatus(input.dlse);
  const wasActive = status === FlcCheckStatus.active;

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);

      await tx.employerProfile.update({
        where: { id: input.employerId },
        data: {
          flcLastCheckedAt: now,
          flcCheckStatus: status,
          ...(input.dlse.kind === 'active' || input.dlse.kind === 'expired' || input.dlse.kind === 'suspended'
            ? {
                flcExpiresAt: input.dlse.expirationDate ? new Date(input.dlse.expirationDate) : null,
                flcLegalNameOnRecord: input.dlse.legalName,
              }
            : {}),
          ...(wasActive
            ? {
                flcVerifiedAt: input.previouslyVerified ? undefined : now,
                verifiedBy: input.previouslyVerified ? undefined : SYSTEM_ACTOR_ID,
                rejectedAt: null,
                rejectionReason: null,
              }
            : {}),
          ...applyMspaSnapshot(input.mspa, now),
        },
      });

      await writeOutcomeAuditRows(tx, input);
    },
    { timeout: 30_000, maxWait: 5_000 },
  );
}

function applyMspaSnapshot(
  mspa: MspaLookupResult,
  now: Date,
): Record<string, unknown> {
  if (mspa.kind === 'matched') {
    return {
      mspaVerifiedAt: now,
      mspaExpiresAt: mspa.match.expirationDate,
      mspaAuthHousing: mspa.match.authHousing,
      mspaAuthTransport: mspa.match.authTransport,
      mspaAuthDriving: mspa.match.authDriving,
    };
  }
  // Don't clear an existing MSPA snapshot just because a single sweep missed
  // it — the registry is monthly and a transient parse hiccup shouldn't
  // strip the badge. The nightly sync owns expiry via removedAt.
  return {};
}

async function writeOutcomeAuditRows(
  tx: Tx,
  input: {
    job: FlcVerifyJob;
    employerId: string;
    dlse: DlseScrapeResult;
    mspa: MspaLookupResult;
  },
): Promise<void> {
  const status = mapDlseToStatus(input.dlse);
  const action =
    status === FlcCheckStatus.active
      ? VerificationAction.auto_verify_succeeded
      : VerificationAction.auto_verify_failed;

  await tx.verificationLog.create({
    data: {
      tenantId: input.job.tenantId,
      employerId: input.employerId,
      action,
      actorUserId: SYSTEM_ACTOR_ID,
      notes: dlseNotes(input.dlse),
      payload: {
        dlse: dlseAuditPayload(input.dlse),
        reason: input.job.reason,
      },
    },
  });

  await tx.verificationLog.create({
    data: {
      tenantId: input.job.tenantId,
      employerId: input.employerId,
      action:
        input.mspa.kind === 'matched'
          ? VerificationAction.mspa_match_found
          : VerificationAction.mspa_match_missing,
      actorUserId: SYSTEM_ACTOR_ID,
      payload:
        input.mspa.kind === 'matched'
          ? {
              certificateNumber: input.mspa.match.certificateNumber,
              legalNameOnRecord: input.mspa.match.legalName,
              expirationDate: input.mspa.match.expirationDate.toISOString().slice(0, 10),
              auth: {
                housing: input.mspa.match.authHousing,
                transport: input.mspa.match.authTransport,
                driving: input.mspa.match.authDriving,
              },
            }
          : {},
    },
  });
}

function mapDlseToStatus(r: DlseScrapeResult): FlcCheckStatus {
  switch (r.kind) {
    case 'active':
      return FlcCheckStatus.active;
    case 'expired':
      return FlcCheckStatus.expired;
    case 'suspended':
      return FlcCheckStatus.suspended;
    case 'not_found':
      return FlcCheckStatus.not_found;
    case 'captcha_blocked':
      return FlcCheckStatus.captcha_blocked;
    case 'error':
      return FlcCheckStatus.error;
  }
}

function dlseNotes(r: DlseScrapeResult): string | null {
  if (r.kind === 'error') return `DLSE error: ${r.message}`;
  if (r.kind === 'captcha_blocked') return 'DLSE returned a CAPTCHA challenge — manual verify required.';
  if (r.kind === 'not_found') return 'License number not found in DLSE registry.';
  if (r.kind === 'expired') return 'DLSE shows license as expired.';
  if (r.kind === 'suspended') return 'DLSE shows license as suspended or revoked.';
  return null;
}

function dlseAuditPayload(r: DlseScrapeResult): Prisma.InputJsonObject {
  if (r.kind === 'error') return { kind: r.kind, message: r.message };
  if (r.kind === 'captcha_blocked' || r.kind === 'not_found') return { kind: r.kind };
  return {
    kind: r.kind,
    registrationNumber: r.registrationNumber,
    legalName: r.legalName,
    dbaName: r.dbaName,
    effectiveDate: r.effectiveDate,
    expirationDate: r.expirationDate,
    address: r.address,
  };
}

async function writeAuditAndSnapshot(
  job: FlcVerifyJob,
  status: FlcCheckStatus,
  expiresAt: Date | null,
  legalNameOnRecord: string | null,
  payload: Prisma.InputJsonObject,
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
      await tx.employerProfile.update({
        where: { id: job.employerId },
        data: {
          flcLastCheckedAt: new Date(),
          flcCheckStatus: status,
          ...(expiresAt ? { flcExpiresAt: expiresAt } : {}),
          ...(legalNameOnRecord ? { flcLegalNameOnRecord: legalNameOnRecord } : {}),
        },
      });
      await tx.verificationLog.create({
        data: {
          tenantId: job.tenantId,
          employerId: job.employerId,
          action: VerificationAction.auto_verify_failed,
          actorUserId: SYSTEM_ACTOR_ID,
          payload: { reason: job.reason, ...payload },
        },
      });
    },
    { timeout: 15_000 },
  );
}
