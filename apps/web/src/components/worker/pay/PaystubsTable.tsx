import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { WEEKS } from './payMockData';

const COLS = '1.4fr 1.2fr 0.7fr 0.9fr 0.9fr 0.8fr 0.5fr';

export function PaystubsTable() {
  const t = useTranslations('worker.pay.table');
  const heads = ['period', 'employer', 'hours', 'gross', 'net', 'status', 'spacer'] as const;
  return (
    <div className="border-base-300 bg-base-100 overflow-hidden rounded-2xl border">
      <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
        <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
        <div className="flex gap-2">
          <button
            type="button"
            className="border-base-300 rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold"
          >
            {t('all_employers')}
          </button>
          <button
            type="button"
            className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold"
          >
            <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
            {t('export_csv')}
          </button>
        </div>
      </div>

      <div
        className="border-base-300 text-base-content/60 grid gap-4 border-b px-5 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em]"
        style={{ gridTemplateColumns: COLS }}
      >
        {heads.map((h) =>
          h === 'spacer' ? <span key={h} /> : <span key={h}>{t(`head.${h}`)}</span>,
        )}
      </div>

      {WEEKS.map((w, i) => (
        <div
          key={w.period}
          className={[
            'grid items-center gap-4 px-5 py-3.5 text-[13px]',
            i < WEEKS.length - 1 ? 'border-base-300 border-b' : '',
          ].join(' ')}
          style={{ gridTemplateColumns: COLS }}
        >
          <div className="font-semibold">{w.period}</div>
          <div className="text-base-content/80">{w.employer}</div>
          <div className="font-mono">{w.hours.toFixed(1)}</div>
          <div className="font-serif text-[16px] tracking-[-0.02em]">${w.gross.toFixed(2)}</div>
          <div className="font-serif text-primary text-[16px] tracking-[-0.02em]">
            ${w.net.toFixed(2)}
          </div>
          <div>
            <Pill tone={w.status === 'Paid' ? 'success' : 'warning'}>
              {t(`status.${w.status === 'Paid' ? 'paid' : 'pending'}`)}
            </Pill>
          </div>
          <div className="text-right">
            <a
              href="#"
              className="text-primary text-[12px] font-semibold no-underline"
            >
              {t('pdf')}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
