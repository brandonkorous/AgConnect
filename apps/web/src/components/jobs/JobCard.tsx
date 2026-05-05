import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { CropGlyph } from './CropGlyph';

export type JobCardData = {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  county: string;
  city: string | null;
  wageMin: number;
  wageMax: number;
  wageUnit: string;
  startDate: string;
  endDate: string | null;
  employerName: string;
  employerVerified: boolean;
  skills: string[];
  housing: boolean;
  transport: boolean;
  /** Crop glyph kind — derived from skills/title; defaults to 'almond'. */
  crop?: string;
  /** Marketing badge — verified / hiring fast / top employer. */
  badge?: 'Verified' | 'Hiring fast' | 'Top employer';
  /** Open spots count. */
  spots?: number;
};

type Props = { job: JobCardData; locale: string };

export function JobCard({ job, locale }: Props) {
  const t = useTranslations('worker.jobs.card');
  const title = locale === 'es' ? job.titleEs : job.titleEn;
  const isUrgent = job.badge === 'Hiring fast';

  return (
    <Link
      href={`/${locale}/worker/jobs/${job.seoSlug}`}
      className="border-base-300 hover:border-primary/40 group block rounded-2xl border bg-white p-[18px] shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="bg-base-200 grid h-11 w-11 shrink-0 place-items-center rounded-xl">
          <CropGlyph crop={job.crop ?? 'almond'} size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 truncate text-[16.5px] font-semibold tracking-[-0.01em]">
              {title}
            </h3>
            {(job.badge || job.employerVerified) && (
              <span
                className={[
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em]',
                  isUrgent
                    ? 'bg-warning/20 text-warning-content'
                    : 'bg-primary/10 text-primary',
                ].join(' ')}
              >
                <span className="inline-block h-[5px] w-[5px] rounded-full bg-current" />
                {job.badge ?? t('verified')}
              </span>
            )}
          </div>
          <div className="text-base-content/70 mt-0.5 flex items-center gap-1.5 text-[13.5px]">
            <span className="truncate">{job.employerName}</span>
            <span className="bg-base-300 h-[3px] w-[3px] shrink-0 rounded-full" />
            <FontAwesomeIcon
              icon={faLocationDot}
              className="text-base-content/50 h-3 w-3 shrink-0"
            />
            <span className="truncate">{job.county} County</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div>
          <div className="text-base-content font-serif text-[28px] font-normal leading-none tracking-[-0.02em] whitespace-nowrap">
            ${job.wageMin}–${job.wageMax}
          </div>
          <div className="text-base-content/60 mt-1 text-[11.5px]">
            /{job.wageUnit}
          </div>
        </div>
        <div className="text-right">
          <div className="text-base-content/60 text-xs">{t('start_label')}</div>
          <div className="font-mono text-[13px] font-semibold tabular-nums slashed-zero">
            {job.startDate}
          </div>
        </div>
        <span className="bg-base-content text-base-100 group-hover:bg-primary inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium transition-colors sm:w-auto">
          {t('apply')}
          <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {typeof job.spots === 'number' && (
          <Tag>{t('spots', { n: job.spots })}</Tag>
        )}
        {job.housing && <Tag>{t('housing')}</Tag>}
        <Tag>{t('sms_apply')}</Tag>
      </div>
    </Link>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-base-100 text-base-content/60 border-base-300 rounded-full border px-2 py-[3px] text-[11px]">
      {children}
    </span>
  );
}
