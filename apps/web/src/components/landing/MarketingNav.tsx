import { useLocale, useTranslations } from 'next-intl';
import { Wordmark } from '@/components/primitives/Wordmark';
import { MobileMenu } from './MobileMenu';

export function MarketingNav() {
    const t = useTranslations('landing.nav');
    const brandT = useTranslations('brand');
    const locale = useLocale();

    const links = [
        { href: `/${locale}/workers`, key: 'for_workers' },
        { href: `/${locale}/employers`, key: 'for_employers' },
        { href: `/${locale}/how-it-works`, key: 'how_it_works' },
        { href: `/${locale}/pricing`, key: 'pricing' },
    ];

    return (
        <header className="border-secondary/15 bg-base-100 w-full border-b">
            <div className="mx-auto flex h-16 items-center justify-between px-5 md:h-24 md:px-8 lg:px-20">
                <a href={`/${locale}`} className="flex items-center" aria-label={`${brandT('product_name')} home`}>
                    <Wordmark size="lg" tone="ink" />
                </a>
                <nav className="hidden lg:block" aria-label="Main">
                    <ul className="menu menu-horizontal gap-2 px-0">
                        {links.map((link) => (
                            <li key={link.key}>
                                <a href={link.href} className="text-secondary hover:text-base-content hover:bg-transparent text-base font-medium">
                                    {t(link.key)}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="hidden items-center gap-2 md:flex">
                    <a href={`/${locale}/sign-in`} className="btn btn-ghost text-secondary hover:text-base-content">
                        {t('signin')}
                    </a>
                    <a href={`/${locale}/worker/sign-up`} className="btn btn-primary">
                        {t('cta_primary')}
                    </a>
                </div>
                <MobileMenu />
            </div>
        </header>
    );
}
