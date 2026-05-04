'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { ActiveHireView } from '@/lib/api/employer-ops';
import { SectionCard } from './SectionCard';
import type { CrewDraft } from './types';

type Props = {
  draft: CrewDraft;
  onChange: (patch: Partial<CrewDraft>) => void;
  hires: ActiveHireView[];
  locale: string;
};

export function ForemanSection({ draft, onChange, hires, locale }: Props) {
  const t = useTranslations('employer.crews.edit_crew.foreman');

  return (
    <SectionCard id="foreman" title={t('title')} sub={t('sub')}>
      {hires.length === 0 ? (
        <div className="border-base-300 text-base-content/60 rounded-xl border border-dashed p-4 text-center text-xs">
          {t('empty_no_hires')}
        </div>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {hires.map((h) => {
            const sel = draft.foremanUserId === h.workerUserId;
            const initials = `${h.firstName[0] ?? '?'}${h.lastInitial}`.toUpperCase();
            return (
              <button
                key={h.workerUserId}
                type="button"
                onClick={() => onChange({ foremanUserId: sel ? null : h.workerUserId })}
                className={[
                  'cursor-pointer rounded-2xl p-3.5 text-left transition',
                  sel
                    ? 'border-primary bg-primary/10 border-2'
                    : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40 border bg-base-100',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <span className="bg-base-content text-base-100 grid h-10 w-10 place-items-center rounded-full font-mono text-xs font-bold">
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-tight">
                      {h.firstName} {h.lastInitial ? `${h.lastInitial}.` : ''}
                    </span>
                    <span className="text-base-content/60 mt-0.5 block text-[11px]">
                      {h.jobTitle || t('hired')}
                    </span>
                  </span>
                  {sel && (
                    <span className="bg-primary text-primary-content grid h-5 w-5 place-items-center rounded-full">
                      <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <a
        href={`/${locale}/employer/jobs`}
        className="bg-base-200/40 border-base-300 hover:bg-base-200 mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3.5 transition"
      >
        <span className="bg-base-200 text-base-content/50 grid h-10 w-10 place-items-center rounded-full">
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">{t('hire_cta_title')}</span>
          <span className="text-base-content/60 mt-0.5 block text-[11px]">{t('hire_cta_sub')}</span>
        </span>
      </a>
    </SectionCard>
  );
}
