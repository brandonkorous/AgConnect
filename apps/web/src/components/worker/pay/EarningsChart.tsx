'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import type { Paystub } from '@/lib/api/me';

const MONTH_KEYS = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;

type Tab = '12mo' | '6mo' | 'ytd';

type Props = { paystubs: Paystub[]; locale: string };

export function EarningsChart({ paystubs, locale }: Props) {
    const t = useTranslations('worker.pay.chart');
    const tabs: Tab[] = ['12mo', '6mo', 'ytd'];
    const [tab, setTab] = useState<Tab>('12mo');

    const now = new Date();
    const monthsBack =
        tab === '12mo'
            ? 12
            : tab === '6mo'
                ? 6
                : now.getUTCMonth() + 1;
    const months: { label: string; value: number; isCurrent: boolean }[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCMonth(d.getUTCMonth() - i, 1);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        const sumCents = paystubs
            .filter((p) => p.payDate.startsWith(key))
            .reduce((acc, p) => acc + p.grossCents, 0);
        months.push({
            label: MONTH_KEYS[d.getUTCMonth()] ?? 'jan',
            value: sumCents / 100000,
            isCurrent: i === 0,
        });
    }

    const max = Math.max(0.5, ...months.map((m) => m.value));
    const hasData = months.some((m) => m.value > 0);

    if (!hasData) {
        return (
            <div className="border-base-300 bg-base-100 grid place-items-center rounded-2xl border p-12 text-center">
                <p className="text-base-content/70 text-[13.5px]">
                    {locale === 'es'
                        ? 'Tu tendencia de ganancias aparecerá aquí después de tu primer recibo.'
                        : 'Your earnings trend will appear here after your first paystub.'}
                </p>
            </div>
        );
    }

    return (
        <div className="border-base-300 bg-base-100 rounded-2xl border p-[22px]">
            <SectionHeading
                sub={t('sub')}
                right={
                    <div className="flex gap-1.5">
                        {tabs.map((k) => (
                            <button
                                type="button"
                                key={k}
                                onClick={() => setTab(k)}
                                aria-pressed={k === tab}
                                className={[
                                    'cursor-pointer rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
                                    k === tab
                                        ? 'bg-primary text-primary-content'
                                        : 'bg-base-200 text-base-content/70',
                                ].join(' ')}
                            >
                                {t(`tab.${k}`)}
                            </button>
                        ))}
                    </div>
                }
            >
                {t('title')}
            </SectionHeading>

            <div
                className="border-base-300 mt-4 flex items-end gap-1.5 border-b pb-1.5"
                style={{ height: 200 }}
            >
                {months.map((m, i) => (
                    <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                        <div className="text-base-content/60 hidden font-mono text-[10px] font-semibold sm:block">
                            ${m.value.toFixed(1)}k
                        </div>
                        <div
                            className={[
                                'w-full rounded-t-md',
                                m.isCurrent ? 'bg-warning' : 'bg-primary',
                            ].join(' ')}
                            style={{
                                height: `${(m.value / max) * 160}px`,
                                minHeight: 2,
                                opacity: m.isCurrent ? 1 : 0.5 + (i / months.length) * 0.5,
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-2 flex justify-between">
                {months.map((m, i) => (
                    <div
                        key={i}
                        className="text-base-content/60 min-w-0 flex-1 text-center font-mono text-xs font-semibold"
                    >
                        {/* Render month abbreviation in the active locale. */}
                        {new Date(2024, MONTH_KEYS.indexOf(m.label as (typeof MONTH_KEYS)[number]), 1)
                            .toLocaleDateString(locale, { month: 'short' })
                            .replace('.', '')}
                    </div>
                ))}
            </div>
        </div>
    );
}
