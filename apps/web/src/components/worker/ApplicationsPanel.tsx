'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { useApplicationsSuspense, type AppStatus } from '@/lib/api/hooks/applications';
import { inferCrop } from '@/lib/crop';

const STAGE_BADGE: Record<AppStatus, string> = {
  applied: 'badge-ghost',
  reviewed: 'badge-info',
  hired: 'badge-success',
  rejected: 'badge-ghost',
  withdrawn: 'badge-ghost',
};

export function ApplicationsPanel() {
  const locale = useLocale();
  const t = useTranslations('worker.dashboard.apps');
  const tStage = useTranslations('worker.application.status');
  const { data: page } = useApplicationsSuspense('all');
  const applications = page.applications;
  const rows = applications.slice(0, 5);
  const activeCount = applications.filter(
    (a) => a.status === 'applied' || a.status === 'reviewed',
  ).length;

  return (
    <section className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
      <header className="border-base-300 flex items-center justify-between border-b px-5 py-4">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight">{t('title')}</h2>
          <p className="text-base-content/60 mt-0.5 text-xs">
            {t('subtitle', { count: activeCount })}
          </p>
        </div>
        <Link
          href={`/${locale}/worker/applications`}
          className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline no-underline"
        >
          {t('view_all')}
          <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-base-content/70 text-sm">
            {locale === 'es'
              ? 'Aún no tienes postulaciones.'
              : "You haven't applied to any jobs yet."}
          </p>
        </div>
      ) : (
        <>
          <div
            role="row"
            className="border-base-300 text-base-content/60 grid grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.9fr_0.5fr] gap-4 border-b px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          >
            <span>{t('cols.job')}</span>
            <span>{t('cols.employer')}</span>
            <span>{t('cols.start')}</span>
            <span>{t('cols.rate')}</span>
            <span>{t('cols.status')}</span>
            <span aria-hidden />
          </div>

          <ul>
            {rows.map((app, i) => {
              const title = locale === 'es' ? app.job.titleEs : app.job.titleEn;
              const crop = inferCrop(app.job.titleEn, app.skillsAtApply);
              return (
                <Link
                  key={app.id}
                  href={`/${locale}/worker/applications/${app.id}`}
                  className={[
                    'grid grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr_0.9fr_0.5fr] items-center gap-4 px-5 py-3.5 text-sm no-underline',
                    i < rows.length - 1 ? 'border-base-300 border-b' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="bg-base-200 grid h-8 w-8 shrink-0 place-items-center rounded-lg">
                      <CropGlyph crop={crop} size={20} />
                    </div>
                    <div className="text-base-content truncate font-semibold">{title}</div>
                  </div>
                  <div className="text-base-content/70 truncate">
                    {app.job.employerName}
                  </div>
                  <div className="font-mono text-sm font-semibold">
                    {app.job.startDate.slice(5)}
                  </div>
                  <div className="font-serif text-base font-medium tracking-tight">
                    ${app.job.wageMin.toFixed(2)}
                  </div>
                  <div>
                    <span
                      className={`badge ${STAGE_BADGE[app.status]} px-2 py-1 text-[10px] font-bold uppercase tracking-wider`}
                    >
                      {tStage(app.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-base-content/40 h-4 w-4"
                    />
                  </div>
                </Link>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
