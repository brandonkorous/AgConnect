import { useTranslations } from 'next-intl';

type Props = { id: '1' | '2' | '3' | '4' };

export function FeaturedJobCard({ id }: Props) {
  const t = useTranslations(`landing.featured_jobs.jobs.${id}`);
  const cardT = useTranslations('landing.featured_jobs.card');
  const isGrower = t('type') === 'grower';
  const tags = t.raw('tags') as string[];

  return (
    <article className="border-hairline flex h-full flex-col gap-3.5 border bg-white p-6">
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 ${isGrower ? 'bg-honey' : 'bg-moss'}`}
        >
          {isGrower ? (
            <svg width="9" height="9" viewBox="0 0 14 14" aria-hidden>
              <path d="M7 1 L4 7 H10 Z" fill="#1F1B14" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M7 1 L9 5 L13 5.5 L10 8.5 L11 13 L7 11 L3 13 L4 8.5 L1 5.5 L5 5 Z"
                fill="#C8A24A"
              />
            </svg>
          )}
          <span
            className={`font-sans text-[10px] font-semibold tracking-[0.06em] ${isGrower ? 'text-ink' : 'text-bone'}`}
          >
            {isGrower ? cardT('verified_grower') : cardT('verified_flc')}
          </span>
        </div>
        <span className="text-soil font-mono text-[11px]">{t('location')}</span>
      </div>

      <div>
        <h3 className="text-ink font-serif text-[22px] font-semibold leading-tight tracking-[-0.02em]">
          {t('title_es')}
        </h3>
        <p className="text-soil mt-0.5 font-sans text-[13px] italic">{t('title_en')}</p>
      </div>

      <p className="text-soil font-sans text-sm">{t('employer')}</p>

      <ul className="flex flex-wrap gap-1.5 pt-1">
        {tags.map((tag, i) => (
          <li key={i} className="bg-sage px-2.5 py-1">
            <span className="text-ink font-sans text-[11px]">{tag}</span>
          </li>
        ))}
      </ul>

      <div className="border-hairline mt-auto flex items-center justify-between border-t pt-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-soil font-sans text-[11px] tracking-[0.06em] uppercase">
            {cardT('hourly')}
          </span>
          <span className="text-moss font-serif text-lg font-semibold">{t('wage')}</span>
        </div>
        <a
          href={`/jobs/${id}`}
          className="bg-moss text-bone hover:bg-ink px-4 py-2.5 font-sans text-[13px] font-semibold"
        >
          {cardT('apply')}
        </a>
      </div>
    </article>
  );
}
