import { useTranslations } from 'next-intl';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { SHARES } from './documentsMockData';

const COLS = '1.2fr 1.2fr 1fr 0.6fr 0.4fr';

export function RecentSharesTable() {
  const t = useTranslations('worker.documents.shares');
  return (
    <>
      <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
      <div className="border-base-300 bg-base-100 overflow-hidden rounded-2xl border">
        {SHARES.map((s, i) => (
          <div
            key={i}
            className={[
              'grid items-center gap-4 px-5 py-3.5 text-[13px]',
              i < SHARES.length - 1 ? 'border-base-300 border-b' : '',
            ].join(' ')}
            style={{ gridTemplateColumns: COLS }}
          >
            <div className="font-semibold">{s.who}</div>
            <div className="text-base-content/80">{s.what}</div>
            <div className="text-base-content/60 font-mono text-[11.5px]">{s.when}</div>
            <div>
              <Pill tone={s.status === 'Active' ? 'success' : 'ghost'}>
                {t(`status.${s.status === 'Active' ? 'active' : 'revoked'}`)}
              </Pill>
            </div>
            <div className="text-right">
              <a
                href="#"
                className="text-primary text-[12px] font-semibold no-underline"
              >
                {t(`action.${s.status === 'Active' ? 'revoke' : 'view'}`)}
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
