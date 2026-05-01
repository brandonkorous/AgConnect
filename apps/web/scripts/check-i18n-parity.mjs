#!/usr/bin/env node
// Bilingual parity check for apps/web/messages/{en,es}.json.
//
// Asserts:
//   1. Every key in en.json is present in es.json and vice versa (shape parity).
//   2. For every string-valued key:
//        - if en is non-empty, es must also be non-empty UNLESS the key is allowlisted.
//        - if both are non-empty, interpolation tokens ({foo}) must match.
//   3. Non-string leaf values (numbers, booleans, arrays of either) are
//      compared structurally for shape parity only.
//
// Exit 1 on any failure.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(here, '..', 'messages');

// MVP empty-ES allowlist. Remove entries when the Spanish reviewer fills them in.
const EMPTY_ES_ALLOWLIST = [
    /^admin\.audit\./,
];

const isAllowedEmptyEs = (key) => EMPTY_ES_ALLOWLIST.some((re) => re.test(key));

const flatten = (obj, prefix = '', out = new Map()) => {
    if (obj === null || obj === undefined) {
        out.set(prefix, obj);
        return out;
    }
    if (typeof obj !== 'object' || Array.isArray(obj)) {
        out.set(prefix, obj);
        return out;
    }
    for (const [k, v] of Object.entries(obj)) {
        flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
};

const tokens = (s) => {
    if (typeof s !== 'string') return new Set();
    const set = new Set();
    const re = /\{([a-zA-Z0-9_]+)(?:,[^}]*)?\}/g;
    let m;
    while ((m = re.exec(s)) !== null) set.add(m[1]);
    return set;
};

const en = JSON.parse(readFileSync(join(messagesDir, 'en.json'), 'utf8'));
const es = JSON.parse(readFileSync(join(messagesDir, 'es.json'), 'utf8'));

const flatEn = flatten(en);
const flatEs = flatten(es);

const errors = [];

for (const k of flatEn.keys()) {
    if (!flatEs.has(k)) errors.push(`MISSING in es.json: ${k}`);
}
for (const k of flatEs.keys()) {
    if (!flatEn.has(k)) errors.push(`MISSING in en.json: ${k}`);
}

for (const [k, vEn] of flatEn.entries()) {
    if (typeof vEn !== 'string') continue;
    if (vEn.length === 0) continue;
    const vEs = flatEs.get(k);
    if (typeof vEs !== 'string' || vEs.length === 0) {
        if (isAllowedEmptyEs(k)) continue;
        errors.push(`es.json[${k}] is empty/missing while en is non-empty`);
        continue;
    }
    const tEn = tokens(vEn);
    const tEs = tokens(vEs);
    for (const t of tEn) if (!tEs.has(t)) errors.push(`es.json[${k}] missing token {${t}}`);
    for (const t of tEs) if (!tEn.has(t)) errors.push(`en.json[${k}] missing token {${t}}`);
}

if (errors.length > 0) {
    console.error(`i18n parity check FAILED — ${errors.length} issue(s):`);
    for (const e of errors.slice(0, 50)) console.error(`  - ${e}`);
    if (errors.length > 50) console.error(`  ... +${errors.length - 50} more`);
    process.exit(1);
}

console.log(`i18n parity OK (${flatEn.size} keys checked)`);
