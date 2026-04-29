'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { LocaleToggle } from './LocaleToggle';

const links = [
  { href: '#workers', key: 'workers' },
  { href: '#employers', key: 'employers' },
  { href: '#training-orgs', key: 'training_orgs' },
  { href: '#how', key: 'how_it_works' },
  { href: '#pricing', key: 'pricing' },
  { href: '#faq', key: 'resources' },
] as const;

export function MobileMenu() {
  const t = useTranslations('landing.nav');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={t('menu_open')}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="text-ink hover:text-moss flex h-11 w-11 items-center justify-center md:hidden"
      >
        <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
      </button>
      {open && (
        <div className="bg-bone fixed inset-0 z-50 flex flex-col">
          <div className="flex items-center justify-between px-5 py-5">
            <LocaleToggle />
            <button
              type="button"
              aria-label={t('menu_close')}
              onClick={() => setOpen(false)}
              className="text-ink hover:text-moss flex h-11 w-11 items-center justify-center"
            >
              <FontAwesomeIcon icon={faXmark} className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-5 pt-8" aria-label="Main">
            <ul className="flex flex-col gap-7">
              {links.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-ink hover:text-moss font-serif text-3xl font-medium"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-3 px-5 pb-10">
            <a
              href="#final-cta"
              onClick={() => setOpen(false)}
              className="bg-moss text-bone py-4 text-center font-sans text-base font-semibold"
            >
              {t('cta_primary')}
            </a>
            <a
              href="#signin"
              onClick={() => setOpen(false)}
              className="border-moss text-moss border py-4 text-center font-sans text-base font-semibold"
            >
              {t('signin')}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
