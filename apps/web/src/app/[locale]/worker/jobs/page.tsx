import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BrowseJobsHeader } from '@/components/jobs/BrowseJobsHeader';
import { BrowseJobsFilters } from '@/components/jobs/BrowseJobsFilters';
import { CropChips } from '@/components/jobs/CropChips';
import { BrowseJobsAside } from '@/components/jobs/BrowseJobsAside';
import { JobCard, type JobCardData } from '@/components/jobs/JobCard';
import { fetchJobs } from '@/lib/api/jobs';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.jobs' });
  return { title: t('title') };
}

const TOTAL_OPEN = 142;
const COUNTY = 'Madera, CA';

// Light enrichment so cards have crop glyphs + badges + spots even before the
// employer-jobs api wires that metadata through.
const enrich = (jobs: JobCardData[]): JobCardData[] => {
  const cropFor = (j: JobCardData): string => {
    const text = `${j.titleEn} ${j.skills.join(' ')}`.toLowerCase();
    if (text.includes('grape') || text.includes('vine')) return 'grape';
    if (text.includes('almond')) return 'almond';
    if (text.includes('citrus') || text.includes('orange')) return 'citrus';
    if (text.includes('tomato')) return 'tomato';
    if (text.includes('strawberry') || text.includes('berry')) return 'strawberry';
    if (text.includes('lettuce')) return 'lettuce';
    return 'almond';
  };
  return jobs.map((j, i) => ({
    ...j,
    crop: cropFor(j),
    badge:
      j.employerVerified && i % 3 === 1
        ? 'Hiring fast'
        : j.employerVerified
          ? 'Verified'
          : undefined,
    spots: 6 + ((i * 7) % 18),
  }));
};

export default async function JobsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.jobs.browse' });
  const { jobs: rawJobs } = await fetchJobs();
  const jobs = enrich(rawJobs as unknown as JobCardData[]);
  // Pad the grid so the design's density reads even when seed data is sparse.
  const grid =
    jobs.length >= 8
      ? jobs
      : jobs.length === 0
        ? jobs
        : [
            ...jobs,
            ...jobs.slice(0, Math.max(0, 8 - jobs.length)).map((j, i) => ({
              ...j,
              id: `pad-${i}-${j.id}`,
            })),
          ];

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <BrowseJobsHeader totalCount={TOTAL_OPEN} county={COUNTY} />
      <BrowseJobsFilters />
      <CropChips />

      <div className="grid gap-[22px] lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3.5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-[22px] font-normal tracking-[-0.02em]">
                {t('top_matches')}
              </h2>
              <div className="text-base-content/60 mt-0.5 text-[12.5px]">
                {t('updated')}
              </div>
            </div>
            <span className="text-base-content/60 text-xs">
              {t.rich('showing', {
                total: TOTAL_OPEN,
                strong: (chunks) => (
                  <strong className="text-base-content">{chunks}</strong>
                ),
              })}
            </span>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {grid.map((job) => (
              <JobCard key={job.id} job={job} locale={locale} />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className="border-base-300 rounded-full border bg-white px-5 py-2.5 text-[13px] font-semibold"
            >
              {t('load_more', { n: 16 })}
            </button>
          </div>
        </div>

        <BrowseJobsAside />
      </div>
    </div>
  );
}
