import { useTranslations } from 'next-intl';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { UPCOMING, type UpcomingShift } from './shiftsMockData';

const STATUS_TONE: Record<UpcomingShift['status'], 'success' | 'warning' | 'accent' | 'ghost'> = {
  Confirmed: 'success',
  'Awaiting confirm': 'warning',
  Enrolled: 'accent',
  Pending: 'ghost',
};

const STATUS_KEY: Record<UpcomingShift['status'], string> = {
  Confirmed: 'confirmed',
  'Awaiting confirm': 'awaiting',
  Enrolled: 'enrolled',
  Pending: 'pending',
};

export function UpNextList() {
  const t = useTranslations('worker.shifts.up_next');
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
      <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
      <div className="grid gap-2.5">
        {UPCOMING.map((s, i) => (
          <div
            key={i}
            className={[
              'rounded-xl p-3',
              i === 0 ? 'bg-base-200 border-base-300 border' : '',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-base-content/60 font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                  {s.date}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[13.5px] font-semibold">
                  {s.training && (
                    <span className="bg-warning inline-block h-1.5 w-1.5 rounded-full" />
                  )}
                  {s.title}
                </div>
                <div className="text-base-content/60 mt-0.5 text-[11.5px]">
                  {s.employer} · {s.loc}
                </div>
              </div>
              <Pill tone={STATUS_TONE[s.status]}>{t(`status.${STATUS_KEY[s.status]}`)}</Pill>
            </div>
            <div className="text-base-content/70 mt-2 flex items-center gap-3 font-mono text-[11.5px]">
              <span>
                {s.start}–{s.end}
              </span>
              <span>·</span>
              <span>{s.pay}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
