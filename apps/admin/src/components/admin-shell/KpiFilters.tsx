'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { COUNTIES } from '@/lib/date-ranges';

const RANGES = [
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom' },
] as const;

export function KpiFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const setMany = (next: Record<string, string | undefined | string[]>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      sp.delete(k);
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        for (const item of v) if (item) sp.append(k, item);
      } else if (v) {
        sp.set(k, v);
      }
    }
    start(() => router.replace(`?${sp.toString()}`));
  };

  const preset = params.get('preset') ?? 'this_quarter';
  const counties = params.getAll('counties');
  const startDate = params.get('start') ?? '';
  const endDate = params.get('end') ?? '';

  const toggleCounty = (c: string) => {
    const next = counties.includes(c) ? counties.filter((x) => x !== c) : [...counties, c];
    setMany({ counties: next });
  };

  return (
    <div className="bg-base-100 border-base-300 rounded-box flex flex-wrap items-end gap-3 border p-4">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Range</legend>
        <select
          className="select select-sm"
          value={preset}
          onChange={(e) => setMany({ preset: e.currentTarget.value, start: undefined, end: undefined })}
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </fieldset>
      {preset === 'custom' && (
        <>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Start</legend>
            <input
              type="date"
              className="input input-sm"
              defaultValue={startDate}
              onBlur={(e) => setMany({ start: e.currentTarget.value })}
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">End</legend>
            <input
              type="date"
              className="input input-sm"
              defaultValue={endDate}
              onBlur={(e) => setMany({ end: e.currentTarget.value })}
            />
          </fieldset>
        </>
      )}
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Counties</legend>
        <div className="flex flex-wrap gap-1.5">
          {COUNTIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCounty(c)}
              className={`badge badge-sm cursor-pointer ${
                counties.includes(c) ? 'badge-primary' : 'badge-ghost'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>
      {pending && <span className="loading loading-spinner loading-sm" aria-hidden />}
    </div>
  );
}
