import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLocationDot,
  faCalendarDays,
  faAward,
} from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { fetchProgram } from '@/lib/api/training';
import { EnrollButton } from '@/components/training/EnrollButton';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await fetchProgram(slug);
  if (!data) return { title: 'Program' };
  return { title: locale === 'es' ? data.program.titleEs : data.program.titleEn };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.training_hub.detail' });
  const data = await fetchProgram(slug);
  if (!data) notFound();
  const { program, enrollment, spotsLeft } = data;
  const title = locale === 'es' ? program.titleEs : program.titleEn;
  const description = locale === 'es' ? program.descriptionEs : program.descriptionEn;

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <Link
        href={`/${locale}/worker/training`}
        className="text-base-content/70 hover:text-base-content mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('back')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Pill tone={program.funder === 'CDFA' ? 'warning' : 'primary'}>
              {t('fund_label', { fund: program.funder })}
            </Pill>
            {spotsLeft === 0 && <Pill tone="danger">{t('full')}</Pill>}
          </div>
          <h1 className="font-serif mt-3 text-[32px] font-normal leading-tight tracking-[-0.025em] sm:text-[40px]">
            {title}
          </h1>
          <div className="text-base-content/70 mt-2 flex flex-wrap items-center gap-3 text-[13.5px]">
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
              {program.locationName ?? `${program.county} County`}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarDays} className="h-3 w-3" />
              {new Date(program.startDate).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
              })}{' '}
              –{' '}
              {new Date(program.endDate).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="mt-6">
            <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">
              {t('about')}
            </h2>
            <p className="text-base-content/80 whitespace-pre-line text-[14.5px] leading-relaxed">
              {description}
            </p>
          </div>

          {program.topics.length > 0 && (
            <div className="mt-6">
              <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">
                {t('topics')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {program.topics.map((topic) => (
                  <span
                    key={topic}
                    className="bg-base-200 text-base-content/80 rounded-full px-3 py-1 text-[12px]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-serif mb-3 text-[20px] tracking-[-0.02em]">
              {t('you_will_receive')}
            </h2>
            <ul className="grid gap-3">
              <li className="flex items-start gap-3">
                <FontAwesomeIcon icon={faAward} className="text-primary mt-1 h-4 w-4" />
                <span className="text-[14px]">{t('cert')}</span>
              </li>
              <li className="flex items-start gap-3">
                <FontAwesomeIcon icon={faCalendarDays} className="text-primary mt-1 h-4 w-4" />
                <span className="text-[14px]">{t('reminders')}</span>
              </li>
            </ul>
          </div>
        </div>

        <aside className="grid gap-3.5 self-start">
          <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-5">
            <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
              {t('cost')}
            </div>
            <div className="font-serif text-primary text-[40px] leading-none tracking-[-0.025em]">
              {t('free')}
            </div>
            <div className="text-base-content/60 text-[12px]">
              {t('funded_by', { funder: program.funder })}
            </div>
            <EnrollButton
              programId={program.id}
              spotsLeft={spotsLeft}
              alreadyEnrolled={Boolean(enrollment)}
              locale={locale}
            />
            {spotsLeft > 0 && (
              <div className="text-base-content/60 text-center text-[11.5px]">
                {t('spots_left', {
                  n: spotsLeft,
                  capacity: program.capacity,
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
