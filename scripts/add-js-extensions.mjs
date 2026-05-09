#!/usr/bin/env node
// Adds .js extensions to all bare relative imports/exports across services and
// packages so they satisfy Node.js strict ESM resolution (module: NodeNext).
//
// Pattern targeted: from './foo'  or  from '../bar/baz'
// where the specifier has no extension yet.
// Handles both import and export … from '…' forms.

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const TARGETS = [
    'services/api/src',
    'services/audit-retention/src',
    'services/audit-verifier/src',
    'services/cert-generator/src',
    'services/email-worker/src',
    'services/resume-parser/src',
    'services/scheduler/src',
    'services/sms-worker/src',
    'packages/db/src',
    'packages/audit/src',
    'packages/email/src',
    'packages/sms/src',
    'packages/schemas/src',
    'packages/api-client/src',
    'packages/llm/src',
];

// Matches: from '…' or from "…" for bare relative paths (no extension yet)
const BARE_REL = /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g;

// Matches: import '…' (side-effect, no `from`) for bare relative paths
const BARE_SIDE_EFFECT = /(import\s+['"])(\.\.?\/[^'"]+?)(['"])/g;

// Matches: await import('…') and import('…') dynamic forms
const BARE_DYNAMIC = /(import\s*\(\s*['"])(\.\.?\/[^'"]+?)(['"]\s*\))/g;

function hasKnownExt(p) {
    return /\.(js|mjs|cjs|ts|tsx|jsx|json|css|scss|svg|png|woff2?)$/.test(p);
}

function walkTs(dir) {
    const files = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            files.push(...walkTs(full));
        } else if (/\.(ts|tsx)$/.test(entry)) {
            files.push(full);
        }
    }
    return files;
}

let changed = 0;
let skipped = 0;

for (const rel of TARGETS) {
    const srcDir = join(root, rel);
    let files;
    try {
        files = walkTs(srcDir);
    } catch {
        continue; // dir doesn't exist for this service
    }

    for (const file of files) {
        const original = readFileSync(file, 'utf8');
        const updated = original
            .replace(BARE_REL, (_, prefix, specifier, suffix) => {
                if (hasKnownExt(specifier)) return prefix + specifier + suffix;
                return prefix + specifier + '.js' + suffix;
            })
            .replace(BARE_SIDE_EFFECT, (_, prefix, specifier, suffix) => {
                if (hasKnownExt(specifier)) return prefix + specifier + suffix;
                return prefix + specifier + '.js' + suffix;
            })
            .replace(BARE_DYNAMIC, (_, prefix, specifier, suffix) => {
                if (hasKnownExt(specifier)) return prefix + specifier + suffix;
                return prefix + specifier + '.js' + suffix;
            });

        if (updated !== original) {
            writeFileSync(file, updated);
            changed++;
        } else {
            skipped++;
        }
    }
}

console.log(`Done. Modified ${changed} files, ${skipped} already correct.`);
