'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import type { Paystub } from '@/lib/api/hooks/pay';
import { buildPaystubsCsv, downloadBlob } from '@/lib/export/client-download';

const COLS = '1.4fr 1.2fr 0.7fr 0.9fr 0.9fr 0.8fr';

type Props = { rows: Paystub[]; locale: string };

export function PaystubsTable({ rows, locale }: Props) {
    const t = useTranslations('worker.pay.table');
    const heads = ['period', 'employer', 'hours', 'gross', 'net', 'status'] as const;

    const employers = useMemo(() => {
        const set = new Set<string>();
        for (const r of rows) set.add(r.employer);
        return Array.from(set);
    }, [rows]);

    const [employer, setEmployer] = useState<string>('all');
    const [open, setOpen] = useState(false);

    const visible = employer === 'all' ? rows : rows.filter((r) => r.employer === employer);

    if (rows.length === 0) {
        return (
            <div className="border-base-300 bg-base-100 grid place-items-center rounded-2xl border p-8 text-center">
                <p className="text-base-content/70 text-[13.5px]">
                    {locale === 'es'
                        ? 'Aún no tienes talones aprobados.'
                        : "You don't have any approved paystubs yet."}
                </p>
            </div>
        );
    }

    return (
        <div className="border-base-300 bg-base-100 overflow-hidden rounded-2xl border">
            <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
                <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
                <div className="relative flex gap-2">
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold"
                    >
                        {employer === 'all' ? t('all_employers') : employer}
                        <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5" />
                    </button>
                    {open && (
                        <div className="border-base-300 bg-base-100 absolute right-[120px] top-9 z-10 grid min-w-[200px] gap-1 rounded-xl border p-2 shadow-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setEmployer('all');
                                    setOpen(false);
                                }}
                                className="hover:bg-base-200 rounded-lg px-3 py-2 text-left text-[13px]"
                            >
                                {t('all_employers')}
                            </button>
                            {employers.map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => {
                                        setEmployer(e);
                                        setOpen(false);
                                    }}
                                    className="hover:bg-base-200 rounded-lg px-3 py-2 text-left text-[13px]"
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => downloadBlob('agconn-paystubs.csv', buildPaystubsCsv(rows), 'text/csv;charset=utf-8')}
                        className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold"
                    >
                        <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
                        {t('export_csv')}
                    </button>
                </div>
            </div>

            <div
                className="border-base-300 text-base-content/60 grid gap-4 border-b px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em]"
                style={{ gridTemplateColumns: COLS }}
            >
                {heads.map((h) => (
                    <span key={h}>{t(`head.${h}`)}</span>
                ))}
            </div>

            {visible.map((w, i) => (
                <div
                    key={w.id}
                    className={[
                        'grid items-center gap-4 px-5 py-3.5 text-[13px]',
                        i < visible.length - 1 ? 'border-base-300 border-b' : '',
                    ].join(' ')}
                    style={{ gridTemplateColumns: COLS }}
                >
                    <div className="font-semibold">{w.period}</div>
                    <div className="text-base-content/80">{w.employer}</div>
                    <div className="font-mono">
                        {(w.hours + w.overtimeHours).toFixed(1)}
                    </div>
                    <div className="font-serif text-[16px] tracking-[-0.02em]">
                        ${(w.grossCents / 100).toFixed(2)}
                    </div>
                    <div className="font-serif text-primary text-[16px] tracking-[-0.02em]">
                        ${(w.netCents / 100).toFixed(2)}
                    </div>
                    <div>
                        <Pill tone={w.status === 'paid' ? 'success' : 'warning'}>
                            {t(`status.${w.status === 'paid' ? 'paid' : 'pending'}`)}
                        </Pill>
                    </div>
                </div>
            ))}
        </div>
    );
}
