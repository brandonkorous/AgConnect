import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { fetchJob } from '@/lib/api/jobs';
import { ApplyButton } from '@/components/jobs/ApplyButton';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ApplyPage({ params }: Props) {
  const { locale, slug } = await params;
  const job = await fetchJob(slug);
  if (!job) notFound();
  // Listing was pulled or filled between browse and apply — bounce back to the
  // job detail page, which renders the "this listing has closed" state.
  if (job === 'gone') redirect(`/${locale}/worker/jobs/${slug}` as Route);
  const t = await getTranslations({ locale, namespace: 'worker.application.apply' });
  const title = locale === 'es' ? job.titleEs : job.titleEn;

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader title={t('title', { jobTitle: title })} />
      <div className="grid gap-5">
        <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-5">
          <h2 className="text-base-content/70 text-xs font-semibold uppercase tracking-wide">
            {t('your_profile')}
          </h2>
          <p className="text-base-content/80">{t('privacy')}</p>
          <Link
            href={`/${locale}/worker/profile`}
            className="text-primary link link-hover text-sm font-medium"
          >
            {t('edit_profile')} →
          </Link>
        </div>
        <ApplyButton
          locale={locale}
          jobId={job.id}
          alreadyAppliedStatus={job.applicationStatus ?? null}
        />
      </div>
    </div>
  );
}
