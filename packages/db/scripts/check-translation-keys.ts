// Diagnostic: confirm new save-bar / wage-range translation keys are present
// in the translation_keys table after running i18n:seed.
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const targets = [
  'field_base_rate_min',
  'field_base_rate_max',
  'save_draft',
  'save_no_notify',
  'save_notify_crew',
  'renotify_suppressed',
];

const sample = await prisma.translationKey.findMany({
  where: { namespace: 'employer', key: 'jobs.form_v2.field_base_rate_min' },
  select: { namespace: true, key: true, locale: true, value: true, status: true, tenantId: true, publishedAt: true },
});
console.log({ sample });
await prisma.$disconnect();
