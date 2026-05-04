// One-off: creates compliance_item_content table directly via SQL.
// Necessary because `prisma db push` chokes on our partitioned audit_events
// table. Idempotent (CREATE TABLE IF NOT EXISTS).

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '..', '.env') });

const { prisma } = await import('../src/index.js');

await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS compliance_item_content (
  item_key       TEXT PRIMARY KEY,
  content        JSONB NOT NULL,
  published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_id  TEXT
);
`);

await prisma.$executeRawUnsafe(`
CREATE OR REPLACE FUNCTION compliance_item_content_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`);

await prisma.$executeRawUnsafe(`
DROP TRIGGER IF EXISTS compliance_item_content_updated_at_trg ON compliance_item_content;
`);

await prisma.$executeRawUnsafe(`
CREATE TRIGGER compliance_item_content_updated_at_trg
BEFORE UPDATE ON compliance_item_content
FOR EACH ROW EXECUTE FUNCTION compliance_item_content_set_updated_at();
`);

console.log('compliance_item_content table ensured.');
await prisma.$disconnect();
