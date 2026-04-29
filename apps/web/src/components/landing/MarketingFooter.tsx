import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faLinkedinIn, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { Wordmark } from '@/components/primitives/Wordmark';
import { LocaleToggle } from './LocaleToggle';

const cols = [
  { key: 'workers', items: ['find_work', 'training', 'wallet', 'signin'] },
  { key: 'employers', items: ['post', 'pricing', 'flc', 'signin'] },
  { key: 'training', items: ['apply', 'reporting', 'resources'] },
  { key: 'company', items: ['about', 'contact', 'press', 'careers'] },
] as const;

const socials = [
  { icon: faXTwitter, href: 'https://x.com/agconn', label: 'X' },
  { icon: faLinkedinIn, href: 'https://linkedin.com/company/agconn', label: 'LinkedIn' },
  { icon: faFacebookF, href: 'https://facebook.com/agconn', label: 'Facebook' },
];

export function MarketingFooter() {
  const t = useTranslations('landing.footer');
  const legalT = useTranslations('landing.legal');

  return (
    <footer className="bg-ink text-bone w-full">
      <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-20 lg:px-20 lg:py-24">
        <div className="grid grid-cols-2 gap-10 pb-16 md:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-3 lg:col-span-1">
            <Wordmark size="lg" tone="bone" />
            <p className="text-bone/70 max-w-[280px] font-sans text-sm leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {cols.map((col) => (
            <FooterCol key={col.key} colKey={col.key} items={col.items as readonly string[]} />
          ))}
        </div>

        <div className="border-bone/15 flex flex-col items-start gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <LocaleToggle tone="bone" separator="·" />
            <p className="text-bone/60 font-sans text-sm">
              {t('nap.org')} · {t('nap.location')} ·{' '}
              <a className="hover:text-bone underline-offset-4 hover:underline" href={`mailto:${t('nap.email')}`}>
                {t('nap.email')}
              </a>
            </p>
          </div>
          <ul className="flex items-center gap-4">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  aria-label={s.label}
                  className="border-bone/30 text-bone/70 hover:text-bone hover:border-bone flex h-9 w-9 items-center justify-center border"
                >
                  <FontAwesomeIcon icon={s.icon} className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <FooterLegal />
    </footer>
  );
}

function FooterCol({ colKey, items }: { colKey: string; items: readonly string[] }) {
  const t = useTranslations(`landing.footer.col.${colKey}`);
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-bone font-serif text-lg font-medium italic">{t('title')}</h3>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item}>
            <a
              href={`#${item}`}
              className="text-bone/70 hover:text-bone font-sans text-sm underline-offset-4 hover:underline"
            >
              {t(item as never)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLegal() {
  const t = useTranslations('landing.legal');
  return (
    <div className="border-bone/15 border-t">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8 lg:px-20">
        <p className="text-bone/60 font-sans text-[13px]">
          {t('copyright')} · {t('built_in')}
        </p>
        <ul className="text-bone/60 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[13px]">
          <li>
            <a href="/privacy" className="hover:text-bone">
              {t('privacy.en')}
            </a>
          </li>
          <li>
            <a href="/terms" className="hover:text-bone">
              {t('terms.en')}
            </a>
          </li>
          <li>
            <a href="/accessibility" className="hover:text-bone">
              {t('accessibility')}
            </a>
          </li>
          <li>
            <a href="/privacidad" className="hover:text-bone">
              {t('privacy.es')}
            </a>
          </li>
          <li>
            <a href="/terminos" className="hover:text-bone">
              {t('terms.es')}
            </a>
          </li>
          <li>
            <a href="/sitemap.xml" className="hover:text-bone">
              {t('sitemap')}
            </a>
          </li>
          <li>
            <a href="/llms.txt" className="hover:text-bone">
              {t('llms_txt')}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
