'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const FILTER_KEYS = [
  'within_25',
  'this_week',
  'pays_22',
  'has_housing',
  'pickup',
  'no_experience',
] as const;

export function BrowseJobsFilters() {
  const t = useTranslations('worker.jobs.browse');
  const [active, setActive] = useState<Set<string>>(
    new Set(['within_25', 'this_week']),
  );

  function toggle(k: string) {
    const next = new Set(active);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setActive(next);
  }

  return (
    <div className="border-base-300 mb-[18px] flex flex-wrap items-center gap-2.5 rounded-2xl border bg-white px-3.5 py-3">
      <span className="text-base-content/60 font-mono text-[11px] font-bold uppercase tracking-[0.06em] pr-1.5">
        {t('filters_label')}
      </span>
      {FILTER_KEYS.map((k) => {
        const isOn = active.has(k);
        return (
          <button
            type="button"
            key={k}
            aria-pressed={isOn}
            onClick={() => toggle(k)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
              isOn
                ? 'bg-base-content text-base-100'
                : 'bg-base-200 text-base-content/70 hover:bg-base-300',
            ].join(' ')}
          >
            {isOn && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
            {t(`filter.${k}` as 'filter.within_25')}
          </button>
        );
      })}
      <span className="text-base-content/60 ml-auto inline-flex items-center gap-1 text-xs">
        {t('sort_label')}{' '}
        <strong className="text-base-content">{t('sort_default')}</strong>
        <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5" />
      </span>
    </div>
  );
}
