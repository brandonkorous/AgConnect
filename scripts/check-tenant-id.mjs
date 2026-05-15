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

// Models with no tenant_id by design. Adding to this list is a
// security-relevant decision; require review.
//
// Three categories live here:
//   1. The tenant table itself.
//   2. Cross-tenant compliance/safety tables (suppression lists).
//   3. Worker-scoped tables — workers are platform-level in the AGCONN
//      multi-tenancy model (employers are tenants, workers are not). These
//      tables still have RLS, but it is keyed off the worker's user id, not
//      tenant_id. See docs/00-foundation/02-multi-tenancy.
//   4. Global reference catalogs read by every tenant. These are owned by
//      ops and edited via the admin surface, not the tenant API.
//   5. Platform-level federal datasets and their sync metadata. Synced from
//      external sources (DOL/WHD, USDOL ETA) and read cross-tenant; no
//      tenant owns the rows.
const EXEMPT_MODELS = new Set([
    // category 1
    'Tenant',
    // category 2
    'EmailSuppression',
    'SmsOptOut',
    // category 3 — worker-scoped (platform-level)
    'WorkerProfile',
    'SavedSearch',
    'SearchView',
    // category 4 — global reference catalogs
    'ComplianceItemContent',
    'Crop',
    'RoleType',
    'SkillTag',
    // category 5 — federal datasets + sync metadata
    'MspaFlcRegistry',
    'MspaSyncRun',
    'AewrRate',
]);

// Models that are PRESENT but only optionally tied to a tenant. They MUST
// still have a tenant_id column; the runtime decides what to do when null.
const NULLABLE_TENANT_MODELS = new Set([
    'User',
    'AuthEvent',
    // Translations: rows with tenantId=null are the global bundle (default
    // strings shown to every tenant); rows with tenantId set are per-tenant
    // overrides. Uniqueness is enforced via partial indexes in SQL.
    'TranslationKey',
    // Landing waitlist signups are pre-account (no owning tenant). Anonymous
    // role inserts with tenant_id=NULL; the partial unique index
    // waitlist_email_anonymous_key keeps duplicates out. See migration
    // 20260504200000_three_bucket_tenancy and 20260509100000_anonymous_landing.
    'Waitlist',
    // email_log rows for waitlist confirm/welcome emails carry NULL tenant_id
    // because the parent waitlist row is platform-level. Employer/tenant-scoped
    // emails still set tenant_id; the email_log_service policy uses NULLIF to
    // permit both shapes. See migration 20260509100000_anonymous_landing.
    'EmailLog',
    // Admin grant-report exports. tenant_id is set when an admin scopes the
    // export to a single tenant, NULL when the export is cross-tenant (e.g.
    // statewide placement reporting). See docs/30-admin/02-placement-report.
    'ReportRun',
    // Feature flags: rows with tenantId=null are the platform default; rows
    // with tenantId set are per-tenant overrides. Uniqueness is enforced via
    // partial indexes in the migration (mirrors TranslationKey).
    'FeatureFlag',
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
