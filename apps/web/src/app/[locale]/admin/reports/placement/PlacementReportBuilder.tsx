'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

type Defaults = {
  start: string;
  end: string;
  counties: string[];
  funders: string[];
  includeNames: boolean;
  format: 'csv' | 'xlsx';
  email: string;
};

type Copy = {
  start: string;
  end: string;
  counties: string;
  funders: string;
  includeNames: string;
  includeNamesHint: string;
  format: string;
  email: string;
  emailHint: string;
  generate: string;
  generateEmail: string;
};

export function PlacementReportBuilder({
  counties,
  funders,
  defaults,
  copy,
}: {
  counties: string[];
  funders: string[];
  defaults: Defaults;
  copy: Copy;
}) {
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

  const exportHref = () => {
    const sp = new URLSearchParams();
    sp.set('start', defaults.start);
    sp.set('end', defaults.end);
    sp.set('format', defaults.format);
    if (defaults.includeNames) sp.set('includeNames', 'true');
    if (defaults.email) sp.set('email', defaults.email);
    for (const c of defaults.counties) sp.append('counties', c);
    for (const f of defaults.funders) sp.append('funders', f);
    return `/api/admin/reports/placement/export?${sp.toString()}`;
  };

  const toggleArray = (key: 'counties' | 'funders', value: string) => {
    const current = key === 'counties' ? defaults.counties : defaults.funders;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    set({ [key]: next });
  };

  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{copy.start}</legend>
          <input
            type="date"
            className="input"
            defaultValue={defaults.start}
            onBlur={(e) => set({ start: e.currentTarget.value })}
          />
        </fieldset>

        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{copy.end}</legend>
          <input
            type="date"
            className="input"
            defaultValue={defaults.end}
            onBlur={(e) => set({ end: e.currentTarget.value })}
          />
        </fieldset>

        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{copy.format}</legend>
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

        <fieldset className="fieldset w-full min-w-0">
          <legend className="fieldset-legend">{copy.includeNames}</legend>
          <label className="label cursor-pointer gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={defaults.includeNames}
              onChange={(e) => set({ includeNames: e.currentTarget.checked ? 'true' : undefined })}
            />
            <span className="text-sm">{copy.includeNamesHint}</span>
          </label>
        </fieldset>
      </div>

      <fieldset className="fieldset mt-4 w-full min-w-0">
        <legend className="fieldset-legend">{copy.counties}</legend>
        <div className="flex flex-wrap gap-2">
          {counties.map((c) => (
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

      <fieldset className="fieldset mt-4 w-full min-w-0">
        <legend className="fieldset-legend">{copy.funders}</legend>
        <div className="flex flex-wrap gap-2">
          {funders.map((f) => (
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

      <fieldset className="fieldset mt-4 w-full min-w-0">
        <legend className="fieldset-legend">{copy.email}</legend>
        <input
          type="email"
          className="input"
          placeholder="grantee@example.org"
          defaultValue={defaults.email}
          onBlur={(e) => set({ email: e.currentTarget.value || undefined })}
        />
        <p className="label">{copy.emailHint}</p>
      </fieldset>

      <div className="mt-5 flex items-center gap-3">
        <a className="btn btn-primary" href={exportHref()}>
          {defaults.email ? copy.generateEmail : copy.generate}
        </a>
        {pending ? (
          <span className="text-base-content/60 text-sm">Updating preview…</span>
        ) : null}
      </div>
    </div>
  );
}
