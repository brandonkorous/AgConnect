// Shared date-range presets for KPI + reports. All ranges are inclusive of
// `start`, exclusive of `end`, in UTC (admin chrome doesn't span time zones).

export type RangePreset = 'this_week' | 'this_month' | 'this_quarter' | 'last_30d' | 'last_90d';

export function resolveRange(preset: RangePreset | string | undefined, today = new Date()):
  | { preset: RangePreset; start: string; end: string }
  | { preset: 'custom'; start: string | undefined; end: string | undefined } {
  const p = (preset ?? 'this_quarter') as RangePreset | 'custom';
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  if (p === 'this_week') {
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - today.getUTCDay());
    start.setUTCHours(0, 0, 0, 0);
    return { preset: 'this_week', start: fmt(start), end: fmt(today) };
  }
  if (p === 'this_month') {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    return { preset: 'this_month', start: fmt(start), end: fmt(today) };
  }
  if (p === 'last_30d') {
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - 30);
    return { preset: 'last_30d', start: fmt(start), end: fmt(today) };
  }
  if (p === 'last_90d') {
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - 90);
    return { preset: 'last_90d', start: fmt(start), end: fmt(today) };
  }
  if (p === 'this_quarter') {
    const q = Math.floor(today.getUTCMonth() / 3);
    const start = new Date(Date.UTC(today.getUTCFullYear(), q * 3, 1));
    return { preset: 'this_quarter', start: fmt(start), end: fmt(today) };
  }
  return { preset: 'custom', start: undefined, end: undefined };
}

export const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;
export type County = (typeof COUNTIES)[number];
