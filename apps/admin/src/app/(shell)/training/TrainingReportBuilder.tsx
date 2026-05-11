'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const FUNDERS = ['CDFA', 'F3', 'CalOSBA', 'EDD', 'other'] as const;
const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

const VIEWS = [
  { value: 'rows', label: 'Per enrollment' },
  { value: 'by_program', label: 'By program' },
  { value: 'by_funder', label: 'By funder' },
  { value: 'by_org', label: 'By training org' },
] as const;

type Defaults = {
  view: 'rows' | 'by_program' | 'by_funder' | 'by_org';
  scope: 'enrollments' | 'completions';
  start: string;
  end: string;
  counties: string[];
  funders: string[];
  includeNames: boolean;
  format: 'csv' | 'xlsx';
};

export function TrainingReportBuilder({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (next: Record<string, string | string[] | undefined>) => {
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

  const toggleArray = (key: 'counties' | 'funders', value: string) => {
    const current = key === 'counties' ? defaults.counties : defaults.funders;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    set({ [key]: next });
  };

  const exportHref = () => {
    const sp = new URLSearchParams();
    sp.set('start', defaults.start);
    sp.set('end', defaults.end);
    sp.set('view', defaults.view);
    sp.set('scope', defaults.scope);
    sp.set('format', defaults.format);
    if (defaults.includeNames) sp.set('includeNames', 'true');
    for (const c of defaults.counties) sp.append('counties', c);
    for (const f of defaults.funders) sp.append('funders', f);
    return `/api/reports/training/export?${sp.toString()}`;
  };

  return (
    <div className="bg-base-100 border-base-300 rounded-box space-y-4 border p-5">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">View</legend>
        <div className="flex flex-wrap gap-3">
          {VIEWS.map((v) => (
            <label key={v.value} className="label cursor-pointer gap-2">
              <input
                type="radio"
                name="view"
                className="radio radio-sm"
                checked={defaults.view === v.value}
                onChange={() => set({ view: v.value })}
              />
              <span className="text-sm">{v.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">Start date</legend>
          <input
            type="date"
            className="input"
            defaultValue={defaults.start}
            onBlur={(e) => set({ start: e.currentTarget.value })}
          />
        </fieldset>
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">End date</legend>
          <input
            type="date"
            className="input"
            defaultValue={defaults.end}
            onBlur={(e) => set({ end: e.currentTarget.value })}
          />
        </fieldset>
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">Date basis</legend>
          <select
            className="select"
            value={defaults.scope}
            onChange={(e) => set({ scope: e.currentTarget.value })}
          >
            <option value="enrollments">Enrollment date</option>
            <option value="completions">Completion date</option>
          </select>
        </fieldset>
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">Format</legend>
          <div className="flex gap-3">
            {(['csv', 'xlsx'] as const).map((fmt) => (
              <label key={fmt} className="label cursor-pointer gap-2">
                <input
                  type="radio"
                  name="format"
                  className="radio radio-sm"
                  checked={defaults.format === fmt}
                  onChange={() => set({ format: fmt })}
                />
                <span className="font-mono text-sm uppercase">{fmt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Funders</legend>
        <div className="flex flex-wrap gap-2">
          {FUNDERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleArray('funders', f)}
              className={`badge badge-lg ${
                defaults.funders.includes(f) ? 'badge-primary' : 'badge-ghost'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Counties</legend>
        <div className="flex flex-wrap gap-2">
          {COUNTIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleArray('counties', c)}
              className={`badge badge-lg ${
                defaults.counties.includes(c) ? 'badge-primary' : 'badge-ghost'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      {defaults.view === 'rows' && (
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Include worker names</legend>
          <label className="label cursor-pointer gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={defaults.includeNames}
              onChange={(e) =>
                set({ includeNames: e.currentTarget.checked ? 'true' : undefined })
              }
            />
            <span className="text-sm">
              Off by default. Names appear in CSV / XLSX and in the export audit log.
            </span>
          </label>
        </fieldset>
      )}

      <div className="flex items-center gap-3">
        <a className="btn btn-primary rounded-full" href={exportHref()}>
          Download export
        </a>
        {pending ? (
          <span className="text-base-content/60 text-sm">Updating preview…</span>
        ) : null}
      </div>
    </div>
  );
}
