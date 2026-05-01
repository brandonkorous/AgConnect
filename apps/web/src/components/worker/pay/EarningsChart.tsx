import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import type { Paystub } from '@/lib/api/me';

const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;

type Props = { paystubs: Paystub[]; locale: string };

export function EarningsChart({ paystubs, locale }: Props) {
  const t = useTranslations('worker.pay.chart');
  const tabs = ['12mo', '6mo', 'ytd'] as const;

  // Sum gross by calendar month for the rolling 12-month window.
  const now = new Date();
  const months: { label: string; value: number; isCurrent: boolean }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCMonth(d.getUTCMonth() - i, 1);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const sumCents = paystubs
      .filter((p) => p.payDate.startsWith(key))
      .reduce((acc, p) => acc + p.grossCents, 0);
    months.push({
      label: MONTH_KEYS[d.getUTCMonth()],
      value: sumCents / 100000,
      isCurrent: i === 0,
    });
  }

  const max = Math.max(0.5, ...months.map((m) => m.value));

  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[22px]">
      <SectionHeading
        sub={t('sub')}
        right={
          <div className="flex gap-1.5">
            {tabs.map((k, i) => (
              <span
                key={k}
                className={[
                  'cursor-pointer rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
                  i === 0
                    ? 'bg-base-content text-base-100'
                    : 'bg-base-200 text-base-content/70',
                ].join(' ')}
              >
                {t(`tab.${k}`)}
              </span>
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
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="text-base-content/60 font-mono text-[10px] font-semibold">
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
            className="text-base-content/60 flex-1 text-center font-mono text-[10.5px] font-semibold"
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
