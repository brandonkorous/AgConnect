'use client';

import { useState, useTransition } from 'react';
import { setFlag, removeFlagOverride } from './actions';

type Props = {
  flagKey: string;
  tenantId: string | null;
  rowId?: string | null;
  enabled: boolean;
  notes?: string | null;
  variant?: 'platform' | 'override';
};

// Inline toggle with optional notes. Used for both the platform-default row
// and per-tenant override rows. Saves on toggle; notes save on blur.
export function FlagToggle({ flagKey, tenantId, rowId, enabled, notes, variant = 'platform' }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localNotes, setLocalNotes] = useState(notes ?? '');
  const [error, setError] = useState<string | null>(null);

  function commit(nextEnabled: boolean, nextNotes: string) {
    setError(null);
    startTransition(async () => {
      const res = await setFlag({
        key: flagKey,
        tenantId,
        enabled: nextEnabled,
        notes: nextNotes || null,
      });
      if (!res.ok) {
        setError(res.error.message);
        setLocalEnabled(enabled);
      }
    });
  }

  function onToggle(next: boolean) {
    setLocalEnabled(next);
    commit(next, localNotes);
  }

  function onNotesBlur() {
    if ((localNotes || '') === (notes ?? '')) return;
    commit(localEnabled, localNotes);
  }

  function onRemove() {
    if (!rowId) return;
    startTransition(async () => {
      const res = await removeFlagOverride(rowId);
      if (!res.ok) setError(res.error.message);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className={`toggle toggle-sm ${localEnabled ? 'toggle-success' : ''}`}
        checked={localEnabled}
        disabled={isPending}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`${flagKey} ${tenantId ? 'tenant override' : 'platform default'}`}
      />
      <input
        type="text"
        defaultValue={notes ?? ''}
        onChange={(e) => setLocalNotes(e.target.value)}
        onBlur={onNotesBlur}
        placeholder="notes"
        className="input input-xs w-32"
      />
      {variant === 'override' && rowId && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isPending}
          className="btn btn-ghost btn-xs"
          aria-label="Remove override"
        >
          Remove
        </button>
      )}
      {error && <span className="text-error text-[11px]">{error}</span>}
    </div>
  );
}
