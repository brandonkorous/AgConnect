// SMS segment + encoding analysis (3GPP TS 23.038).
//
// SMS billing and deliverability are governed by segment count, not character
// count. A message that fits GSM-7 sends 160 chars in one segment; one stray
// character outside the GSM-7 alphabet (common in ES copy: accented vowels,
// inverted punctuation) forces the whole message to UCS-2 at 70 chars/segment.
// This module makes that cost visible — at render time (logged per send) and
// at build time (scripts/check-sms.mjs budget gate). The SMS analog of the
// email pipeline knowing its payload, without aping email's HTML machinery.

// GSM-7 default alphabet (basic set). Characters here are 1 unit each.
const GSM7_BASIC =
    '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ' +
    ' !"#¤%&\'()*+,-./0123456789:;<=>?' +
    '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§' +
    '¿abcdefghijklmnopqrstuvwxyzäöñüà';

// GSM-7 extension table. Each of these is 2 units (an ESC + the char).
const GSM7_EXTENSION = '^{}\\[~]|€';

const GSM7_BASIC_SET = new Set(GSM7_BASIC.split(''));
const GSM7_EXT_SET = new Set(GSM7_EXTENSION.split(''));

export type SmsEncoding = 'gsm7' | 'ucs2';

export type SegmentInfo = {
    encoding: SmsEncoding;
    /** Billable units: GSM-7 counts extension chars as 2; UCS-2 counts a
     *  surrogate pair (most emoji) as 2 code units. */
    units: number;
    /** Number of SMS segments the carrier will bill and send. */
    segments: number;
};

// Single-segment / concatenated per-segment limits per encoding.
const LIMITS = {
    gsm7: { single: 160, multi: 153 },
    ucs2: { single: 70, multi: 67 },
} as const;

function isGsm7(text: string): boolean {
    for (const ch of text) {
        if (!GSM7_BASIC_SET.has(ch) && !GSM7_EXT_SET.has(ch)) return false;
    }
    return true;
}

function gsm7Units(text: string): number {
    let n = 0;
    for (const ch of text) n += GSM7_EXT_SET.has(ch) ? 2 : 1;
    return n;
}

/**
 * Analyze a fully-rendered SMS body. Use at send time on the final string
 * (renderSms output) for per-message observability, or at build time on a
 * template skeleton for a structural floor (placeholders unexpanded — the
 * real send is always >= this).
 */
export function segmentInfo(text: string): SegmentInfo {
    if (isGsm7(text)) {
        const units = gsm7Units(text);
        const { single, multi } = LIMITS.gsm7;
        const segments = units <= single ? 1 : Math.ceil(units / multi);
        return { encoding: 'gsm7', units, segments: Math.max(1, segments) };
    }
    // UCS-2: count UTF-16 code units (surrogate pairs are 2).
    const units = text.length;
    const { single, multi } = LIMITS.ucs2;
    const segments = units <= single ? 1 : Math.ceil(units / multi);
    return { encoding: 'ucs2', units, segments: Math.max(1, segments) };
}
