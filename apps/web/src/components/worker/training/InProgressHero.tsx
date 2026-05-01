import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import type { EnrollmentListItem } from '@/lib/api/training';

type Props = { enrollment: EnrollmentListItem; locale: string };

export function InProgressHero({ enrollment, locale }: Props) {
  const t = useTranslations('worker.training_hub.in_progress');
  const program = enrollment.program;
  const title = locale === 'es' ? program.titleEs : program.titleEn;
  // Crude progress: 0% before start, ~50% during, 100% after end. Replaced
  // when session completion tracking lands.
  const progress = computeProgress(program.startDate, program.endDate);
  const dash = (progress / 100) * 402;
  const nextWhen = formatNext(program.startDate, locale);

  return (
    <div className="bg-base-content text-base-100 relative mb-5 overflow-hidden rounded-2xl p-6">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 100% 0%, rgba(245,158,11,0.22), transparent 60%)',
        }}
      />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="text-warning font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
            {t('eyebrow', { funder: program.funder })}
          </div>
          <h2 className="font-serif mt-2 text-[32px] font-normal leading-[1.05] tracking-[-0.02em]">
            {title}
          </h2>
          <div className="mt-1 text-[13.5px] opacity-75">
            {program.county} · {progressLabel(progress, locale)}
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="bg-warning h-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[11px] opacity-70">
            <span>{t('progress', { pct: progress })}</span>
            <span>{t('next', { when: nextWhen })}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href={`/${locale}/worker/training/${program.seoSlug}`}
              className="bg-warning text-base-content inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-bold no-underline"
            >
              {t('cta_continue')}
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </Link>
            <button
              type="button"
              className="text-base-100 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-transparent px-4 py-2.5 text-[13.5px] font-semibold"
            >
              <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3" />
              {t('cta_schedule')}
            </button>
          </div>
        </div>

        <div className="relative grid h-[180px] w-[180px] place-items-center rounded-2xl border border-white/10 bg-white/5">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="64" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
            <circle
              cx="80"
              cy="80"
              r="64"
              stroke="oklch(83% 0.13 88)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${dash} 402`}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-serif text-[36px] leading-none tracking-[-0.025em]">
                {progress}
                <span className="text-[18px] opacity-50">%</span>
              </div>
              <div className="mt-1 font-mono text-[10.5px] tracking-[0.1em] opacity-60">
                {t('badge_complete')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeProgress(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function progressLabel(pct: number, locale: string): string {
  if (pct === 0) return locale === 'es' ? 'Por iniciar' : 'Starts soon';
  if (pct === 100) return locale === 'es' ? 'Sesiones terminadas' : 'Sessions complete';
  return locale === 'es' ? `${pct}% en curso` : `${pct}% through course`;
}

function formatNext(startIso: string, locale: string): string {
  const d = new Date(startIso);
  return d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}
