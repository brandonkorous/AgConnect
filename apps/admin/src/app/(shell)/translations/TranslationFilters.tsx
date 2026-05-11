'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { NamespaceSummary } from '@/lib/translations-api';

type Props = {
  namespaces: NamespaceSummary[];
};

export function TranslationFilters({ namespaces }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete('cursor');
    start(() => router.replace(`?${sp.toString()}`));
  };

  const namespace = params.get('namespace') ?? '';
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const missingOnly = params.get('missingOnly') === 'true';

  return (
    <div className="bg-base-100 border-base-300 sticky top-[var(--admin-topbar-h,57px)] z-[5] mb-4 flex flex-wrap items-end gap-3 rounded-box border px-4 py-3">
      <fieldset className="fieldset min-w-56">
        <legend className="fieldset-legend">Namespace</legend>
        <select
          className="select select-sm"
          value={namespace}
          onChange={(e) => set({ namespace: e.currentTarget.value || undefined })}
        >
          <option value="">All namespaces</option>
          {namespaces.map((n) => (
            <option key={n.namespace} value={n.namespace}>
              {n.namespace} ({n.pairs})
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset className="fieldset min-w-56">
        <legend className="fieldset-legend">Search</legend>
        <input
          type="text"
          className="input input-sm"
          defaultValue={search}
          onBlur={(e) => set({ search: e.currentTarget.value || undefined })}
          placeholder="key or value substring"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Status</legend>
        <select
          className="select select-sm"
          value={status}
          onChange={(e) => set({ status: e.currentTarget.value || undefined })}
        >
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="reviewed">Reviewed</option>
          <option value="needs_review">Needs review</option>
          <option value="draft">Draft</option>
        </select>
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Pair completeness</legend>
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={missingOnly}
            onChange={(e) => set({ missingOnly: e.currentTarget.checked ? 'true' : undefined })}
          />
          <span className="text-sm">Show only pairs missing EN or ES</span>
        </label>
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
