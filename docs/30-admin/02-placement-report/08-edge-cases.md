# 02 — Placement Report: Edge Cases & Risks

## Field label drift

WIOA field labels evolve. Our labels stop matching CalJOBS expectations.

**Mitigation:**

- Labels documented in `WIOA_FIELDS.md`.
- Annual review with a partner CDFA / EDD contact.
- Labels not hardcoded in the SQL — defined in `packages/reporting/src/placement-fields.ts` for easy update.

## Worker deletion mid-report-period

Worker hired Jan 5, deleted Mar 1. They appear in Q1 placement report.

**Behavior:** include them. Their hire happened. Hard-deleted PII is anonymized; their `participantId` is stable for the report.

If deeply deleted (CCPA hard-delete with PII anonymization), some fields may show `[anonymized]`. Document this for grantee.

## Tenant deletion

Soft-deleted tenant's data still in DB. Should it appear in cross-tenant reports?

**Decision:** include unless admin specifies. Soft-deleted tenants have a flag visible in the export ("Tenant: AgConn Central Valley (archived)") for clarity.

## SOC code requirement

Some grantees require SOC codes (Standard Occupational Classification).

**Decision (MVP):** SOC code column present but blank. Phase 2: optional employer-attestation at posting creation; LLM-assisted SOC suggestion based on `titleEn`.

## Q2 / Q4 retention

WIOA requires re-employment check at Q2 (2nd quarter post-exit) and Q4. AgConn can't auto-detect re-employment elsewhere.

**Decision:** column placeholder for grantee to fill manually after their own follow-up. Document in the export's first-row comments.

## Prevailing-wage compliance

Some grants require placement at or above prevailing wage.

**Behavior:** the report exposes the wage; grantee compares to prevailing wage themselves. AgConn doesn't enforce.

## Anonymized ID instability

If pepper is rotated, all existing reports' participantIds become inconsistent with future reports.

**Mitigation:** never rotate the pepper after launch (treat as long-lived secret). Document in runbook.

> **Inferred:** Treat the participant ID pepper like a primary key — immutable once set. Rotating breaks longitudinal tracking. If compromised (rare), accept ID re-issuance with admin coordination + grantee notification.

## CSV encoding for Excel

Excel sometimes mis-detects UTF-8 encoding without BOM.

**Mitigation:** offer both with-BOM and without-BOM via a checkbox in the form. Default: with BOM (more grantees use Excel).

## Large date ranges

Admin requests 5-year report.

**Mitigation:**

- API rejects > 2 year range with `date_range_too_wide`.
- For multi-year, admin runs multiple reports and concatenates.
- Phase 2: chunked export.

## Concurrent generation

Two admins click Generate at once.

**Behavior:** both succeed; two `report_runs` rows. No DB conflict.

## Outlier detection

Outlier wage ($300/hr "hire") could be a typo.

**Mitigation:**

- Input validation on hire flow caps wage at $500/hr.
- Report includes the value as captured.
- Future: anomaly flag column.

## Privacy: worker name inclusion

Including names in the export is a deliberate admin choice. Make sure it's logged.

**Mitigation:** `report_runs.filters.includeNames` recorded; admin role required.

## Email delivery to non-admin

Admin sets `email` to a non-admin's address. Email contains PII.

**Decision:** allow, but log. Risk owned by admin. Out of scope for code-level access control beyond audit.

> **Inferred:** Some grantees want reports emailed to themselves. Don't block; rely on admin discipline + audit log.

## Timezone

All dates in PT for consistency. Export header notes "All dates in America/Los_Angeles".

## Open questions

1. Per-grantee scope — when does Phase 2 grantee-org role ship? Allows orgs to download their own data without admin involvement.
2. Scheduled / recurring reports — admin schedules quarterly auto-generate? Useful but not MVP.
3. Multi-tenant aggregated reports for funders ("show me all CDFA-funded placements across regions") — Phase 2.
4. Direct CalJOBS API integration — does CalJOBS have one? Likely no; defer.
