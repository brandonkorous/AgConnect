'use client';

import { useState, useTransition } from 'react';
import { setFlag } from './actions';

type Tenant = { id: string; slug: string; name: string };

export function AddTenantOverride({
  flagKey,
  tenants,
  excludeTenantIds,
}: {
  flagKey: string;
  tenants: Tenant[];
  excludeTenantIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const available = tenants.filter((t) => !excludeTenantIds.includes(t.id));
  if (available.length === 0) return null;

  function submit() {
    if (!tenantId) return;
    setError(null);
    startTransition(async () => {
      const res = await setFlag({ key: flagKey, tenantId, enabled, notes: notes || null });
      if (!res.ok) setError(res.error.message);
      else {
        setOpen(false);
        setTenantId('');
        setNotes('');
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-xs">
        + override for tenant
      </button>
    );
  }

  return (
    <div className="bg-base-200 rounded-box flex flex-wrap items-center gap-2 p-2">
      <select
        className="select select-xs"
        value={tenantId}
        onChange={(e) => setTenantId(e.target.value)}
      >
        <option value="">Pick tenant…</option>
        {available.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <label className="text-xs flex items-center gap-1">
        <input
          type="checkbox"
          className={`toggle toggle-xs ${enabled ? 'toggle-success' : ''}`}
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        enabled
      </label>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="notes (optional)"
        className="input input-xs w-40"
      />
      <button type="button" onClick={submit} disabled={isPending || !tenantId} className="btn btn-primary btn-xs">
        Save
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-xs">
        Cancel
      </button>
      {error && <span className="text-error text-[11px]">{error}</span>}
    </div>
  );
}
