import { useTranslations } from 'next-intl';

type Props = { id: '1' | '2' | '3' | '4' };

export function FeaturedProgramCard({ id }: Props) {
  const t = useTranslations(`landing.featured_training.programs.${id}`);
  const cardT = useTranslations('landing.featured_training.card');
  const isFeature = (t.raw('feature') as unknown) === true;
  const tags = t.raw('tags') as string[];

  const containerClass = isFeature
    ? 'bg-moss'
    : 'bg-bone border-hairline border';
  const titleClass = isFeature ? 'text-bone' : 'text-ink';
  const subtitleClass = isFeature ? 'text-sage' : 'text-soil';
  const bodyClass = isFeature ? 'text-sage' : 'text-text-deep';
  const scheduleClass = isFeature ? 'text-honey' : 'text-soil';
  const tagBgClass = isFeature ? 'bg-soil text-bone' : 'bg-sage text-ink';
  const dividerClass = isFeature ? 'border-soil' : 'border-hairline';
  const priceClass = isFeature ? 'text-honey' : 'text-moss';
  const ctaClass = isFeature ? 'bg-honey text-ink' : 'bg-moss text-bone';

  return (
    <article className={`flex h-full flex-col gap-4 p-8 ${containerClass}`}>
      <div className="flex items-center justify-between">
        <div className="bg-honey px-2.5 py-1">
          <span className="text-ink font-sans text-[10px] font-semibold tracking-[0.06em]">
            {t('badge')}
          </span>
        </div>
        <span className={`font-mono text-[11px] ${scheduleClass}`}>{t('schedule')}</span>
      </div>

      <div>
        <h3 className={`font-serif text-2xl font-semibold leading-tight tracking-[-0.02em] ${titleClass}`}>
          {t('title_es')}
        </h3>
        <p className={`mt-0.5 font-sans text-[13px] italic ${subtitleClass}`}>{t('title_en')}</p>
      </div>

      <p className={`font-sans text-sm leading-relaxed ${bodyClass}`}>{t('body')}</p>

      <ul className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <li key={i} className={`px-2.5 py-1 ${tagBgClass}`}>
            <span className="font-sans text-[11px]">{tag}</span>
          </li>
        ))}
      </ul>

      <div className={`mt-auto flex items-center justify-between border-t pt-3.5 ${dividerClass}`}>
        <span className={`font-serif text-lg font-semibold ${priceClass}`}>{t('price')}</span>
        <a
          href={`/training/${id}`}
          className={`px-4 py-2.5 font-sans text-[13px] font-semibold ${ctaClass}`}
        >
          {cardT('enroll')}
        </a>
      </div>
    </article>
  );
}
