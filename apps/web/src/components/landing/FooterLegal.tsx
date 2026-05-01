import { useTranslations } from 'next-intl';

const links = [
  { key: 'privacy_en', href: '/privacy' },
  { key: 'terms_en', href: '/terms' },
  { key: 'accessibility', href: '/accessibility' },
  { key: 'privacy_es', href: '/privacidad' },
  { key: 'terms_es', href: '/terminos' },
  { key: 'sitemap', href: '/sitemap.xml' },
  { key: 'llms_txt', href: '/llms.txt' },
] as const;

export function FooterLegal() {
  const t = useTranslations('landing.legal');

  return (
    <div className="bg-neutral text-neutral-content w-full">
      <div className="mx-auto flex flex-col items-start gap-3 px-5 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 lg:px-20">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-content/60 text-xs">
          <span>{t('copyright')}</span>
          <span aria-hidden className="opacity-60">|</span>
          <span>{t('built_in')}</span>
          <span aria-hidden className="opacity-60">|</span>
          <span className="badge badge-success badge-sm gap-1.5 border-0">
            <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
            <span>{t('status')}</span>
          </span>
        </div>
        <ul className="text-neutral-content/60 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {links.map((l) => (
            <li key={l.key}>
              <a href={l.href} className="hover:text-neutral-content">
                {t(l.key)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
