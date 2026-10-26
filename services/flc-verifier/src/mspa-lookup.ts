import { serviceDb } from '@agconn/db';

// MSPA lookup: by self-reported certificate number first, else a fuzzy legal-name match.
// Not found is meaningful: DOL lists active certificates only.

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
    const direct = await serviceDb.mspaFlcRegistry.findFirst({
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

  const fuzzy = await serviceDb.mspaFlcRegistry.findFirst({
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
