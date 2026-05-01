'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faPlus, faRotate } from '@fortawesome/free-solid-svg-icons';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';
import { Modal } from '@/components/employer/primitives/Modal';
import { DownloadButton } from '@/components/employer/primitives/DownloadButton';

type Props = {
  periodId: string;
  status: 'draft' | 'approved' | 'paid';
};

export function PayrollActions({ periodId, status }: Props) {
  const t = useTranslations('employer.payroll');
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState<'none' | 'gen' | 'approve' | 'new'>('none');
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  async function api<T>(path: string, body?: unknown) {
    const client = getApiClient(locale === 'es' ? 'es' : 'en');
    return client.post<T>(path, body, { handleErrorInline: true });
  }

  async function generate() {
    setBusy('gen');
    setError(null);
    try {
      const res = await api(`/v1/employer/payroll/periods/${periodId}/generate-lines`);
      if (!isOk(res)) {
        setError(res.error.message || t('error_generate'));
        return;
      }
      router.refresh();
    } finally {
      setBusy('none');
    }
  }

  async function approve() {
    setBusy('approve');
    setError(null);
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.patch(`/v1/employer/payroll/periods/${periodId}`, {
        status: 'approved',
      }, { handleErrorInline: true });
      if (!isOk(res)) {
        setError(res.error.message || t('error_approve'));
        return;
      }
      router.refresh();
    } finally {
      setBusy('none');
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'draft' && (
        <button
          type="button"
          onClick={generate}
          disabled={busy !== 'none'}
          className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
        >
          <FontAwesomeIcon icon={faRotate} className="h-3 w-3" />
          {busy === 'gen' ? '…' : t('generate_from_shifts')}
        </button>
      )}
      <button
        type="button"
        onClick={() => setNewOpen(true)}
        className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
        {t('new_period')}
      </button>
      <DownloadButton
        path={`/v1/employer/payroll/periods/${periodId}/lines.csv`}
        label={t('export_forms')}
        icon={faDownload}
        filename={`agconn-payroll-${periodId}.csv`}
        variant="pill"
      />
      {status === 'draft' && (
        <button
          type="button"
          onClick={approve}
          disabled={busy !== 'none'}
          className="btn btn-sm btn-primary rounded-full"
        >
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
          {busy === 'approve' ? '…' : t('approve')}
        </button>
      )}
      {status === 'approved' && (
        <span className="bg-success/15 text-success rounded-full px-3 py-1.5 font-mono text-xs font-bold">
          {t('status_approved')}
        </span>
      )}
      {status === 'paid' && (
        <span className="bg-info/15 text-info rounded-full px-3 py-1.5 font-mono text-xs font-bold">
          {t('status_paid')}
        </span>
      )}

      {error && <div className="alert alert-error mt-2 w-full text-xs">{error}</div>}

      {newOpen && <NewPeriodModal onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function NewPeriodModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('employer.payroll.new_period_modal');
  const locale = useLocale();
  const router = useRouter();
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
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // default to next week Mon–Sun, pay date the following Friday
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
