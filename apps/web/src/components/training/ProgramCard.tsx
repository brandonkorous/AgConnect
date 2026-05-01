import Link from 'next/link';
import { useTranslations } from 'next-intl';

export type ProgramCardData = {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  funder: string;
  county: string;
  capacity: number;
  enrolledCount: number;
  startDate: string;
  endDate: string;
  topics: string[];
  status: string;
};

type Props = { program: ProgramCardData; locale: string };

export function ProgramCard({ program, locale }: Props) {
  const t = useTranslations('worker.training.card');
  const title = locale === 'es' ? program.titleEs : program.titleEn;
  const spotsLeft = Math.max(0, program.capacity - program.enrolledCount);
  const startDate = new Date(program.startDate).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endDate = new Date(program.endDate).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/${locale}/training/${program.seoSlug}`}
      className="border-base-300 bg-base-100 hover:border-primary/40 hover:shadow-sm grid gap-3 rounded-2xl border p-5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base-content/70 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5">
              {program.funder}
            </span>
            <span>{t('free')}</span>
          </div>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-base-content/60 text-sm">
            {program.county} · {startDate} – {endDate}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {program.topics.slice(0, 3).map((topic) => (
          <span
            key={topic}
            className="bg-secondary/15 text-secondary-content rounded-full px-2 py-1 text-xs"
          >
            {topic}
          </span>
        ))}
      </div>

      <div className="text-base-content/60 text-xs font-mono">
        {spotsLeft === 0
          ? t('full')
          : t('spots_left', { n: spotsLeft, capacity: program.capacity })}
      </div>
    </Link>
  );
}
