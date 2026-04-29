# 03 — Training Report: Overview

## Purpose

Generate exports of training program enrollment, completion, and certification data — sliced by program, funder, training organization, and county. Used by grantees (especially CDFA / F3 funded) for their funder reports.

## What it captures

- Enrollment counts by program / funder / county / org
- Completion counts (workers who finished)
- No-show / drop counts
- Cert generation counts (subset of completions)
- Demographics: county, language preference (no SSN, no race/ethnicity required)

## Filter dimensions

- Funder (CDFA / F3 / CalOSBA / EDD / other)
- Training org
- Date range (program completion or enrollment range)
- County
- Tenant (admin only)

## Scope

In scope:

- Per-enrollment row exports (CSV/XLSX)
- Aggregated views by program, by funder, by org
- Per-grantee scoped view (Phase 2)
- Email delivery option

Out of scope:

- Direct funder API integration (CDFA portal, etc.)
- Demographic surveys (race/ethnicity collection — privacy-first decision)
- Cohort progress tracking (in-progress workers; Phase 2)

## Success criteria

- Quarterly export for one funder completes < 30s.
- Numbers reconcile with `/admin/v1/kpi/summary.training.completedCount`.
- Per-org scoping (Phase 2) returns only that org's program data.

## Dependencies

- [02-placement-report](../02-placement-report/) — sister report; same patterns
- [00-foundation/08-certificate-generation](../../00-foundation/08-certificate-generation/) — cert IDs in export
- All training / enrollment / worker tables
