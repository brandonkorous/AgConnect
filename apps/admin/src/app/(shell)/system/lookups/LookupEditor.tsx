'use client';

import { useState, useTransition } from 'react';
import { createRow, updateRow, deleteRow } from './actions';
import type { LookupRow, LookupTable } from '@/lib/system-api';

type Props = {
  table: LookupTable;
  rows: LookupRow[];
};

// Inline editable table. Existing rows: edit labels/sortOrder/active in place,
// save on blur. New row: footer form. Delete requires super_admin server-side.
export function LookupEditor({ table, rows }: Props) {
  const showGlyph = table === 'crops';
  const showCategory = table === 'skill-tags';

  return (
    <div className="bg-base-100 border-base-300 overflow-hidden rounded-box border">
      <table className="table">
        <thead className="bg-base-200">
          <tr>
            <th>Slug</th>
            {showCategory && <th>Category</th>}
            <th>Label EN</th>
            <th>Label ES</th>
            {showGlyph && <th>Glyph key</th>}
            <th className="text-right">Sort</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={r.id} table={table} row={r} showGlyph={showGlyph} showCategory={showCategory} />
          ))}
          <NewRow table={table} showGlyph={showGlyph} showCategory={showCategory} />
        </tbody>
      </table>
    </div>
  );
}

function Row({
  table,
  row,
  showGlyph,
  showCategory,
}: {
  table: LookupTable;
  row: LookupRow;
  showGlyph: boolean;
  showCategory: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function patch(field: string, value: unknown) {
    setError(null);
    startTransition(async () => {
      const res = await updateRow(table, row.id, { [field]: value });
      if (!res.ok) setError(res.error.message);
    });
  }

  function onDelete() {
    if (!confirm(`Delete ${row.slug}? This affects every existing reference.`)) return;
    startTransition(async () => {
      const res = await deleteRow(table, row.id);
      if (!res.ok) setError(res.error.message);
    });
  }

  return (
    <tr>
      <td className="font-mono text-xs">{row.slug}</td>
      {showCategory && (
        <td>
          <input
            defaultValue={row.category ?? 'general'}
            onBlur={(e) => e.target.value !== (row.category ?? 'general') && patch('category', e.target.value)}
            className="input input-xs w-28"
          />
        </td>
      )}
      <td>
        <input
          defaultValue={row.labelEn}
          onBlur={(e) => e.target.value !== row.labelEn && patch('labelEn', e.target.value)}
          className="input input-xs w-full"
        />
      </td>
      <td>
        <input
          defaultValue={row.labelEs}
          onBlur={(e) => e.target.value !== row.labelEs && patch('labelEs', e.target.value)}
          className="input input-xs w-full"
        />
      </td>
      {showGlyph && (
        <td>
          <input
            defaultValue={row.glyphKey ?? ''}
            onBlur={(e) => e.target.value !== (row.glyphKey ?? '') && patch('glyphKey', e.target.value)}
            className="input input-xs w-28"
          />
        </td>
      )}
      <td className="text-right">
        <input
          type="number"
          defaultValue={row.sortOrder}
          onBlur={(e) => Number(e.target.value) !== row.sortOrder && patch('sortOrder', Number(e.target.value))}
          className="input input-xs w-16 text-right"
        />
      </td>
      <td>
        <input
          type="checkbox"
          className="toggle toggle-xs toggle-success"
          defaultChecked={row.active}
          onChange={(e) => patch('active', e.target.checked)}
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

function NewRow({
  table,
  showGlyph,
  showCategory,
}: {
  table: LookupTable;
  showGlyph: boolean;
  showCategory: boolean;
}) {
  const [slug, setSlug] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [labelEs, setLabelEs] = useState('');
  const [glyphKey, setGlyphKey] = useState('');
  const [category, setCategory] = useState('general');
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!slug || !labelEn || !labelEs) {
      setError('slug, label EN, label ES are required');
      return;
    }
    if (showGlyph && !glyphKey) {
      setError('glyph key required');
      return;
    }
    setError(null);
    startTransition(async () => {
      const body: Record<string, unknown> = { slug, labelEn, labelEs, sortOrder };
      if (showGlyph) body['glyphKey'] = glyphKey;
      if (showCategory) body['category'] = category;
      const res = await createRow(table, body);
      if (!res.ok) setError(res.error.message);
      else {
        setSlug('');
        setLabelEn('');
        setLabelEs('');
        setGlyphKey('');
      }
    });
  }

  return (
    <tr className="bg-base-200/30">
      <td>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="new-slug" className="input input-xs w-28" />
      </td>
      {showCategory && (
        <td>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="input input-xs w-28" />
        </td>
      )}
      <td>
        <input value={labelEn} onChange={(e) => setLabelEn(e.target.value)} placeholder="Label EN" className="input input-xs w-full" />
      </td>
      <td>
        <input value={labelEs} onChange={(e) => setLabelEs(e.target.value)} placeholder="Etiqueta ES" className="input input-xs w-full" />
      </td>
      {showGlyph && (
        <td>
          <input value={glyphKey} onChange={(e) => setGlyphKey(e.target.value)} placeholder="glyph" className="input input-xs w-28" />
        </td>
      )}
      <td className="text-right">
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="input input-xs w-16 text-right" />
      </td>
      <td>—</td>
      <td className="text-right">
        <button type="button" onClick={submit} disabled={isPending} className="btn btn-primary btn-xs">
          Add
        </button>
        {error && <div className="text-error text-[10px]">{error}</div>}
      </td>
    </tr>
  );
}
