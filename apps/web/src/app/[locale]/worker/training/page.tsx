import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { StatTile } from '@/components/worker/primitives/StatTile';
import { InProgressHero } from '@/components/worker/training/InProgressHero';
import { RecommendedGrid } from '@/components/worker/training/RecommendedGrid';
import { CertificateGrid } from '@/components/worker/training/CertificateGrid';
import { fetchTrainingPrograms, fetchEnrollments } from '@/lib/api/training';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.training_hub' });
  return { title: t('meta.title') };
}

export default async function TrainingHubPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.training_hub' });

  const [{ programs }, enrollments] = await Promise.all([
    fetchTrainingPrograms({ hasCapacity: true, limit: 6 }),
    fetchEnrollments('all'),
  ]);

  const inProgress = enrollments.find((e) => e.status === 'enrolled');
  const completed = enrollments.filter((e) => e.status === 'completed');
  const recommended = programs
    .filter((p) => !enrollments.some((e) => e.program.id === p.id))
    .slice(0, 4);

  const stats = [
    {
      label: t('stat.in_progress.label'),
      value: String(enrollments.filter((e) => e.status === 'enrolled').length),
      sub: inProgress
        ? (locale === 'es' ? inProgress.program.titleEs : inProgress.program.titleEn)
        : t('stat.in_progress.sub'),
    },
    {
      label: t('stat.hours.label'),
      value: String(enrollments.length * 8),
      sub: t('stat.hours.sub'),
    },
    {
      label: t('stat.certs.label'),
      value: String(completed.length),
      sub: t('stat.certs.sub'),
      accent: 'primary' as const,
    },
    {
      label: t('stat.boost.label'),
      value: '+$2.50',
      sub: t('stat.boost.sub'),
      accent: 'accent' as const,
    },
  ];

  return (
    <div className="px-8 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow_n', {
          n: programs.length,
          defaultMessage: t('eyebrow'),
        })}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light not-italic">{t('title.em')}</em>
            .
          </>
        }
        sub={t('sub')}
        right={
          <Link
            href={`/${locale}/training`}
            className="btn btn-primary btn-sm rounded-full"
          >
            <FontAwesomeIcon icon={faGraduationCap} className="h-3 w-3" />
            {t('cta_browse')}
          </Link>
        }
      />

      <div className="mb-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {inProgress && (
        <InProgressHero
          enrollment={inProgress}
          locale={locale}
        />
      )}
      <RecommendedGrid programs={recommended} locale={locale} />
      <CertificateGrid certs={completed} locale={locale} />
    </div>
  );
}
