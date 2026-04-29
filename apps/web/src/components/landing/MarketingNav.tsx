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
    <header className="border-soil/15 bg-bone w-full border-b">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:h-[93px] md:px-8 lg:px-20">
        <a href="/" className="flex items-center" aria-label="AgConn home">
          <Wordmark size="lg" tone="ink" />
        </a>
        <nav className="hidden lg:block" aria-label="Main">
          <ul className="text-soil flex items-center gap-6 font-sans text-[15px] font-medium whitespace-nowrap">
            {links.map((link) => (
              <li key={link.key}>
                <a href={link.href} className="hover:text-ink underline-offset-4 hover:underline">
                  {t(link.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <a
            href="#signin"
            className="text-soil hover:text-ink font-sans text-[15px] font-medium whitespace-nowrap"
          >
            {t('signin')}
          </a>
          <a
            href="#final-cta"
            className="bg-moss text-bone hover:bg-ink px-4 py-2.5 font-sans text-[15px] font-semibold whitespace-nowrap"
          >
            {t('cta_primary')}
          </a>
        </div>
        <MobileMenu />
      </div>
    </header>
  );
}
