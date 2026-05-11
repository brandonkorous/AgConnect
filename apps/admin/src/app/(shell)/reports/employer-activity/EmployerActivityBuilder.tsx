'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;
const LICENSES = ['grower', 'flc', 'labor_contractor'] as const;

const VIEWS = [
  { value: 'rows', label: 'Per employer' },
  { value: 'by_county', label: 'By county' },
  { value: 'by_license_type', label: 'By license type' },
] as const;

type Defaults = {
  view: 'rows' | 'by_county' | 'by_license_type';
  start: string;
  end: string;
  counties: string[];
  licenseTypes: string[];
  format: 'csv' | 'xlsx';
};

export function EmployerActivityBuilder({ defaults }: { defaults: Defaults }) {
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

  const toggle = (key: 'counties' | 'licenseTypes', value: string) => {
    const current = key === 'counties' ? defaults.counties : defaults.licenseTypes;
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
    sp.set('format', defaults.format);
    for (const c of defaults.counties) sp.append('counties', c);
    for (const lt of defaults.licenseTypes) sp.append('licenseTypes', lt);
    return `/api/reports/employer/export?${sp.toString()}`;
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

      <div className="grid gap-4 md:grid-cols-3">
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
        <legend className="fieldset-legend">Counties</legend>
        <div className="flex flex-wrap gap-2">
          {COUNTIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle('counties', c)}
              className={`badge badge-lg ${
                defaults.counties.includes(c) ? 'badge-primary' : 'badge-ghost'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">License types</legend>
        <div className="flex flex-wrap gap-2">
          {LICENSES.map((lt) => (
            <button
              key={lt}
              type="button"
              onClick={() => toggle('licenseTypes', lt)}
              className={`badge badge-lg ${
                defaults.licenseTypes.includes(lt) ? 'badge-primary' : 'badge-ghost'
              }`}
            >
              {lt}
            </button>
          ))}
        </div>
      </fieldset>

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
