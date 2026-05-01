import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faMessage } from '@fortawesome/free-solid-svg-icons';
import { PublicShell } from '@/components/public/PublicShell';
import { fetchPublicProgram } from '@/lib/api/public-training';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const program = await fetchPublicProgram(slug);
  if (!program) return { title: 'Training' };
  const title = locale === 'es' ? program.titleEs : program.titleEn;
  const description =
    (locale === 'es' ? program.descriptionEs : program.descriptionEn).slice(0, 160) ||
    `${program.funder}-funded training in ${program.county} County, CA.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/training/${slug}`,
      languages: { en: `/en/training/${slug}`, es: `/es/training/${slug}` },
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const program = await fetchPublicProgram(slug);
  if (!program) notFound();
  const t = await getTranslations({ locale, namespace: 'public_training.detail' });
  const title = locale === 'es' ? program.titleEs : program.titleEn;
  const description = locale === 'es' ? program.descriptionEs : program.descriptionEn;
  const startDate = new Date(program.startDate).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const endDate = new Date(program.endDate).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: description || `${program.funder}-funded training in ${program.county} County.`,
    provider: { '@type': 'Organization', name: program.orgName },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability:
        program.spotsLeft > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      validThrough: program.startDate,
    },
    courseMode: 'in-person',
    inLanguage: ['en', 'es'],
    url: `${siteUrl}/${locale}/training/${slug}`,
  };

  return (
    <PublicShell locale={locale} title={title}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <Link
        href={`/${locale}/training`}
        className="text-base-content/70 hover:text-base-content -mt-2 mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
      >
        ← {t('back')}
      </Link>
      <div className="grid gap-6">
        <div className="bg-primary/5 border-primary/20 grid gap-2 rounded-2xl border p-5">
          <div className="text-primary text-xs font-semibold uppercase">
            {t('fund_label', { fund: program.funder })} · {t('free')}
          </div>
          <div className="text-base font-semibold">{program.county} County</div>
          <div className="text-base-content/70 text-sm">
            {startDate} – {endDate}
          </div>
          <div className="text-base-content/60 mt-1 text-xs font-mono">
            {program.spotsLeft === 0
              ? t('full')
              : t('spots_left', { n: program.spotsLeft, capacity: program.capacity })}
          </div>
          <Link
            href={`/${locale}/sign-up?redirect_url=${encodeURIComponent(`/${locale}/worker/training/${slug}`)}` as Route}
            className="btn btn-primary btn-lg mt-3 w-full no-underline"
          >
            {t('apply_cta')}
          </Link>
          <div className="text-base-content/60 text-center text-[11.5px]">
            {t('signin_note')}
          </div>
        </div>

        <section>
          <h2 className="font-serif text-xl font-semibold">{t('about')}</h2>
          <p className="text-base-content/80 mt-2 whitespace-pre-line leading-relaxed">
            {description}
          </p>
        </section>

        {program.topics.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-semibold">{t('topics')}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {program.topics.map((topic) => (
                <span
                  key={topic}
                  className="bg-secondary/15 text-secondary-content rounded-full px-3 py-1 text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-serif text-xl font-semibold">{t('you_will_receive')}</h2>
          <ul className="mt-3 grid gap-2">
            <li className="flex items-start gap-3">
              <FontAwesomeIcon icon={faCertificate} className="text-primary mt-1 h-4 w-4" />
              <span>{t('cert')}</span>
            </li>
            <li className="flex items-start gap-3">
              <FontAwesomeIcon icon={faMessage} className="text-primary mt-1 h-4 w-4" />
              <span>{t('reminders')}</span>
            </li>
          </ul>
        </section>
      </div>
    </PublicShell>
  );
}
