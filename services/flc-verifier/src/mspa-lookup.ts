import { prisma } from '@agconn/db';

// Local lookup against the cached MSPA registry. Two strategies, in order:
//   1. If the employer self-reported a DOL MSPA certificate number, we look
//      it up directly. Authoritative when present.
//   2. Otherwise, fuzzy-match on legal name. Used to catch employers who
//      didn't fill in the MSPA field but who do appear in the federal list
//      (so they get the badge anyway).
//
// "Not found" is meaningful: DOL only publishes *active* certificates, so
// absence in the latest sync = not currently registered. Lapsed certs are
// soft-deleted (removedAt set) on the next sync that doesn't include them.

export type MspaMatch = {
  certificateNumber: string;
  legalName: string;
  expirationDate: Date;
  authHousing: boolean;
  authTransport: boolean;
  authDriving: boolean;
};

export type MspaLookupResult =
  | { kind: 'matched'; match: MspaMatch }
  | { kind: 'not_found' };

export async function lookupMspa(args: {
  certificateNumber: string | null;
  legalName: string;
}): Promise<MspaLookupResult> {
  if (args.certificateNumber && args.certificateNumber.trim().length > 0) {
    const direct = await prisma.mspaFlcRegistry.findFirst({
      where: {
        certificateNumber: args.certificateNumber.trim().toUpperCase(),
        removedAt: null,
      },
    });
    if (direct) {
      return { kind: 'matched', match: toMatch(direct) };
    }
  }

  // Fuzzy: case-insensitive prefix match on the first significant chunk of
  // the employer's legal name. We deliberately don't go full ILIKE %name% —
  // false positives on common names ("ABC Farms LLC") would auto-stamp the
  // wrong record. Prefix-only keeps it conservative; the admin can always
  // verify manually for edge cases.
  const normalized = stripBusinessSuffixes(args.legalName).slice(0, 24);
  if (normalized.length < 4) return { kind: 'not_found' };

  const fuzzy = await prisma.mspaFlcRegistry.findFirst({
    where: {
      removedAt: null,
      legalName: { startsWith: normalized, mode: 'insensitive' },
    },
  });

  return fuzzy ? { kind: 'matched', match: toMatch(fuzzy) } : { kind: 'not_found' };
}

function toMatch(row: {
  certificateNumber: string;
  legalName: string;
  expirationDate: Date;
  authHousing: boolean;
  authTransport: boolean;
  authDriving: boolean;
}): MspaMatch {
  return {
    certificateNumber: row.certificateNumber,
    legalName: row.legalName,
    expirationDate: row.expirationDate,
    authHousing: row.authHousing,
    authTransport: row.authTransport,
    authDriving: row.authDriving,
  };
}

function stripBusinessSuffixes(name: string): string {
  return name
    .replace(/\b(?:LLC|L\.L\.C\.|Inc\.?|Corp\.?|Corporation|Co\.?|Company|Ltd\.?|LP|LLP)\b/gi, '')
    .replace(/[,.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
