import type { ShiftDraft } from '../edit-shift/types';

// The create page works in date-range terms: the draft carries a start date,
// an end date, and a 7-element weekday mask (index 0 = Monday). `shiftDate` is
// inherited from ShiftDraft and kept in sync with `rangeStart` so the shared
// preview rail and footer keep working unchanged.
export type NewShiftDraft = ShiftDraft & {
  rangeStart: string;
  rangeEnd: string;
  weekdayMask: boolean[];
};

// Weekday index for an ISO date, Monday-first (0 = Monday .. 6 = Sunday).
export function mondayIndexOf(iso: string): number {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return (d.getUTCDay() + 6) % 7;
}

// Resolve a range + weekday mask into the ISO date strings it materializes.
// Mirrors the server's expandSeriesDates — display-only, never trusted for the
// write. Iterates in UTC so it is unaffected by DST.
export function seriesDates(
  rangeStart: string,
  rangeEnd: string,
  weekdayMask: boolean[],
): string[] {
  if (!rangeStart || !rangeEnd || rangeEnd < rangeStart) return [];
  const end = new Date(`${rangeEnd}T00:00:00.000Z`).getTime();
  const out: string[] = [];
  for (
    const d = new Date(`${rangeStart}T00:00:00.000Z`);
    d.getTime() <= end;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const mondayIdx = (d.getUTCDay() + 6) % 7;
    if (weekdayMask[mondayIdx]) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function countSeriesDates(
  rangeStart: string,
  rangeEnd: string,
  weekdayMask: boolean[],
): number {
  return seriesDates(rangeStart, rangeEnd, weekdayMask).length;
}

// Inclusive day span between two ISO dates (0 when start === end).
export function daySpanDays(rangeStart: string, rangeEnd: string): number {
  if (!rangeStart || !rangeEnd) return 0;
  const start = Date.parse(`${rangeStart}T00:00:00Z`);
  const end = Date.parse(`${rangeEnd}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}
