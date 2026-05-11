'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTranslation } from './actions';

type Props = {
  scope: 'platform' | 'tenant';
  tenantId: string | null;
  defaultNamespace?: string;
};

export function AddPairRow({ scope, tenantId, defaultNamespace }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [namespace, setNamespace] = useState(defaultNamespace ?? '');
  const [key, setKey] = useState('');
  const [en, setEn] = useState('');
  const [es, setEs] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!namespace.trim() || !key.trim()) {
      setError('Namespace and key are required.');
      return;
    }
    if (!en.trim() && !es.trim()) {
      setError('Enter at least one value (EN or ES).');
      return;
    }
    setSaving(true);
    const result = await createTranslation({
      scope,
      tenantId,
      namespace: namespace.trim(),
      key: key.trim(),
      valueEn: en.trim() || undefined,
      valueEs: es.trim() || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error.message || result.error.code);
      return;
    }
    setNamespace(defaultNamespace ?? '');
    setKey('');
    setEn('');
    setEs('');
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <div className="bg-base-100 border-base-300 rounded-box border p-3">
        <button
          type="button"
          className="btn btn-sm btn-ghost text-base-content/60 hover:text-primary"
          onClick={() => setOpen(true)}
        >
          + Add translation pair
        </button>
      </div>
    );
  }

  return (
    <div className="bg-base-100 border-base-300 rounded-box space-y-3 border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Namespace</legend>
          <input
            type="text"
            className="input input-sm"
            value={namespace}
            onChange={(e) => setNamespace(e.currentTarget.value)}
            placeholder="landing.hero"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Key</legend>
          <input
            type="text"
            className="input input-sm font-mono"
            value={key}
            onChange={(e) => setKey(e.currentTarget.value)}
            placeholder="headline"
          />
        </fieldset>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">EN</legend>
          <textarea
            className="textarea textarea-sm"
            rows={2}
            value={en}
            onChange={(e) => setEn(e.currentTarget.value)}
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">ES</legend>
          <textarea
            className="textarea textarea-sm"
            rows={2}
            value={es}
            onChange={(e) => setEs(e.currentTarget.value)}
          />
        </fieldset>
      </div>
      {error && (
        <div role="alert" className="alert alert-error py-2 text-xs">
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm rounded-full"
          disabled={saving}
          onClick={submit}
        >
          {saving ? 'Saving…' : 'Save pair'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
