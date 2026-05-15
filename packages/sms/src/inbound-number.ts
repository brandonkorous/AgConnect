// Public inbound number that workers text to opt in or apply to jobs.
// Single source of truth — every surface that displays "Text JOBS to ..."
// should call inboundPhoneDisplay() / inboundPhoneTel() rather than reading
// the env var directly.
//
// Server-only. The number is rendered on every marketing page, but only
// from server components, so the value is read at render-time on the
// server and shipped as plain HTML to the browser. If a 'use client'
// component ever needs it, pass it as a prop from a parent server
// component rather than re-introducing a NEXT_PUBLIC_ env var.
//
// Future multi-region expansion:
//   When AGCONN extends past the Central Valley (Salinas Valley, Imperial
//   Valley, etc.), each region gets its own 10DLC number registered to the
//   same brand under separate A2P campaigns. The single env var below will
//   be replaced by a `region_phone_numbers` table keyed by (region, locale)
//   and looked up by the caller's geo or saved-search county. Swap point
//   is right here — callers stay unchanged, helper grows a region arg.

const RAW_FALLBACK = '+15597444422';

function raw(): string {
    return process.env.TWILIO_INBOUND_PHONE || RAW_FALLBACK;
}

/**
 * E.164 form, suitable for tel:/sms: deep links and outbound API calls.
 * Example: `+15597444422`
 */
export function inboundPhoneTel(): string {
    return raw();
}

/**
 * Human-display form for marketing surfaces. US-formatted; if the number
 * doesn't match the expected `+1XXXXXXXXXX` shape we return it unchanged
 * so misconfigured envs surface visibly rather than silently mangling.
 * Example: `+15597444422` -> `(559) 744-4422`
 */
export function inboundPhoneDisplay(): string {
    const e164 = raw();
    const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
    if (!match) return e164;
    return `(${match[1]}) ${match[2]}-${match[3]}`;
}

/**
 * Per-locale opt-in keyword recommendation for marketing surfaces. The
 * full set of accepted keywords lives server-side in twilio.ts; this is
 * just the one we show on flyers and landing pages for each language.
 */
export function inboundOptInKeyword(locale: 'en' | 'es'): string {
    return locale === 'es' ? 'TRABAJO' : 'JOBS';
}
