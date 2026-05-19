#!/usr/bin/env node
// Convention check: the SMS template catalog
// (packages/sms/src/templates/index.ts) must hold two invariants that were
// previously author-memory.
//
//  1. Opt-out compliance. Every template categorized `promotional` or
//     `compliance` must contain the literal opt-out token "STOP" in BOTH the
//     en and es body. Transactional templates are exempt (A2P 10DLC: opt-out
//     language is required on recurring/promotional and consent-flow content,
//     not on every direct transactional reply).
//
//  2. Segment budget. Each template's static skeleton (placeholders
//     unexpanded — a structural floor; the real send is always >= this) must
//     fit within DEFAULT_MAX_SEGMENTS, unless the entry declares its own
//     `maxSegments` (a reviewed, written-down exception for mandated long
//     disclosures, never silent).
//
// When to run: part of `pnpm check:conventions` (lint + typecheck gates).
// What it touches: read-only; parses the one catalog file.
// Safe to run repeatedly. A regex scanner is used over importing the TS
// module to match the other check-*.mjs scanners and avoid a build step.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const CATALOG = resolve(here, '..', 'packages/sms/src/templates/index.ts');

const DEFAULT_MAX_SEGMENTS = 3;
const OPT_OUT_TOKEN = 'STOP';

// --- GSM-7 / UCS-2 segment math (mirrors packages/sms/src/segments.ts; kept
// independent so the gate has no build dependency on the package). ---
const GSM7_BASIC = new Set(
    (
        '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ' +
        ' !"#¤%&\'()*+,-./0123456789:;<=>?' +
        '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§' +
        '¿abcdefghijklmnopqrstuvwxyzäöñüà'
    ).split(''),
);
const GSM7_EXT = new Set('^{}\\[~]|€'.split(''));

function segments(text) {
    let gsm7 = true;
    for (const ch of text) {
        if (!GSM7_BASIC.has(ch) && !GSM7_EXT.has(ch)) {
            gsm7 = false;
            break;
        }
    }
    if (gsm7) {
        let units = 0;
        for (const ch of text) units += GSM7_EXT.has(ch) ? 2 : 1;
        return units <= 160 ? 1 : Math.max(1, Math.ceil(units / 153));
    }
    const units = text.length;
    return units <= 70 ? 1 : Math.max(1, Math.ceil(units / 67));
}

// --- Parse the catalog. Entries end with a line `    }),` which never occurs
// inside the single-line template literals, so it is a safe block delimiter
// (template `}` placeholders and `})` like `{county})` would break a naive
// non-greedy match — this avoids that). ---
const src = readFileSync(CATALOG, 'utf8');
const start = src.indexOf('smsTemplates = {');
const end = src.indexOf('\n} as const;', start);
if (start < 0 || end < 0) {
    console.error('check-sms: could not locate smsTemplates catalog region');
    process.exit(1);
}
const region = src.slice(start, end);
const blocks = region.split(/\n {4}\}\),?/).filter((b) => b.includes('def({'));

function literal(block, key) {
    // Capture the JS string literal after `key:` — quote-delimited, honoring
    // backslash escapes, no real newlines inside (\n is literal here).
    const re = new RegExp(`\\b${key}\\s*:\\s*('|")((?:\\\\.|(?!\\1).)*)\\1`, 's');
    const m = block.match(re);
    return m ? m[2] : null;
}

const failures = [];
let checked = 0;

for (const block of blocks) {
    const keyMatch = block.match(/(['"]?)([\w.]+)\1\s*:\s*def\(\{/);
    if (!keyMatch) continue;
    const name = keyMatch[2];
    const en = literal(block, 'en');
    const es = literal(block, 'es');
    const catMatch = block.match(/category\s*:\s*'(\w+)'/);
    const maxMatch = block.match(/maxSegments\s*:\s*(\d+)/);
    if (!en || !es || !catMatch) {
        failures.push(`${name}: could not parse en/es/category`);
        continue;
    }
    checked += 1;
    const category = catMatch[1];
    const budget = maxMatch ? Number(maxMatch[1]) : DEFAULT_MAX_SEGMENTS;

    if (category === 'promotional' || category === 'compliance') {
        if (!en.includes(OPT_OUT_TOKEN) || !es.includes(OPT_OUT_TOKEN)) {
            failures.push(
                `${name} [${category}]: missing "${OPT_OUT_TOKEN}" opt-out token in ${
                    !en.includes(OPT_OUT_TOKEN) ? 'en' : 'es'
                }`,
            );
        }
    }

    for (const [loc, body] of [
        ['en', en],
        ['es', es],
    ]) {
        const segs = segments(body);
        if (segs > budget) {
            failures.push(
                `${name} [${loc}]: skeleton is ${segs} segments, budget ${budget}` +
                    (maxMatch ? ' (declared)' : ` (default ${DEFAULT_MAX_SEGMENTS})`) +
                    ' — shorten the copy or declare maxSegments with a reason',
            );
        }
    }
}

if (checked === 0) {
    console.error('check-sms: parsed 0 templates — parser or catalog drift');
    process.exit(1);
}

if (failures.length) {
    console.error(`check-sms: FAIL (${checked} templates checked)`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
}

console.log(`check-sms: ok (${checked} templates)`);
