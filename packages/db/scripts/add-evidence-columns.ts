// One-off: adds the evidence storage columns to compliance_items.
// Idempotent (uses IF NOT EXISTS).

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

const SQL = `
ALTER TABLE compliance_items
  ADD COLUMN IF NOT EXISTS evidence_storage_key TEXT,
  ADD COLUMN IF NOT EXISTS evidence_file_name TEXT,
  ADD COLUMN IF NOT EXISTS evidence_content_type TEXT,
  ADD COLUMN IF NOT EXISTS evidence_size INTEGER;
`.trim();

await prisma.$executeRawUnsafe(SQL);
console.log('compliance_items evidence columns ensured.');
await prisma.$disconnect();
