import { useTranslations } from 'next-intl';

const avatars = [
  { initial: 'M', bg: 'bg-honey', fg: 'text-ink' },
  { initial: 'J', bg: 'bg-moss', fg: 'text-bone' },
  { initial: 'P', bg: 'bg-soil', fg: 'text-bone' },
  { initial: 'L', bg: 'bg-sage', fg: 'text-ink' },
];

export function HeroTrustStrip() {
  const t = useTranslations('landing.hero.trust');

  return (
    <div className="flex items-center gap-4 pt-4">
      <div className="flex items-center">
        {avatars.map((a, i) => (
          <div
            key={a.initial}
            className={`border-bone flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${a.bg} ${a.fg}`}
            style={{ marginLeft: i === 0 ? 0 : '-10px' }}
          >
            <span className="font-serif text-sm font-semibold italic">{a.initial}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M7 1 L9 5 L13 5.5 L10 8.5 L11 13 L7 11 L3 13 L4 8.5 L1 5.5 L5 5 Z"
                fill="#C8A24A"
              />
            </svg>
          ))}
          <span className="text-ink ml-1 font-sans text-[13px] font-semibold">{t('rating')}</span>
        </div>
        <p className="text-soil font-sans text-[13px] leading-snug">{t('line')}</p>
      </div>
    </div>
  );
}
