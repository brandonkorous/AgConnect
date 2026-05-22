// Expand a shift series' date range + weekday mask into the list of ISO date
// strings it materializes. `weekdayMask` is Monday-indexed: index 0 = Monday,
// 6 = Sunday. Iteration is in UTC, so it is unaffected by DST transitions.
// The caller enforces the span cap (90 days) via the Zod schema and rejects an
// empty result; this helper assumes a sane, already-validated range.
export function expandSeriesDates(
  rangeStart: string,
  rangeEnd: string,
  weekdayMask: boolean[],
): string[] {
  const end = new Date(`${rangeEnd}T00:00:00.000Z`).getTime();
  const out: string[] = [];
  for (
    const d = new Date(`${rangeStart}T00:00:00.000Z`);
    d.getTime() <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    // getUTCDay: 0=Sun..6=Sat -> Monday-indexed 0=Mon..6=Sun
    const mondayIdx = (d.getUTCDay() + 6) % 7;
    if (weekdayMask[mondayIdx]) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
