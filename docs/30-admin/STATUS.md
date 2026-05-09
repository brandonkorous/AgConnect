# 30-admin — Implementation status

Last updated: 2026-05-09

## Shipped

### 02-placement-report

WIOA / CalJOBS placement export. CSV + XLSX, anonymized participant IDs,
optional names, county / funder / date-range filters. Every export is
archived to Supabase Storage (`grant-reports` bucket) and logged to
`report_runs`. Optional email delivery via `grant.report_ready` template.
Re-download via signed URL from the runs page.

- API: `/admin/v1/reports/placement/{preview,export}`, `/admin/v1/reports/runs`,
  `/admin/v1/reports/runs/:id/download`
- UI: `/[locale]/admin/reports/{,placement,runs}`
- Migration: `20260509120000_report_runs`
- Reporting package: `packages/reporting`

**Outstanding action item from spec §47**: validate field mapping with one
CDFA grantee or Central Valley EDD Local Area rep before each program year.
This is a one-hour meeting, not a code task. Until it lands, the marketing
copy on `partners_page.wioa.body` is conservatively phrased — "field labels
follow WIOA Title I conventions" rather than "reviewed against the most
recent CDFA / EDD reporting templates."

## Deferred (post-launch)

### 01-kpi-dashboard

Admin internal-metrics view. Not ship-blocking — the KPIs are derivable
from existing data. Build after launch when the operations cadence
clarifies which numbers actually drive decisions.

### 03-training-report

Training-completion + certificate-issuance export, scoped per-funder
(CDFA, F3, CalOSBA, EDD). Reuses the same `report_runs` plumbing as
placement. Field labels need a separate WIOA-Title-I-D / WIOA-Adult-Ed
review with whichever grantee partner we're closest to.

**To unblock**: copy `02-placement-report/02-data-model.md`'s SQL pattern
against `enrollments` joined with `training_programs`, define columns in
`packages/reporting/src/training-fields.ts`, add a `runTrainingReport`
service, mount routes under `/admin/v1/reports/training/*`, build the
builder UI.

### 04-employer-activity

Per-employer roll-up: postings, applicants, hires, average wage, time-to-hire.
Useful for funder reporting on which employers absorbed the most workforce-
program participants. Lower priority than the other two — it's an internal
analysis tool more than a reporting deliverable.

## Notes

The reporting package (`packages/reporting`) is designed to host all three
reports. Adding training-report or employer-activity-report is additive —
new field registry + new SQL service + new routes group, no schema changes
required (`report_runs.reportType` already accepts the discriminator).
