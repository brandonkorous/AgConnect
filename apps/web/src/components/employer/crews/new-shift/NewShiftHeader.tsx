'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

type Props = {
  locale: string;
  crewName: string | null;
};

export function NewShiftHeader({ locale, crewName }: Props) {
  const t = useTranslations('employer.crews.new_shift');

  return (
    <>
      <nav
        aria-label={t('breadcrumbs_aria')}
        className="text-base-content/60 mb-3 flex flex-wrap items-center gap-1.5 text-xs"
      >
        <Link href={`/${locale}/employer/crews`} className="hover:text-base-content">
          {t('breadcrumb_crews')}
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="h-2 w-2 opacity-60" />
        <span className="text-base-content/80 font-semibold">{t('breadcrumb_current')}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')}{' '}
            <em className="text-primary not-italic font-light">{t('title_b')}</em>
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">
            {t('subtitle', { crew: crewName ?? t('breadcrumb_no_crew') })}
          </div>
        </div>
      </div>
    </>
  );
}
