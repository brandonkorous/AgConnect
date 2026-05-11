'use client';

import { useState, useTransition } from 'react';
import { createRate, updateRate, deleteRate } from './actions';
import type { AewrRow } from '@/lib/system-api';

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
function dollarsToCents(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function AewrEditor({ rows }: { rows: AewrRow[] }) {
  return (
    <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
      <table className="table">
        <thead className="bg-base-200">
          <tr>
            <th>State</th>
            <th>Effective from</th>
            <th>Effective to</th>
            <th className="text-right">Hourly $</th>
            <th>Source</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.id} row={r} />
          ))}
          <NewRow />
        </tbody>
      </table>
    </div>
  );
}

function Row({ row }: { row: AewrRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function patch(body: { effectiveTo?: string | null; hourlyCents?: number; source?: string | null }) {
    setError(null);
    startTransition(async () => {
      const res = await updateRate(row.id, body);
      if (!res.ok) setError(res.error.message);
    });
  }

  function onDelete() {
    if (!confirm(`Delete AEWR row for ${row.stateCode} ${row.effectiveFrom.slice(0, 10)}?`)) return;
    startTransition(async () => {
      const res = await deleteRate(row.id);
      if (!res.ok) setError(res.error.message);
    });
  }

  return (
    <tr>
      <td className="font-mono text-xs">{row.stateCode}</td>
      <td className="font-mono text-xs">{row.effectiveFrom.slice(0, 10)}</td>
      <td>
        <input
          type="date"
          defaultValue={row.effectiveTo?.slice(0, 10) ?? ''}
          onBlur={(e) => {
            const v = e.target.value || null;
            const current = row.effectiveTo?.slice(0, 10) ?? null;
            if (v !== current) patch({ effectiveTo: v });
          }}
          className="input input-xs"
        />
      </td>
      <td className="text-right">
        <input
          type="number"
          step="0.01"
          defaultValue={centsToDollars(row.hourlyCents)}
          onBlur={(e) => {
            const cents = dollarsToCents(e.target.value);
            if (cents !== row.hourlyCents) patch({ hourlyCents: cents });
          }}
          className="input input-xs w-24 text-right"
        />
      </td>
      <td>
        <input
          defaultValue={row.source ?? ''}
          onBlur={(e) => e.target.value !== (row.source ?? '') && patch({ source: e.target.value || null })}
          className="input input-xs w-full"
        />
      </td>
      <td className="text-right">
        <button type="button" onClick={onDelete} disabled={isPending} className="btn btn-ghost btn-xs">
          Delete
        </button>
        {error && <div className="text-error text-[10px]">{error}</div>}
      </td>
    </tr>
  );
}

function NewRow() {
  const [stateCode, setStateCode] = useState('CA');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [hourly, setHourly] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!effectiveFrom || !hourly) {
      setError('effective_from and hourly required');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createRate({
        stateCode: stateCode.toUpperCase(),
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        hourlyCents: dollarsToCents(hourly),
        source: source || null,
      });
      if (!res.ok) setError(res.error.message);
      else {
        setEffectiveFrom('');
        setEffectiveTo('');
        setHourly('');
        setSource('');
      }
    });
  }

  return (
    <tr className="bg-base-200/30">
      <td>
        <input
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
          className="input input-xs w-12 uppercase"
        />
      </td>
      <td>
        <input
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className="input input-xs"
        />
      </td>
      <td>
        <input
          type="date"
          value={effectiveTo}
          onChange={(e) => setEffectiveTo(e.target.value)}
          className="input input-xs"
        />
      </td>
      <td className="text-right">
        <input
          type="number"
          step="0.01"
          value={hourly}
          onChange={(e) => setHourly(e.target.value)}
          placeholder="19.97"
          className="input input-xs w-24 text-right"
        />
      </td>
      <td>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="USDOL 2026 final rule"
          className="input input-xs w-full"
        />
      </td>
      <td className="text-right">
        <button type="button" onClick={submit} disabled={isPending} className="btn btn-primary btn-xs">
          Add
        </button>
        {error && <div className="text-error text-[10px]">{error}</div>}
      </td>
    </tr>
  );
}
