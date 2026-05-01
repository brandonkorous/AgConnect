import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { COMPLETENESS_TASKS } from './documentsMockData';

const PCT = 92;

export function CompletenessCard() {
  const t = useTranslations('worker.documents.completeness');
  return (
    <div className="border-base-300 bg-base-100 mb-5 grid items-center gap-8 rounded-2xl border p-[22px] lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
          {t('eyebrow')}
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <div className="font-serif text-primary text-[48px] leading-none tracking-[-0.025em]">
            {PCT}
            <span className="text-[24px] opacity-50">%</span>
          </div>
          <div className="text-base-content/80 max-w-[360px] text-[13.5px]">
            {t.rich('blurb', {
              top: (chunks) => <strong className="text-base-content">{chunks}</strong>,
              boost: (chunks) => <strong className="text-primary">{chunks}</strong>,
            })}
          </div>
        </div>
        <div className="bg-base-200 mt-4 h-2 overflow-hidden rounded-full">
          <div className="bg-primary h-full" style={{ width: `${PCT}%` }} />
        </div>
      </div>
      <div className="grid gap-2">
        {COMPLETENESS_TASKS.map((s) => (
          <div
            key={s.key}
            className={[
              'flex items-center gap-2.5 rounded-lg px-3 py-2',
              s.done ? 'bg-primary/10' : 'bg-base-200',
            ].join(' ')}
          >
            <div
              className={[
                'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-white',
                s.done
                  ? 'bg-primary'
                  : 'border-base-300 border-[1.5px] border-dashed bg-transparent',
              ].join(' ')}
            >
              {s.done && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />}
            </div>
            <div
              className={[
                'flex-1 text-[12.5px] font-semibold',
                s.done ? 'text-primary' : 'text-base-content/80',
              ].join(' ')}
            >
              {t(`task.${s.key}`)}
            </div>
            {!s.done && (
              <a
                href="#"
                className="text-primary text-[11.5px] font-bold no-underline"
              >
                {t('add')}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
