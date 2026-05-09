'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';

type Line = {
  id: string;
  workerUserId: string;
  workerName: string;
  workerInitials: string;
  role: string;
  hours: number;
  overtimeHours: number;
  grossCents: number;
  bonusCents: number;
  netCents: number;
};

type Props = {
  periodId: string;
  line: Line;
  border: boolean;
  locked: boolean;
  approved: boolean;
};

export function PayrollLineRow({ periodId, line, border, locked, approved }: Props) {
  const t = useTranslations('employer.payroll');
  const tEdit = useTranslations('employer.payroll.edit_line');
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticApproved, setOptimisticApproved] = useState(approved);

  const fmtCents = (c: number, withSign = false) => {
    const n = c / 100;
    const s = n.toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${withSign && c < 0 ? '−' : ''}$${s}`;
  };

  async function approveLine() {
    if (locked || optimisticApproved) return;
    setBusy(true);
    setError(null);
    setOptimisticApproved(true);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.patch(
        `/v1/employer/payroll/periods/${periodId}/lines/${line.id}`,
        { approved: true },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setOptimisticApproved(false);
        setError(res.error.message || tEdit('error_approve'));
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const hours = Number(f.get('hours') ?? 0);
    const overtimeHours = Number(f.get('overtimeHours') ?? 0);
    const bonusDollars = Number(f.get('bonus') ?? 0);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.patch(
        `/v1/employer/payroll/periods/${periodId}/lines/${line.id}`,
        {
          hours,
          overtimeHours,
          bonusCents: Math.round(bonusDollars * 100),
        },
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        setError(res.error.message || tEdit('error_save'));
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={[
        'grid grid-cols-[2fr_1.4fr_0.8fr_0.7fr_1fr_0.9fr_1fr_100px] items-center gap-3 px-5 py-3 text-sm',
        border ? 'border-base-300 border-b' : '',
        optimisticApproved ? 'bg-success/5' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <div className="bg-primary text-primary-content grid h-7 w-7 place-items-center rounded-full font-mono text-[10px] font-bold">
          {line.workerInitials}
        </div>
        <span className="font-semibold">{line.workerName}</span>
      </div>
      <span className="text-base-content/70">{line.role}</span>
      <span className="font-mono font-semibold">{line.hours}h</span>
      <span
        className={[
          'font-mono font-semibold',
          line.overtimeHours > 0 ? 'text-accent' : 'text-base-content/50',
        ].join(' ')}
      >
        {line.overtimeHours}h
      </span>
      <span className="font-mono">{fmtCents(line.grossCents)}</span>
      <span
        className={[
          'font-mono',
          line.bonusCents > 0 ? 'text-primary font-bold' : 'text-base-content/50',
        ].join(' ')}
      >
        {line.bonusCents > 0 ? `+${fmtCents(line.bonusCents)}` : '—'}
      </span>
      <span className="font-mono font-bold">{fmtCents(line.netCents)}</span>
      <div className="flex justify-end gap-1.5">
        <Link
          href={`/${locale}/employer/payroll/${periodId}/wage-statement/${line.id}`}
          aria-label={t('table.wage_statement')}
          title={t('table.wage_statement')}
          className="border-base-300 hover:bg-base-200 inline-flex items-center justify-center rounded-md border bg-transparent px-2 py-1 text-[11px] font-medium"
        >
          <FontAwesomeIcon icon={faFileLines} className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={busy || locked}
          className="border-base-300 hover:bg-base-200 rounded-md border bg-transparent px-2 py-1 text-[11px] font-medium disabled:opacity-50"
        >
          {t('table.edit')}
        </button>
        <button
          type="button"
          onClick={approveLine}
          disabled={busy || locked || optimisticApproved}
          aria-label={t('table.approve')}
          title={optimisticApproved ? tEdit('approved_label') : t('table.approve')}
          className={[
            'rounded-md px-2.5 py-1 text-[11px] font-bold disabled:opacity-50',
            optimisticApproved
              ? 'bg-success text-success-content'
              : 'bg-primary text-primary-content hover:bg-primary/90',
          ].join(' ')}
        >
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
        </button>
      </div>

      {editing && (
        <Modal
          title={tEdit('title', { name: line.workerName })}
          onClose={() => setEditing(false)}
          size="sm"
        >
          <form onSubmit={submitEdit}>
            {error && <div className="alert alert-error mb-3 text-xs">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">{tEdit('hours_label')}</legend>
                <input
                  name="hours"
                  type="number"
                  step="0.25"
                  min="0"
                  max="200"
                  defaultValue={line.hours}
                  required
                  className="input w-full"
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">{tEdit('overtime_label')}</legend>
                <input
                  name="overtimeHours"
                  type="number"
                  step="0.25"
                  min="0"
                  max="80"
                  defaultValue={line.overtimeHours}
                  required
                  className="input w-full"
                />
              </fieldset>
            </div>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{tEdit('bonus_label')}</legend>
              <input
                name="bonus"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(line.bonusCents / 100).toFixed(2)}
                className="input w-full"
              />
              <p className="label">{tEdit('bonus_help')}</p>
            </fieldset>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn btn-ghost btn-sm"
              >
                {tEdit('cancel')}
              </button>
              <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                {busy ? '…' : tEdit('save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
