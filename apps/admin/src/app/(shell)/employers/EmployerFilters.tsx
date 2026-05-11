'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const LICENSES = [
  { value: '', label: 'Any license' },
  { value: 'grower', label: 'Grower' },
  { value: 'flc', label: 'FLC' },
  { value: 'labor_contractor', label: 'Labor contractor' },
] as const;

const VERIFICATION = [
  { value: '', label: 'Any status' },
  { value: 'pending', label: 'Pending review' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Rejected' },
] as const;

export function EmployerFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') sp.delete(k);
      else sp.set(k, v);
    }
    start(() => router.replace(`?${sp.toString()}`));
  };

  return (
    <div className="bg-base-100 border-base-300 sticky top-0 z-10 mb-4 flex flex-wrap items-end gap-3 rounded-box border px-4 py-3">
      <fieldset className="fieldset min-w-56">
        <legend className="fieldset-legend">Search</legend>
        <input
          type="text"
          className="input input-sm"
          defaultValue={params.get('search') ?? ''}
          onBlur={(e) => set({ search: e.currentTarget.value || undefined })}
          placeholder="name, EIN, license #, email"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">License type</legend>
        <select
          className="select select-sm"
          value={params.get('licenseType') ?? ''}
          onChange={(e) => set({ licenseType: e.currentTarget.value || undefined })}
        >
          {LICENSES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Verification</legend>
        <select
          className="select select-sm"
          value={params.get('verified') ?? ''}
          onChange={(e) => set({ verified: e.currentTarget.value || undefined })}
        >
          {VERIFICATION.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </fieldset>
      <button
        type="button"
        className="btn btn-sm btn-ghost ml-auto"
        onClick={() => start(() => router.replace('?'))}
      >
        Reset
      </button>
      {pending && <span className="loading loading-spinner loading-sm" aria-hidden />}
    </div>
  );
}
