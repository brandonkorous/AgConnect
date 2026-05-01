'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons';

type FilterKey =
  | 'within_25'
  | 'this_week'
  | 'pays_22'
  | 'has_housing'
  | 'pickup'
  | 'no_experience';

const FILTER_KEYS: FilterKey[] = [
  'within_25',
  'this_week',
  'pays_22',
  'has_housing',
  'pickup',
  'no_experience',
];

function isOn(sp: URLSearchParams, key: FilterKey): boolean {
  switch (key) {
    case 'within_25':
      return sp.get('county') === 'Madera';
    case 'this_week': {
      const v = sp.get('startBefore');
      return Boolean(v);
    }
    case 'pays_22':
      return Number(sp.get('wageMin') ?? '0') >= 22;
    case 'has_housing':
      return sp.get('housing') === '1';
    case 'pickup':
      return sp.get('transport') === '1';
    case 'no_experience':
      return sp.get('noExperience') === '1';
  }
}

function applyToggle(sp: URLSearchParams, key: FilterKey, on: boolean): URLSearchParams {
  const next = new URLSearchParams(sp);
  next.delete('cursor');
  switch (key) {
    case 'within_25':
      if (on) next.set('county', 'Madera');
      else next.delete('county');
      break;
    case 'this_week':
      if (on) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() + 7);
        next.set('startBefore', d.toISOString().slice(0, 10));
      } else {
        next.delete('startBefore');
      }
      break;
    case 'pays_22':
      if (on) next.set('wageMin', '22');
      else next.delete('wageMin');
      break;
    case 'has_housing':
      if (on) next.set('housing', '1');
      else next.delete('housing');
      break;
    case 'pickup':
      if (on) next.set('transport', '1');
      else next.delete('transport');
      break;
    case 'no_experience':
      if (on) next.set('noExperience', '1');
      else next.delete('noExperience');
      break;
  }
  return next;
}

export function BrowseJobsFilters() {
  const t = useTranslations('worker.jobs.browse');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(k: FilterKey) {
    const next = applyToggle(searchParams, k, !isOn(searchParams, k));
    const qs = next.toString();
    router.push((qs ? `${pathname}?${qs}` : pathname) as Route);
  }

  return (
    <div className="border-base-300 mb-[18px] flex flex-wrap items-center gap-2.5 rounded-2xl border bg-white px-3.5 py-3">
      <span className="text-base-content/60 font-mono text-[11px] font-bold uppercase tracking-[0.06em] pr-1.5">
        {t('filters_label')}
      </span>
      {FILTER_KEYS.map((k) => {
        const on = isOn(searchParams, k);
        return (
          <button
            type="button"
            key={k}
            aria-pressed={on}
            onClick={() => toggle(k)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
              on
                ? 'bg-base-content text-base-100'
                : 'bg-base-200 text-base-content/70 hover:bg-base-300',
            ].join(' ')}
          >
            {on && <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />}
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
