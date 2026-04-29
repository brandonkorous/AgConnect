# 03 — Training Report: Acceptance Criteria

## Functional

- [ ] Per-enrollment view returns one row per enrollment in the date range.
- [ ] By-program / by-funder / by-org views return correct aggregations.
- [ ] Date basis (enrollment date vs completion date) selectable; results differ accordingly.
- [ ] Numbers reconcile with `/admin/v1/kpi/summary.training.completedCount` for the completion-date view.
- [ ] Cert counts equal completed enrollments where `cert_url IS NOT NULL`.
- [ ] No-show flag preserved in row-level view.
- [ ] Filters (funder, org, county) all combine correctly.
- [ ] Email delivery option works.
- [ ] `report_runs` row written.

## Non-functional

- [ ] 10k-row export < 30s.
- [ ] By-funder aggregate completes < 5s for a year of data.

## Compliance

- [ ] Same PII redaction defaults as placement-report (no names by default; no SSN ever).
- [ ] Funder field consistent across reports (CDFA/F3/etc. — no typos).

## Test scenarios

### Unit

1. View selector: `rows` query produces enrollment rows; `by_funder` produces grouped rows.
2. No-show only counts where `no_show = true`.

### Integration

1. **Numbers reconcile:** sum of "Completed" across `by_program` rows = total `Completed` in `by_funder`.
2. **Per-org isolation (Phase 2):** scoped admin sees only their org's programs.

### Manual

1. Generate a CDFA-only export for last quarter; show to a CDFA contact.

## Definition of done

- All views tested.
- Field labels documented in `WIOA_FIELDS.md` or a sibling `CDFA_FIELDS.md` once partner contact validates.
- Sentry logging.
- Admin runbook: how to debug a discrepancy with KPI tile.
