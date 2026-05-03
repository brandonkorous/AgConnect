import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload } from '@fortawesome/free-solid-svg-icons';

type Props = {
  locale: string;
  firstName: string;
  county: string | null;
  companyName: string;
  summaryLine: string;
};

export async function EmployerGreeting({
  locale,
  firstName,
  county,
  companyName,
  summaryLine,
}: Props) {
  const t = await getTranslations({ locale, namespace: 'employer.dashboard' });
  const dateLine = formatDateLine(locale);

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
          {[dateLine, county, companyName].filter(Boolean).join(' · ')}
        </p>
        <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
          {t(greetingKey())},{' '}
          <em className="text-primary not-italic font-light">{firstName || t('there')}</em>.
        </h1>
        <div className="text-base-content/70 mt-2 text-sm">{summaryLine}</div>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/${locale}/employer/reports?range=week`}
          className="btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium"
        >
          <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
          {t('weekly_report')}
        </Link>
        <Link
          href={`/${locale}/employer/jobs/new`}
          className="btn btn-sm btn-primary rounded-full"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          {t('post_new_job')}
        </Link>
      </div>
    </div>
  );
}

function greetingKey(): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' {
  const h = new Date().getHours();
  if (h < 12) return 'greeting_morning';
  if (h < 17) return 'greeting_afternoon';
  return 'greeting_evening';
}

function formatDateLine(locale: string): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}
