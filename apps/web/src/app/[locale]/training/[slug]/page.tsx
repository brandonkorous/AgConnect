import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faMessage } from '@fortawesome/free-solid-svg-icons';
import { PublicShell } from '@/components/public/PublicShell';
import { fetchTraining } from '@/lib/api/server';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ProgramDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const programs = await fetchTraining();
  const program = programs.find((p) => p.seoSlug === slug);
  if (!program) notFound();
  const t = await getTranslations({ locale, namespace: 'worker.training.detail' });
  const title = locale === 'es' ? program.titleEs : program.titleEn;
  const startDate = new Date(program.startDate).toLocaleString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const endDate = new Date(program.endDate).toLocaleString(locale, {
    month: 'long',
    day: 'numeric',
  });
  const spotsLeft = Math.max(0, program.capacity - program.enrolledCount);

  return (
    <PublicShell locale={locale} title={title}>
      <div className="grid gap-6">
        <div className="bg-primary/5 border-primary/20 grid gap-2 rounded-2xl border p-5">
          <div className="text-primary text-xs font-semibold uppercase">
            {t('funded_by', { funder: program.funder })} · {t('free')}
          </div>
          <div className="text-base font-semibold">{program.county} County</div>
          <div className="text-base-content/70 text-sm">
            {startDate} – {endDate}
          </div>
          <div className="text-base-content/60 mt-1 text-xs font-mono">
            {spotsLeft === 0
              ? t('full')
              : t('spots_left', { n: spotsLeft, capacity: program.capacity })}
          </div>
          <button
            type="button"
            disabled={spotsLeft === 0}
            className="btn btn-primary btn-lg mt-3 w-full"
          >
            {spotsLeft === 0 ? t('enroll_full') : t('enroll')}
          </button>
        </div>

        <section>
          <h2 className="font-serif text-xl font-semibold">{t('about')}</h2>
          <p className="text-base-content/80 mt-2 leading-relaxed">
            {locale === 'es'
              ? `Capacitación gratuita financiada por ${program.funder} en ${program.county} County. Recibirás un certificado bilingüe al completar.`
              : `Free training funded by ${program.funder} in ${program.county} County. You'll receive a bilingual certificate upon completion.`}
          </p>
        </section>

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
