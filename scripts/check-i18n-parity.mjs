// Verify EN/ES message catalogs share the same key shape.
//
// Pass:
//   - same number of keys
//   - every key in en.json exists in es.json and vice-versa
//   - ICU placeholders ({name}, {count}, etc.) match between locales
//   - no key contains a literal '.' (next-intl 4.11 forbids that)
//
// Exits non-zero on the first failure so CI can gate on it.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const FILES = [
  ['en', 'apps/web/messages/en.json'],
  ['es', 'apps/web/messages/es.json'],
];

const PLACEHOLDER_RE = /\{([a-zA-Z][a-zA-Z0-9_]*)(?:,[^}]*)?\}/g;

function load() {
  return Object.fromEntries(
    FILES.map(([locale, p]) => [
      locale,
      JSON.parse(readFileSync(resolve(ROOT, p), 'utf8')),
    ]),
  );
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const k of Object.keys(obj)) {
    if (k.includes('.')) {
      throw new Error(
        `key contains '.' which next-intl forbids: '${prefix ? prefix + '.' : ''}${k}'`,
      );
    }
    const np = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, np));
    } else {
      out[np] = v;
    }
  }
  return out;
}

function placeholders(value) {
  if (typeof value !== 'string') return new Set();
  const set = new Set();
  for (const m of value.matchAll(PLACEHOLDER_RE)) set.add(m[1]);
  return set;
}

function diff(a, b) {
  const out = [];
  for (const k of Object.keys(a)) if (!(k in b)) out.push(k);
  return out;
}

function eqSet(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function main() {
  const cats = load();
  const flat = Object.fromEntries(
    Object.entries(cats).map(([loc, doc]) => [loc, flatten(doc)]),
  );

  const en = flat.en;
  const es = flat.es;

  const missingEs = diff(en, es);
  const missingEn = diff(es, en);

  const placeholderMismatches = [];
  for (const k of Object.keys(en)) {
    if (!(k in es)) continue;
    const a = placeholders(en[k]);
    const b = placeholders(es[k]);
    if (!eqSet(a, b)) {
      placeholderMismatches.push({
        key: k,
        en: [...a],
        es: [...b],
      });
    }
  }

  const ok =
    missingEn.length === 0 &&
    missingEs.length === 0 &&
    placeholderMismatches.length === 0;

  console.log(`en keys: ${Object.keys(en).length}`);
  console.log(`es keys: ${Object.keys(es).length}`);

  if (missingEs.length) {
    console.error(`\nMissing in es.json (${missingEs.length}):`);
    missingEs.slice(0, 25).forEach((k) => console.error('  ' + k));
    if (missingEs.length > 25) console.error(`  …and ${missingEs.length - 25} more`);
  }
  if (missingEn.length) {
    console.error(`\nMissing in en.json (${missingEn.length}):`);
    missingEn.slice(0, 25).forEach((k) => console.error('  ' + k));
    if (missingEn.length > 25) console.error(`  …and ${missingEn.length - 25} more`);
  }
  if (placeholderMismatches.length) {
    console.error(`\nPlaceholder mismatches (${placeholderMismatches.length}):`);
    placeholderMismatches.slice(0, 25).forEach((m) => {
      console.error(
        `  ${m.key}\n    en: {${m.en.join(', ')}}\n    es: {${m.es.join(', ')}}`,
      );
    });
    if (placeholderMismatches.length > 25)
      console.error(`  …and ${placeholderMismatches.length - 25} more`);
  }

  if (!ok) {
    console.error('\ni18n parity check failed.');
    process.exit(1);
  }
  console.log('\ni18n parity OK ✓');
}

try {
  main();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
