import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ApplicantCardView } from '@/lib/api/employer';

type Column = {
  key: 'applied' | 'reviewed' | 'hired' | 'rejected';
  swatch: string;
  cards: ApplicantCardView[];
};

type Props = {
  locale: string;
  applicants: ApplicantCardView[];
};

export async function HiringPipelineBoard({ locale, applicants }: Props) {
  const t = await getTranslations({ locale, namespace: 'employer.dashboard.pipeline' });
  const tStatus = await getTranslations({ locale, namespace: 'employer.kanban' });

  const cols: Column[] = (['applied', 'reviewed', 'hired', 'rejected'] as const).map((key) => ({
    key,
    swatch: swatchClass(key),
    cards: applicants.filter((a) => a.status === key),
  }));

  const total = applicants.length;

  return (
    <section className="mb-7">
      <div className="mb-3.5 flex items-end justify-between">
        <div>
          <div className="font-display text-2xl font-light tracking-tight">{t('title')}</div>
          <div className="text-base-content/60 mt-1 text-xs">{t('subtitle', { count: total })}</div>
        </div>
        <Link
          href={`/${locale}/employer/inbox`}
          className="text-primary text-sm font-semibold"
        >
          {t('open_full')} →
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {cols.map((col) => (
          <div
            key={col.key}
            className="bg-base-100 border-base-300 rounded-xl border p-3"
            style={{ minHeight: 280 }}
          >
            <div className="border-base-300 mb-2.5 flex items-center justify-between border-b px-1.5 pb-3 pt-1">
              <div className="flex items-center gap-2">
                <span className={['h-2 w-2 rounded-sm', col.swatch].join(' ')} />
                <span className="text-base-content/70 font-mono text-[11px] font-bold uppercase tracking-wider">
                  {tStatus(col.key)}
                </span>
              </div>
              <span className="text-base-content/60 font-mono text-[10px] font-bold">
                {col.cards.length}
              </span>
            </div>
            <div className="grid gap-2">
              {col.cards.slice(0, 3).map((a) => (
                <Link
                  key={a.id}
                  href={`/${locale}/employer/applications/${a.id}`}
                  className="bg-base-200 border-base-300 hover:border-primary/40 rounded-lg border p-2.5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={[
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold',
                        a.status === 'hired'
                          ? 'bg-primary text-primary-content'
                          : 'bg-base-content text-base-100',
                      ].join(' ')}
                    >
                      {(a.worker.firstName[0] ?? '').toUpperCase()}
                      {a.worker.lastInitial.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">
                        {a.worker.firstName} {a.worker.lastInitial}.
                      </div>
                      <div className="text-base-content/60 truncate text-[11px]">
                        {locale === 'es' ? a.job.titleEs : a.job.titleEn}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-primary font-mono text-[10px] font-bold">
                      {a.worker.skillsMatchCount} {t('match')}
                    </span>
                    {a.status === 'hired' && (
                      <span className="text-success font-mono text-[10px] font-bold">
                        {t('accepted')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {col.cards.length === 0 && (
                <div className="text-base-content/40 px-1 py-2 text-center font-mono text-[11px]">
                  —
                </div>
              )}
              {col.cards.length > 3 && (
                <div className="text-base-content/60 px-1 py-1 text-center font-mono text-[11px]">
                  + {col.cards.length - 3} {t('more')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function swatchClass(key: 'applied' | 'reviewed' | 'hired' | 'rejected'): string {
  switch (key) {
    case 'applied':
      return 'bg-base-content/30';
    case 'reviewed':
      return 'bg-info';
    case 'hired':
      return 'bg-success';
    case 'rejected':
      return 'bg-error/60';
  }
}
