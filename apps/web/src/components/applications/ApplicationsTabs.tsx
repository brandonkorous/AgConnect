'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StatusBadge, type AppStatus } from './StatusBadge';

export type ApplicationRow = {
  id: string;
  jobTitle: string;
  employer: string;
  appliedAt: string;
  status: AppStatus;
  jobSlug: string;
};

type Props = { locale: string; rows: ApplicationRow[] };

type Tab = 'active' | 'hired' | 'closed';

const ACTIVE_STATUSES: AppStatus[] = ['applied', 'reviewed'];
const CLOSED_STATUSES: AppStatus[] = ['rejected', 'withdrawn'];

export function ApplicationsTabs({ locale, rows }: Props) {
  const t = useTranslations('worker.applications');
  const [tab, setTab] = useState<Tab>('active');

  const filtered = rows.filter((r) => {
    if (tab === 'active') return ACTIVE_STATUSES.includes(r.status);
    if (tab === 'hired') return r.status === 'hired';
    return CLOSED_STATUSES.includes(r.status);
  });

  const counts = {
    active: rows.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
    hired: rows.filter((r) => r.status === 'hired').length,
    closed: rows.filter((r) => CLOSED_STATUSES.includes(r.status)).length,
  };

  return (
    <div className="grid gap-4">
      <div role="tablist" className="tabs tabs-boxed bg-base-100">
        {(['active', 'hired', 'closed'] as Tab[]).map((k) => (
          <button
            type="button"
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`tab ${tab === k ? 'tab-active' : ''}`}
          >
            {t(`tab.${k}`)} ({counts[k]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-8 text-center">
          <p className="text-base-content/80 font-semibold">
            {t(`empty.${tab}`)}
          </p>
          {tab === 'active' && (
            <Link href={`/${locale}/worker/jobs`} className="btn btn-primary btn-sm justify-self-center">
              {t('empty.active_cta')}
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="border-base-300 bg-base-100 hover:border-primary/40 grid gap-2 rounded-2xl border p-4"
            >
              <Link
                href={`/${locale}/worker/applications/${row.id}`}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{row.jobTitle}</div>
                  <div className="text-base-content/70 text-sm">{row.employer}</div>
                  <div className="text-base-content/60 mt-1 text-xs font-mono">
                    {t('card.applied_at', { date: row.appliedAt })}
                  </div>
                </div>
                <StatusBadge status={row.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
