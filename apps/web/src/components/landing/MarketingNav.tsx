import { useTranslations } from 'next-intl';
import { Wordmark } from '@/components/primitives/Wordmark';
import { MobileMenu } from './MobileMenu';

const links = [
    { href: '#workers', key: 'for_workers' },
    { href: '#employers', key: 'for_employers' },
    { href: '#how', key: 'how_it_works' },
    { href: '#pricing', key: 'pricing' },
] as const;

export function MarketingNav() {
    const t = useTranslations('landing.nav');

    return (
        <header className="border-secondary/15 bg-base-100 w-full border-b">
            <div className="mx-auto flex h-16 items-center justify-between px-5 md:h-24 md:px-8 lg:px-20">
                <a href="/" className="flex items-center" aria-label="AgConn home">
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
                    <a href="#signin" className="btn btn-ghost text-secondary hover:text-base-content">
                        {t('signin')}
                    </a>
                    <a href="#final-cta" className="btn btn-primary">
                        {t('cta_primary')}
                    </a>
                </div>
                <MobileMenu />
            </div>
        </header>
    );
}
