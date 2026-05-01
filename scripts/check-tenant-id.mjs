#!/usr/bin/env node
// Convention check: every tenant-scoped Prisma model must declare a tenant_id
// column AND a (tenant_id) index. Models global by design opt out via
// EXEMPT_MODELS below — keep that list short and audit it on every change.
//
// Run with: `node scripts/check-tenant-id.mjs`. CI calls it as part of
// `pnpm typecheck`. Exit code != 0 fails the build.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = resolve(here, '..', 'packages/db/prisma/schema.prisma');

// Global tables (no tenant_id by design). Adding to this list is a
// security-relevant decision; require review.
const EXEMPT_MODELS = new Set([
  'Tenant',
  'EmailSuppression',
  'SmsOptOut',
]);

// Models that are PRESENT but only optionally tied to a tenant. They MUST
// still have a tenant_id column; the runtime decides what to do when null.
const NULLABLE_TENANT_MODELS = new Set([
  'User',
  'AuthEvent',
]);

const text = readFileSync(SCHEMA, 'utf8');

// Crude block extractor — works because schema.prisma uses one model { ... }
// per logical record and we control the file's formatting.
const modelRe = /\bmodel\s+([A-Z][A-Za-z0-9_]*)\s*\{([\s\S]*?)\n\}/g;

const errors = [];

let match;
while ((match = modelRe.exec(text)) !== null) {
  const name = match[1];
  const body = match[2];

  if (EXEMPT_MODELS.has(name)) continue;

  const tenantLineRe = /^\s*tenantId\s+(String\??)[^\n]*@map\("tenant_id"\)/m;
  const tenantLineMatch = body.match(tenantLineRe);
  const hasTenantField = Boolean(tenantLineMatch);
  const isNullable = tenantLineMatch?.[1] === 'String?';
  const hasTenantIndex =
    /@@index\(\[tenantId(\b|,)/.test(body) ||
    /@@unique\(\[tenantId(\b|,)/.test(body);

  if (!hasTenantField) {
    errors.push(`model ${name}: missing tenantId field mapped to tenant_id`);
  } else if (!hasTenantIndex) {
    errors.push(`model ${name}: missing @@index([tenantId, ...]) (or compound @@unique starting with tenantId)`);
  }

  if (NULLABLE_TENANT_MODELS.has(name)) {
    if (hasTenantField && !isNullable) {
      errors.push(`model ${name}: NULLABLE_TENANT_MODELS list says tenantId must be String?, not String`);
    }
  } else if (hasTenantField && isNullable) {
    errors.push(`model ${name}: tenantId is nullable but model is not in NULLABLE_TENANT_MODELS`);
  }
}

if (errors.length > 0) {
  console.error('check-tenant-id: schema violations');
  for (const e of errors) console.error('  - ' + e);
  console.error('\nIf a model is genuinely global (no tenant scope), add it to EXEMPT_MODELS in scripts/check-tenant-id.mjs and document the rationale.');
  process.exit(1);
}

console.log('check-tenant-id: ok');
