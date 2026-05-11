'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const PRESETS = ['1h', '24h', '7d', '30d'] as const;

function presetToFromIso(preset: (typeof PRESETS)[number] | string): string | undefined {
  const now = Date.now();
  const map: Record<string, number> = {
    '1h': 3600_000,
    '24h': 86_400_000,
    '7d': 604_800_000,
    '30d': 2_592_000_000,
  };
  const ms = map[preset];
  return ms ? new Date(now - ms).toISOString() : undefined;
}

export function AuditFilters() {
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

  const outcome = params.get('outcome') ?? '';
  const action = params.get('action') ?? '';
  const actorId = params.get('actorId') ?? '';
  const correlationId = params.get('correlationId') ?? '';
  const datePreset = params.get('preset') ?? '7d';

  return (
    <div className="bg-base-100 border-base-300 sticky top-0 z-10 mb-4 flex flex-wrap items-end gap-3 rounded-box border px-4 py-3">
      <fieldset className="fieldset min-w-32">
        <legend className="fieldset-legend">Action</legend>
        <input
          type="text"
          className="input input-sm"
          defaultValue={action}
          onBlur={(e) => set({ action: e.currentTarget.value })}
          placeholder="auth.login"
        />
      </fieldset>
      <fieldset className="fieldset min-w-32">
        <legend className="fieldset-legend">Actor</legend>
        <input
          type="text"
          className="input input-sm"
          defaultValue={actorId}
          onBlur={(e) => set({ actorId: e.currentTarget.value })}
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Outcome</legend>
        <select
          className="select select-sm"
          value={outcome}
          onChange={(e) => set({ outcome: e.currentTarget.value })}
        >
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Date range</legend>
        <select
          className="select select-sm"
          value={datePreset}
          onChange={(e) => {
            const preset = e.currentTarget.value;
            set({ preset, from: presetToFromIso(preset), to: undefined });
          }}
        >
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="custom">Custom</option>
        </select>
      </fieldset>
      <fieldset className="fieldset min-w-56">
        <legend className="fieldset-legend">Correlation ID</legend>
        <input
          type="text"
          className="input input-sm font-mono"
          defaultValue={correlationId}
          onBlur={(e) => set({ correlationId: e.currentTarget.value })}
          placeholder="00000000-0000-0000-0000-000000000000"
        />
      </fieldset>
      <button
        type="button"
        className="btn btn-sm btn-ghost ml-auto"
        onClick={() => start(() => router.replace('?'))}
      >
        Reset filters
      </button>
      {pending && <span className="loading loading-spinner loading-sm" aria-hidden />}
    </div>
  );
}
