# 02 — Placement Report: Acceptance Criteria

## Functional

- [ ] Report includes only `applications.status = 'hired'` rows in the date range.
- [ ] Anonymized `participantId` stable: same `(tenantId, workerId)` always produces the same ID.
- [ ] `includeNames=false` (default) leaves First Name and Last Name columns empty.
- [ ] CSV is UTF-8 with BOM (Excel-friendly) or without (cleaner) — per partner preference.
- [ ] XLSX has frozen header row and auto-filter enabled.
- [ ] Filters (county, funder, date range) all apply correctly.
- [ ] Email-delivery option produces a Resend email with the file attached and a Blob backup.
- [ ] Every export logs a `report_runs` row.
- [ ] Numbers in the report match the `/admin/v1/kpi/summary.placements.count` for the same filters.

## Non-functional

- [ ] 10k-row export completes in < 30s.
- [ ] Generated XLSX file size < 5MB for typical sizes.
- [ ] No SSN, no plaintext phone, no sensitive PII in the export by default.
- [ ] Worker name only included when `includeNames=true` AND admin is authenticated.

## Compliance

- [ ] WIOA field labels match a published reference (verified at action-item meeting).
- [ ] Pepper for participant ID stored in Azure Key Vault, not committed.
- [ ] Report-runs audit log preserved 13+ months.

## Test scenarios

### Unit

1. `participantId` deterministic and pepper-bound: changing pepper produces different IDs.
2. CSV / XLSX renderer handles empty result set without errors.
3. Date range too wide rejected.

### Integration

1. **Round-trip:** seed 50 hires → export → assert 50 rows in CSV with correct columns.
2. **Filter combinations:** county filter narrows rows; funder filter narrows further.
3. **PII redaction:** export with `includeNames=false` → grep for any worker name in the CSV → 0 matches.
4. **Email delivery:** export with `email` set → verify `email_log` row + Blob upload.

### Manual

1. Generate a real Q1 export, paste into Excel, sort by Hire Date — should look natural.
2. Show to a CDFA contact for the action-item validation.

## Definition of done

- Action item completed: at least one CDFA / EDD contact has reviewed a sample CSV.
- Field labels documented in a `WIOA_FIELDS.md` reference.
- All filters tested.
- Sentry tags every export with `rowCount`, `format`, `userId`.
- Admin runbook: how to re-generate a corrupted past report.
