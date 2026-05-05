-- Folds in two scripts that previously lived as one-off `packages/db/scripts/*`
-- and drifted out of `prisma migrate`:
--   - add-evidence-columns.ts        (compliance_items.evidence_*)
--   - add-compliance-item-content-table.ts (compliance_item_content + trigger)
-- Idempotent so re-applying on an already-patched database is a no-op.

ALTER TABLE compliance_items
  ADD COLUMN IF NOT EXISTS evidence_storage_key TEXT,
  ADD COLUMN IF NOT EXISTS evidence_file_name TEXT,
  ADD COLUMN IF NOT EXISTS evidence_content_type TEXT,
  ADD COLUMN IF NOT EXISTS evidence_size INTEGER;

CREATE TABLE IF NOT EXISTS compliance_item_content (
  item_key       TEXT PRIMARY KEY,
  content        JSONB NOT NULL,
  published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by_id  TEXT
);

CREATE OR REPLACE FUNCTION compliance_item_content_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS compliance_item_content_updated_at_trg ON compliance_item_content;

CREATE TRIGGER compliance_item_content_updated_at_trg
BEFORE UPDATE ON compliance_item_content
FOR EACH ROW EXECUTE FUNCTION compliance_item_content_set_updated_at();
