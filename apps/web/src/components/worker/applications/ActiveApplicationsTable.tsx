'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { withdrawApplicationAction } from '@/lib/api/applications-actions';

export type ActiveAppRow = {
    id: string;
    status: 'applied' | 'reviewed' | 'hired';
    jobSlug: string;
    jobTitleEn: string;
    jobTitleEs: string;
    employerName: string;
    startDate: string;
    pay: string;
    appliedOn: string;
    spots: number | null;
    crop: string;
};

const COLS = '1.4fr 1.2fr 0.8fr 0.7fr 0.9fr 0.9fr 0.6fr';

const STAGE_TONE: Record<ActiveAppRow['status'], 'ghost' | 'primary' | 'success'> = {
    applied: 'ghost',
    reviewed: 'primary',
    hired: 'success',
};

function actionFor(status: ActiveAppRow['status']): {
    key: 'confirm' | 'note' | 'withdraw';
    cls: string;
} {
    if (status === 'hired') return { key: 'confirm', cls: 'bg-primary text-primary-content' };
    if (status === 'reviewed')
        return { key: 'note', cls: 'border-base-300 border bg-transparent text-base-content/80' };
    return { key: 'withdraw', cls: 'border-base-300 border bg-transparent text-base-content/80' };
}

type Props = { rows: ActiveAppRow[]; locale: string };

export function ActiveApplicationsTable({ rows, locale }: Props) {
    const t = useTranslations('worker.applications_dense.active');
    const tStage = useTranslations('worker.applications_dense.stage');
    const tAction = useTranslations('worker.applications_dense.action');
    const tEmpty = useTranslations('worker.applications_dense.empty');
    const filters = ['all', 'action', 'review', 'withdrawn'] as const;
    const heads = ['job', 'employer', 'applied', 'rate', 'stage', 'next', 'spacer'] as const;
    const [filter, setFilter] = useState<typeof filters[number]>('all');
    const [, startTransition] = useTransition();
    const router = useRouter();

    const visible = rows.filter((r) => {
        if (filter === 'all') return true;
        if (filter === 'action') return r.status === 'hired' || r.status === 'reviewed';
        if (filter === 'review') return r.status === 'reviewed' || r.status === 'applied';
        return false;
    });

    function handleAction(row: ActiveAppRow) {
        const action = actionFor(row.status);
        if (action.key === 'withdraw') {
            startTransition(async () => {
                await withdrawApplicationAction(row.id);
                router.refresh();
            });
        } else {
            router.push(`/${locale}/worker/applications/${row.id}`);
        }
    }

    return (
        <div className="border-base-300 bg-base-100 mb-6 overflow-hidden rounded-2xl border">
            <div className="border-base-300 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
                <div className="flex flex-wrap gap-1.5">
                    {filters.map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={[
                                'cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-semibold',
                                filter === f
                                    ? 'bg-primary text-primary-content'
                                    : 'bg-base-200 text-base-content/80',
                            ].join(' ')}
                        >
                            {t(`filter.${f}`)}
                        </button>
                    ))}
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="px-5 py-8 text-center">
                    <p className="text-base-content/70 text-[14px]">{tEmpty('none_active')}</p>
                    <Link
                        href={`/${locale}/worker/jobs`}
                        className="btn btn-primary btn-sm mt-3 rounded-full"
                    >
                        {tEmpty('browse_jobs')}
                    </Link>
                </div>
            ) : (
                <>
                    <div
                        className="border-base-300 text-base-content/60 grid gap-4 border-b px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em]"
                        style={{ gridTemplateColumns: COLS }}
                    >
                        {heads.map((h) =>
                            h === 'spacer' ? <span key={h} /> : <span key={h}>{t(`head.${h}`)}</span>,
                        )}
                    </div>

                    {visible.map((a, i) => {
                        const action = actionFor(a.status);
                        const title = locale === 'es' ? a.jobTitleEs : a.jobTitleEn;
                        return (
                            <div
                                key={a.id}
                                className={[
                                    'grid items-center gap-4 px-5 py-4 text-[13px]',
                                    i < visible.length - 1 ? 'border-base-300 border-b' : '',
                                ].join(' ')}
                                style={{ gridTemplateColumns: COLS }}
                            >
                                <Link
                                    href={`/${locale}/worker/applications/${a.id}`}
                                    className="flex items-center gap-3 no-underline"
                                >
                                    <div className="bg-base-200 grid h-9 w-9 shrink-0 place-items-center rounded-[10px]">
                                        <CropGlyph crop={a.crop} size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-base-content truncate font-semibold">{title}</div>
                                        <div className="text-base-content/60 mt-0.5 text-xs">
                                            {t('starts', { date: a.startDate })}
                                            {a.spots !== null && ` · ${t('spots', { n: a.spots })}`}
                                        </div>
                                    </div>
                                </Link>
                                <div className="text-base-content/80 truncate">{a.employerName}</div>
                                <div className="text-base-content/60 font-mono text-[12px]">{a.appliedOn}</div>
                                <div className="font-serif text-[16px] tracking-[-0.02em]">{a.pay}</div>
                                <div>
                                    <Pill tone={STAGE_TONE[a.status]}>{tStage(a.status)}</Pill>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => handleAction(a)}
                                        className={[
                                            'rounded-full px-3 py-1.5 text-[12px] font-semibold',
                                            action.cls,
                                        ].join(' ')}
                                    >
                                        {tAction(action.key)}
                                    </button>
                                </div>
                                <Link href={`/${locale}/worker/applications/${a.id}`} className="text-right">
                                    <FontAwesomeIcon
                                        icon={faArrowRight}
                                        className="text-base-content/50 h-3.5 w-3.5"
                                    />
                                </Link>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}
