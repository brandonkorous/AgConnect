# 06 · Crews & Shifts — Edge cases

## Shift series

### Range cap

A series spans at most **90 days** (`range_end - range_start <= 90`), enforced by
`CreateShiftSeriesBody` in `@agconn/schemas` and re-checked server-side. A 90-day
span with all 7 weekdays selected yields at most 91 dated shifts — that is the
natural ceiling, so there is no separate shift-count cap. A range that exceeds 90
days is rejected with `series_range_too_long`; the create page surfaces it before
submit via the live count preview.

### Zero matching dates

A weekday mask can be valid (at least one `true`) yet match no date inside a short
range — e.g. a Tuesday-only mask over a Monday-to-Monday range. The API rejects
this with `series_no_matching_dates`. An empty mask is a separate, earlier
failure: `no_weekdays_selected`.

### One-shift series

When a range resolves to exactly **one** date, the create page calls
`POST /v1/employer/shifts` instead of the series endpoint — the result is a plain
one-off shift with `series_id = NULL`. A `shift_series` row is only created for two
or more shifts, so series-management surfaces never have to handle a one-row
series.

### DST / weekday math

`weekday_mask` is Monday-indexed (index 0 = Monday). Date expansion iterates in
UTC, so it is unaffected by US daylight-saving transitions. The client preview
(`seriesDates`) and the server (`expandSeriesDates`) run the same algorithm and
must stay in agreement; the client count is display-only and never trusted for the
write.

## Series lifecycle (Phase 2)

These rules are specified now so Phase 2 does not drift; they are **not** enforced
in Phase 1.

- **Bulk / range edits and series deletion skip protected shifts.** A shift that is
  `in_progress` or `completed`, or that has logged hours, pieces, or assignments,
  is never modified or cancelled by a series-level operation — those rows carry
  payroll and H-2A compliance data. Range operations touch future `scheduled`
  shifts only.
- **Series delete** cancels future `scheduled` shifts and leaves completed ones
  intact. `shifts.series_id` is `ON DELETE SET NULL`, so a shift outlives its
  series.
- **No per-shift exception tracking.** Series edits are explicit bulk-apply
  actions, not a live template. A range-scoped edit overwrites every targeted
  future `scheduled` shift, including any that were hand-edited; the employer
  chooses the scope each time.
