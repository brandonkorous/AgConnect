import { createHash } from 'node:crypto';

// Stable, non-reversible participant identifier for WIOA / CalJOBS exports.
// Same (tenantId, workerId, pepper) always produces the same ID, which lets
// grantees do longitudinal tracking without ever holding raw worker IDs.
//
// PARTICIPANT_PEPPER is treated as immutable once set — rotating it breaks
// every previously-issued report. See docs/30-admin/02-placement-report/08-edge-cases.md.

export class ParticipantPepperMissingError extends Error {
  constructor() {
    super(
      'PARTICIPANT_PEPPER env var is not set. Required for WIOA participant ID hashing.',
    );
    this.name = 'ParticipantPepperMissingError';
  }
}

export function participantId(tenantId: string | null, workerId: string): string {
  const pepper = process.env.PARTICIPANT_PEPPER;
  if (!pepper) throw new ParticipantPepperMissingError();
  const tenantPart = tenantId ?? 'platform';
  const hash = createHash('sha256')
    .update(`${tenantPart}:${workerId}:${pepper}`)
    .digest('hex');
  return `P-${hash.slice(0, 12).toUpperCase()}`;
}
