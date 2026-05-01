import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { MONTHS } from './payMockData';

export function EarningsChart() {
  const t = useTranslations('worker.pay.chart');
  const max = Math.max(...MONTHS.map((m) => m[1]));
  const tabs = ['12mo', '6mo', 'ytd'] as const;

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

      <div className="border-base-300 mt-4 flex items-end gap-1.5 border-b pb-1.5" style={{ height: 200 }}>
        {MONTHS.map(([m, v], i) => (
          <div key={m} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="text-base-content/60 font-mono text-[10px] font-semibold">
              ${v.toFixed(1)}k
            </div>
            <div
              className={[
                'w-full rounded-t-md',
                i === MONTHS.length - 1 ? 'bg-warning opacity-100' : 'bg-primary',
              ].join(' ')}
              style={{
                height: `${(v / max) * 160}px`,
                opacity: i === MONTHS.length - 1 ? 1 : 0.5 + (i / MONTHS.length) * 0.5,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        {MONTHS.map(([m]) => (
          <div
            key={m}
            className="text-base-content/60 flex-1 text-center font-mono text-[10.5px] font-semibold"
          >
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}
