import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { Pill } from '@/components/worker/primitives/Pill';
import { inferCrop } from '@/lib/crop';
import type { PublicJob } from '@/lib/api/public-jobs';

export function PublicJobCard({ job, locale }: { job: PublicJob; locale: string }) {
  const title = locale === 'es' ? job.titleEs : job.titleEn;
  const crop = inferCrop(job.titleEn, job.skills);
  return (
    <Link
      href={`/${locale}/jobs/${job.seoSlug}`}
      className="border-base-300 hover:border-primary/40 group block rounded-2xl border bg-white p-[18px] shadow-sm transition-all hover:shadow-md no-underline"
    >
      <div className="flex items-start gap-3">
        <div className="bg-base-200 grid h-11 w-11 shrink-0 place-items-center rounded-xl">
          <CropGlyph crop={crop} size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 truncate text-[16.5px] font-semibold tracking-[-0.01em]">
              {title}
            </h3>
            {job.employerVerified && <Pill tone="primary">Verified</Pill>}
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

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-base-content font-serif text-[28px] font-normal leading-none tracking-[-0.02em]">
            ${job.wageMin}–${job.wageMax}
          </div>
          <div className="text-base-content/60 mt-1 text-[11.5px]">/{job.wageUnit}</div>
        </div>
        <span className="bg-base-content text-base-100 group-hover:bg-primary inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium transition-colors">
          {locale === 'es' ? 'Ver' : 'View'}
          <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
