'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronDown, faPlus, faRotate, faWrench } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { pushToast } from '@agconn/ui';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';
import { DownloadButton } from '@/components/employer/primitives/DownloadButton';

type Props = {
  periodId: string;
  status: 'draft' | 'approved' | 'paid';
  workers?: number;
  netCents?: number;
  timesheetCount?: number;
};

export function PayrollActions({
  periodId,
  status,
  workers = 0,
  netCents = 0,
  timesheetCount = 0,
}: Props) {
  const t = useTranslations('employer.payroll');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<'none' | 'gen' | 'approve' | 'new'>('none');
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  async function generate() {
    setBusy('gen');
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post<{ generated: number }>(
        `/v1/employer/payroll/periods/${periodId}/generate-lines`,
        undefined,
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        const msg = res.error.message || t('error_generate');
        setError(msg);
        pushToast({ variant: 'error', title: msg });
        return;
      }
      const count = res.data.generated;
      if (count === 0) {
        pushToast({ variant: 'info', title: t('generate_empty') });
      } else {
        pushToast({ variant: 'success', title: t('generate_success', { count }) });
      }
      void queryClient.invalidateQueries({ queryKey: ['employer'] });
    } finally {
      setBusy('none');
    }
  }

  async function approve() {
    setBusy('approve');
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post(
        `/v1/employer/payroll/periods/${periodId}/approve`,
        undefined,
        { handleErrorInline: true },
      );
      if (!isOk(res)) {
        const msg = res.error.message || t('error_approve');
        setError(msg);
        pushToast({ variant: 'error', title: msg });
        return;
      }
      pushToast({ variant: 'success', title: t('approve_success') });
      setApproveOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['employer'] });
    } finally {
      setBusy('none');
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setNewOpen(true)}
        className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
        {t('new_period')}
      </button>
      <details className="dropdown dropdown-end">
        <summary
          aria-label={t('tools_label')}
          className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
        >
          <FontAwesomeIcon icon={faWrench} className="h-3 w-3" />
          {t('tools_label')}
          <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5 opacity-60" />
        </summary>
        <ul className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-[1] mt-2 w-60 border p-2 shadow-[var(--shadow-pop)]">
          {status === 'draft' && (
            <li>
              <button
                type="button"
                onClick={generate}
                disabled={busy !== 'none'}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRotate} className="h-3 w-3" />
                {busy === 'gen' ? '…' : t('generate_from_shifts')}
              </button>
            </li>
          )}
          <li>
            <DownloadButton
              path={`/v1/employer/payroll/periods/${periodId}/export?form=941`}
              label={t('export_941')}
              filename={`agconn-941-${periodId}.csv`}
              variant="btn-sm"
            />
          </li>
          <li>
            <DownloadButton
              path={`/v1/employer/payroll/periods/${periodId}/export?form=de9`}
              label={t('export_de9')}
              filename={`agconn-de9-${periodId}.csv`}
              variant="btn-sm"
            />
          </li>
        </ul>
      </details>
      {status === 'draft' && (
        <button
          type="button"
          onClick={() => setApproveOpen(true)}
          disabled={busy !== 'none'}
          className="btn btn-sm btn-primary rounded-full"
        >
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
          {t('approve')}
        </button>
      )}
      {status === 'approved' && timesheetCount > 0 && (
        <span className="bg-success/15 text-success rounded-full px-3 py-1.5 font-mono text-xs font-bold">
          {t('status_approved')}
        </span>
      )}
      {status === 'approved' && timesheetCount === 0 && (
        <span className="bg-base-200 text-base-content/60 rounded-full px-3 py-1.5 font-mono text-xs font-bold">
          {t('status_no_timesheets')}
        </span>
      )}
      {status === 'paid' && (
        <span className="bg-info/15 text-info rounded-full px-3 py-1.5 font-mono text-xs font-bold">
          {t('status_paid')}
        </span>
      )}

      {error && <div className="alert alert-error mt-2 w-full text-xs">{error}</div>}

      {newOpen && <NewPeriodModal onClose={() => setNewOpen(false)} />}
      {approveOpen && (
        <ApproveModal
          onClose={() => setApproveOpen(false)}
          onConfirm={approve}
          busy={busy === 'approve'}
          workers={workers}
          netCents={netCents}
        />
      )}
    </div>
  );
}

function ApproveModal({
  onClose,
  onConfirm,
  busy,
  workers,
  netCents,
}: {
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
  workers: number;
  netCents: number;
}) {
  const t = useTranslations('employer.payroll.approve_modal');
  const locale = useLocale();
  const total = (Math.abs(netCents) / 100).toLocaleString(
    locale === 'es' ? 'es-MX' : 'en-US',
    { style: 'currency', currency: 'USD' },
  );
  return (
    <Modal title={t('title')} onClose={onClose} size="sm">
      <p className="text-base-content/80 text-sm">
        {t('body', { workers, total })}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="btn btn-primary btn-sm"
        >
          {busy ? '…' : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}

function NewPeriodModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('employer.payroll.new_period_modal');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const body = {
      startDate: String(f.get('startDate') ?? ''),
      endDate: String(f.get('endDate') ?? ''),
      payDate: String(f.get('payDate') ?? ''),
    };
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post('/v1/employer/payroll/periods', body, { handleErrorInline: true });
      if (!isOk(res)) {
        setError(res.error.message || t('error'));
        return;
      }
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['employer'] });
    } finally {
      setBusy(false);
    }
  }

  const today = new Date();
  const dow = today.getUTCDay();
  const offset = dow === 0 ? 1 : 8 - dow;
  const nextMon = new Date(today);
  nextMon.setUTCDate(today.getUTCDate() + offset);
  const nextSun = new Date(nextMon);
  nextSun.setUTCDate(nextMon.getUTCDate() + 6);
  const payFri = new Date(nextSun);
  payFri.setUTCDate(nextSun.getUTCDate() + 5);

  return (
    <Modal title={t('title')} onClose={onClose} size="md">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {error && <div className="alert alert-error text-sm">{error}</div>}
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('start_date')}</legend>
          <input
            name="startDate"
            type="date"
            required
            defaultValue={nextMon.toISOString().slice(0, 10)}
            className="input w-full"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('end_date')}</legend>
          <input
            name="endDate"
            type="date"
            required
            defaultValue={nextSun.toISOString().slice(0, 10)}
            className="input w-full"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('pay_date')}</legend>
          <input
            name="payDate"
            type="date"
            required
            defaultValue={payFri.toISOString().slice(0, 10)}
            className="input w-full"
          />
          <p className="label">{t('pay_date_hint')}</p>
        </fieldset>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
            {t('cancel')}
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
            {busy ? '…' : t('confirm')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
