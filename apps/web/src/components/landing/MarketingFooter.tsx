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
        <footer className="bg-neutral text-neutral-content w-full">
            <div className="mx-auto flex flex-col gap-16 px-5 pt-20 pb-10 md:px-8 lg:px-20">
                <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] lg:gap-16">
                    <div className="col-span-2 flex flex-col gap-6 md:col-span-3 lg:col-span-1">
                        <Wordmark size="lg" tone="bone" />
                        <p className="text-accent font-serif text-xl font-medium leading-snug tracking-tight">
                            {t('tagline')}
                        </p>
                        <p className="text-neutral-content/70  font-sans text-sm leading-relaxed">
                            {t('description')}
                        </p>
                        <div className="flex flex-col gap-2 pt-2">
                            <p className="text-accent label">{t('counties_label')}</p>
                            <ul className="flex flex-wrap gap-1.5">
                                {counties.map((c) => (
                                    <li key={c}>
                                        <span className="badge badge-outline border-secondary text-neutral-content/70">
                                            {t(`counties.${c}`)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {cols.map((col) => (
                        <div key={col.key} className="flex flex-col gap-3.5">
                            <h3 className="text-accent label">{t(`col.${col.key}.title`)}</h3>
                            <ul className="menu menu-sm gap-2 p-0">
                                {col.items.map((item) => (
                                    <li key={item}>
                                        <a
                                            href={`#${item}`}
                                            className="text-neutral-content hover:text-accent hover:bg-transparent p-0"
                                        >
                                            {t(`col.${col.key}.${item}`)}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <FooterNewsletter />
                </div>

            </div>
            <FooterLegal />
        </footer>
    );
}
