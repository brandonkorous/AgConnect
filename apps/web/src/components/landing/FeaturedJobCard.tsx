import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import type { FeaturedJob } from '@/data/jobs';

export function FeaturedJobCard({ job }: { job: FeaturedJob }) {
  const t = useTranslations();
  const cardT = useTranslations('landing.featured_jobs.card');

  return (
    <article className="border-soil/15 bg-bone flex h-full flex-col gap-4 border p-6 transition-colors hover:border-soil/40">
      <div className="flex items-center justify-between">
        <div className="bg-moss flex items-center gap-1.5 px-2 py-1">
          <svg width="9" height="9" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M7 1 L9 5 L13 5.5 L10 8.5 L11 13 L7 11 L3 13 L4 8.5 L1 5.5 L5 5 Z"
              fill="#C8A24A"
            />
          </svg>
          <span className="text-bone font-sans text-[10px] font-semibold tracking-[0.06em]">
            {cardT('verified')}
          </span>
        </div>
        <span className="text-soil font-mono text-[11px]">{job.posted}</span>
      </div>

      <div>
        <h3 className="text-ink font-serif text-lg font-semibold leading-tight tracking-tight">
          {t(job.titleKey as never)}
        </h3>
        <p className="text-soil mt-1 font-sans text-[13px]">{t(job.employerKey as never)}</p>
        <p className="text-soil mt-0.5 font-sans text-[12px]">{t(job.countyKey as never)}</p>
      </div>

      <div className="border-soil/15 mt-auto border-t pt-4">
        <p className="text-moss font-serif text-base font-semibold">{job.wage}</p>
        <p className="text-soil mt-1 font-mono text-[11px]">Starts {job.start}</p>
      </div>

      <a
        href={`/jobs/${job.id}`}
        className="text-moss inline-flex items-center gap-1.5 font-sans text-sm font-semibold"
      >
        <span>{cardT('apply')}</span>
        <ArrowRight size={12} stroke="#2D4030" />
      </a>
    </article>
  );
}
