import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { THREADS } from './messagesMockData';

export function ThreadList() {
  const t = useTranslations('worker.messages.list');
  return (
    <div className="border-base-300 overflow-y-auto border-r">
      <div className="border-base-300 border-b p-3">
        <div className="bg-base-200 text-base-content/60 flex items-center gap-2 rounded-full px-3 py-2">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3 w-3" />
          <span className="text-[12px]">{t('search')}</span>
        </div>
      </div>
      {THREADS.map((th, i) => (
        <div
          key={th.id}
          className={[
            'cursor-pointer px-4 py-3.5',
            i < THREADS.length - 1 ? 'border-base-300 border-b' : '',
            th.active ? 'bg-base-200 border-l-primary border-l-[3px]' : 'border-l-[3px] border-l-transparent',
          ].join(' ')}
        >
          <div className="flex gap-2.5">
            <div
              className={[
                'grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[11.5px] font-bold text-white',
                th.isAgconn ? 'bg-base-content' : 'bg-primary',
              ].join(' ')}
            >
              {th.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div
                  className={[
                    'text-[13px]',
                    th.unread ? 'text-base-content font-bold' : 'text-base-content/80 font-medium',
                  ].join(' ')}
                >
                  {th.from}
                </div>
                <div
                  className={[
                    'shrink-0 font-mono text-[10.5px] font-bold',
                    th.unread ? 'text-primary' : 'text-base-content/60',
                  ].join(' ')}
                >
                  {th.when}
                </div>
              </div>
              <div className="text-base-content/60 mt-0.5 text-[11px] italic">{th.who}</div>
              <div
                className={[
                  'mt-1 line-clamp-2 text-[12px] leading-snug',
                  th.unread ? 'text-base-content/80' : 'text-base-content/60',
                ].join(' ')}
              >
                {th.last}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="border-base-300 text-base-content/60 rounded border bg-white px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.05em]">
                  {th.channel}
                </span>
                {th.unread && (
                  <span className="bg-warning inline-block h-1.5 w-1.5 rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
