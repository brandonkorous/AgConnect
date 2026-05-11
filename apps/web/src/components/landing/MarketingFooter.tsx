import { useLocale, useTranslations } from 'next-intl';
import { Wordmark } from '@/components/primitives/Wordmark';
import { FooterNewsletter } from './FooterNewsletter';
import { FooterLegal } from './FooterLegal';
import { SmsOptInCallout } from './SmsOptInCallout';

const counties = ['fresno', 'tulare', 'kern', 'kings', 'madera'] as const;

type ColumnItem = { key: string; href: string };
type Column = { key: string; items: ColumnItem[] };

function buildColumns(locale: string): Column[] {
    return [
        {
            key: 'workers',
            items: [
                { key: 'browse', href: `/${locale}/jobs` },
                { key: 'training', href: `/${locale}/training` },
                { key: 'wallet', href: `/${locale}/skills-wallet` },
                { key: 'rights', href: `/${locale}/worker-rights` },
                { key: 'promotora', href: `/${locale}/promotora` },
                { key: 'signin', href: `/${locale}/sign-in` },
            ],
        },
        {
            key: 'employers',
            items: [
                { key: 'post', href: `/${locale}/employer/sign-up` },
                { key: 'search', href: `/${locale}/employers#worker-search` },
                { key: 'flc', href: `/${locale}/employers#flc-verification` },
                { key: 'pricing', href: `/${locale}/#pricing` },
                { key: 'stories', href: `/${locale}/#testimonials` },
                { key: 'sales', href: 'mailto:sales@agconn.com' },
            ],
        },
        {
            key: 'partners',
            items: [
                { key: 'training_orgs', href: `/${locale}/partners#training-orgs` },
                { key: 'workforce', href: `/${locale}/partners#workforce-boards` },
                { key: 'wioa', href: `/${locale}/partners#wioa-exports` },
                { key: 'impact', href: `/${locale}/impact` },
                { key: 'press', href: `/${locale}/press` },
                { key: 'research', href: `/${locale}/impact#methodology` },
            ],
        },
        {
            key: 'company',
            items: [
                { key: 'about', href: `/${locale}/about` },
                { key: 'mission', href: `/${locale}/about#mission` },
                { key: 'careers', href: `/${locale}/careers` },
                { key: 'trust', href: `/${locale}/trust` },
                { key: 'status', href: `/${locale}/trust#status` },
                { key: 'contact', href: `/${locale}/contact` },
            ],
        },
    ];
}

export function MarketingFooter() {
    const t = useTranslations('landing.footer');
    const locale = useLocale();
    const cols = buildColumns(locale);

    return (
        <footer className="bg-neutral text-neutral-content w-full">
            <SmsOptInCallout locale={locale as 'en' | 'es'} variant="footer" />
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
                            <p className="text-accent eyebrow">{t('counties_label')}</p>
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
                            <h3 className="text-accent eyebrow">{t(`col.${col.key}.title`)}</h3>
                            <ul className="menu menu-sm gap-2 p-0">
                                {col.items.map((item) => (
                                    <li key={item.key}>
                                        <a
                                            href={item.href}
                                            className="text-neutral-content hover:text-accent hover:bg-transparent p-0"
                                        >
                                            {t(`col.${col.key}.${item.key}`)}
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
