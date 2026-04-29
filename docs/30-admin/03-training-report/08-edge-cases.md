# 03 — Training Report: Edge Cases & Risks

## Date basis confusion

"Enrollments in Q1" can mean enrolled-in-Q1 or completed-in-Q1.

**Mitigation:** explicit `date_basis` selector; preview clearly labels what the date range filters.

## Dropped vs No-Show distinction

`enrollments.status = 'dropped'` covers both worker-quit and admin-marked-no-show. The `no_show` boolean differentiates.

**Mitigation:** report exposes both; aggregations split.

## Multiple training orgs in same tenant

OK. Reports show `org_id` (or org name) per row.

## Phase 2 grantee scope

Training orgs (when they're a separate role) should see only their own programs.

**Mitigation:** parameterize by `current_setting('app.user_id')` for non-admin grantees. Out of scope for MVP code.

## Incomplete cohorts

Program is in-progress (start in past, end in future). Some enrollments still `enrolled`.

**Behavior:** the row-level view shows them as `enrolled`. Aggregate views correctly show "Currently Enrolled" count separately from "Completed".

## Cert-issued lag

A worker completes today but cert generation is queued. They appear in the export but `Certification ID` is blank until cert generates.

**Mitigation:** the `Certification Earned` column shows "Pending" if `completed_at IS NOT NULL` but `cert_url IS NULL`. Phase 2.

> **Inferred:** For MVP, blank certification fields are acceptable. Re-running the report after cert generation completes shows the cert.

## Cross-tenant program duplication

Two tenants run the same program (e.g., partnered with the same training org).

**Behavior:** rows include `tenant_id`; aggregations group by `(tenant, program)` if cross-tenant scope. Distinct rows.

## Funder enum drift

Adding a new funder requires Prisma migration.

**Mitigation:** initial enum covers CDFA, F3, CalOSBA, EDD, other. New funders added via migration; reports automatically pick up.

## Missing `org_id`

Defensive: program with `org_id` referencing a deleted user.

**Mitigation:** LEFT JOIN; show "[Deleted org]" in the row. Out of scope for MVP — orgs aren't deleted in practice.

## Demographics minimization

We deliberately don't collect race / ethnicity / SSN. Some grantees ask for these.

**Position:** AgConn is the platform; demographic surveys belong to the grantee's separate intake process. We provide what we have (county, language).

> **Inferred:** Reaffirming this position is important. Grantees might pressure for more data; we hold the line on minimization.

## Performance

Large training datasets (10k enrollments per year) — acceptable on existing indexes. If per-program aggregation across many programs becomes slow, materialize.

## Open questions

1. Per-org delivery cadence — auto-email quarterly? Phase 2.
2. CDFA-specific format requirements — confirm at action-item meeting (same as placement-report).
3. Multi-session attendance reporting — when do orgs need granular attendance? Out of scope MVP.
4. Demographic optional fields — does any grantee strictly require race/ethnicity? Likely not for CDFA/F3; CalJOBS does collect (separately from us).
