import { useTranslations } from 'next-intl';
import { Wordmark } from '@/components/primitives/Wordmark';
import { FooterNewsletter } from './FooterNewsletter';
import { FooterLegal } from './FooterLegal';

const counties = ['fresno', 'tulare', 'kern', 'kings', 'madera'] as const;

const cols = [
  { key: 'workers', items: ['browse', 'training', 'wallet', 'rights', 'promotora', 'signin'] },
  { key: 'employers', items: ['post', 'search', 'flc', 'pricing', 'stories', 'sales'] },
  { key: 'partners', items: ['training_orgs', 'workforce', 'wioa', 'impact', 'press', 'research'] },
  { key: 'company', items: ['about', 'mission', 'careers', 'trust', 'status', 'contact'] },
] as const;

export function MarketingFooter() {
  const t = useTranslations('landing.footer');

  return (
    <footer className="bg-ink text-bone w-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 pt-20 pb-10 md:px-8 lg:px-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] lg:gap-16">
          <div className="col-span-2 flex flex-col gap-6 md:col-span-3 lg:col-span-1">
            <Wordmark size="lg" tone="bone" />
            <p className="text-honey max-w-[380px] font-serif text-[22px] leading-snug italic tracking-[-0.015em]">
              {t('tagline')}
            </p>
            <p className="text-sage max-w-[380px] font-sans text-sm leading-relaxed">
              {t('description')}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <p className="text-honey label">{t('counties_label')}</p>
              <ul className="flex flex-wrap gap-1.5">
                {counties.map((c) => (
                  <li key={c} className="border-soil border px-2.5 py-1">
                    <span className="text-sage font-sans text-xs">{t(`counties.${c}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {cols.map((col) => (
            <div key={col.key} className="flex flex-col gap-3.5">
              <h3 className="text-honey label">{t(`col.${col.key}.title`)}</h3>
              <ul className="flex flex-col gap-3.5">
                {col.items.map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item}`}
                      className="text-bone hover:text-honey font-sans text-sm"
                    >
                      {t(`col.${col.key}.${item}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <FooterNewsletter />
      </div>
      <FooterLegal />
    </footer>
  );
}
