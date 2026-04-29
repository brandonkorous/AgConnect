import { useTranslations } from 'next-intl';

type Props = { id: '1' | '2' | '3' };

export function TestimonialCard({ id }: Props) {
  const t = useTranslations(`landing.testimonials.${id}`);
  const surface = t('surface');

  const isMoss = surface === 'moss';
  const isSage = surface === 'sage';

  const containerClass = isMoss
    ? 'bg-moss'
    : isSage
      ? 'bg-sage'
      : 'bg-white border-hairline border';
  const quoteMarkColor = isSage ? 'text-moss' : 'text-honey';
  const bodyClass = isMoss ? 'text-bone' : 'text-ink';
  const dividerClass = isMoss ? 'border-soil' : isSage ? 'border-hairline-warm' : 'border-hairline';
  const nameClass = isMoss ? 'text-bone' : 'text-ink';
  const roleClass = isMoss ? 'text-honey' : 'text-soil';
  const initialBg = isMoss ? 'bg-honey text-ink' : isSage ? 'bg-soil text-bone' : 'bg-moss text-bone';
  const name = t('name');
  const initial = name.trim().charAt(0);

  return (
    <article className={`flex h-full min-h-[420px] flex-col gap-6 p-10 ${containerClass}`}>
      <span
        className={`font-serif text-[108px] font-light leading-none italic tracking-[-0.04em] ${quoteMarkColor}`}
        aria-hidden
      >
        “
      </span>
      <p
        className={`font-serif text-[26px] font-medium leading-snug tracking-[-0.015em] ${bodyClass}`}
      >
        {t('quote')}
      </p>

      <div className={`mt-auto flex items-center gap-3.5 border-t pt-4 ${dividerClass}`}>
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-full font-serif text-xl font-semibold ${initialBg}`}
        >
          {initial}
        </span>
        <div className="flex flex-col gap-0.5">
          <p className={`font-sans text-[15px] font-semibold ${nameClass}`}>{name}</p>
          <p className={`font-sans text-[13px] ${roleClass}`}>{t('role')}</p>
        </div>
      </div>
    </article>
  );
}
