'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useClerk } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronUp,
  faIdBadge,
  faUser,
  faCircleQuestion,
  faGlobe,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

type Props = {
  locale: string;
  profileHref: string;
  /** Optional second profile-style entry, e.g. employer's personal Clerk account distinct from the company profile. */
  accountHref?: string;
  helpHref?: string;
  name: string;
  subtext?: string;
  initials: string;
  labels: {
    profile: string;
    account?: string;
    help?: string;
    signOut: string;
    language: string;
    languageEn: string;
    languageEs: string;
  };
  /** Compact mode renders the trigger as a single row inside a small chip (employer top-of-sidebar style). */
  compact?: boolean;
};

export function UserMenu({
  locale,
  profileHref,
  accountHref,
  helpHref,
  name,
  subtext,
  initials,
  labels,
  compact = false,
}: Props) {
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const otherLocale: 'en' | 'es' = locale === 'es' ? 'en' : 'es';
  const localeSwitchHref = (() => {
    const segments = pathname.split('/');
    if (segments[1] === 'en' || segments[1] === 'es') {
      segments[1] = otherLocale;
      return segments.join('/') || `/${otherLocale}`;
    }
    return `/${otherLocale}${pathname}`;
  })();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          compact
            ? 'bg-base-200 border-base-300 hover:bg-base-300 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors'
            : 'bg-base-200 border-base-300 hover:bg-base-300 flex w-full items-center gap-2.5 rounded-2xl border p-3 text-left transition-colors'
        }
      >
        <div
          className={[
            'bg-primary text-primary-content grid shrink-0 place-items-center rounded font-bold',
            compact ? 'h-5 w-5 text-[9px]' : 'h-9 w-9 rounded-full text-xs',
          ].join(' ')}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={[
              'truncate font-semibold text-base-content',
              compact ? 'text-xs' : 'text-sm',
            ].join(' ')}
          >
            {name}
          </div>
          {!compact && subtext && (
            <div className="text-base-content/60 truncate text-xs">{subtext}</div>
          )}
        </div>
        <FontAwesomeIcon
          icon={faChevronUp}
          className={[
            'text-base-content/40 transition-transform',
            compact ? 'h-2.5 w-2.5' : 'h-3 w-3',
            open ? '' : 'rotate-180',
          ].join(' ')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={[
            'bg-base-100 border-base-300 absolute z-30 w-64 overflow-hidden rounded-2xl border shadow-lg',
            compact ? 'left-0 top-full mt-2' : 'bottom-full left-0 mb-2',
          ].join(' ')}
        >
          <div className="border-base-300 border-b px-4 py-3">
            <div className="text-base-content truncate text-sm font-semibold">{name}</div>
            {subtext && (
              <div className="text-base-content/60 truncate text-xs">{subtext}</div>
            )}
          </div>

          <ul className="flex flex-col py-1">
            <li>
              <Link
                href={profileHref as Route}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="hover:bg-base-200 text-base-content/80 hover:text-base-content flex items-center gap-2.5 px-4 py-2 text-sm"
              >
                <FontAwesomeIcon
                  icon={faIdBadge}
                  className="text-base-content/50 h-3.5 w-3.5"
                />
                {labels.profile}
              </Link>
            </li>
            {accountHref && labels.account && (
              <li>
                <Link
                  href={accountHref as Route}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="hover:bg-base-200 text-base-content/80 hover:text-base-content flex items-center gap-2.5 px-4 py-2 text-sm"
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-base-content/50 h-3.5 w-3.5"
                  />
                  {labels.account}
                </Link>
              </li>
            )}
            {helpHref && labels.help && (
              <li>
                <Link
                  href={helpHref as Route}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="hover:bg-base-200 text-base-content/80 hover:text-base-content flex items-center gap-2.5 px-4 py-2 text-sm"
                >
                  <FontAwesomeIcon
                    icon={faCircleQuestion}
                    className="text-base-content/50 h-3.5 w-3.5"
                  />
                  {labels.help}
                </Link>
              </li>
            )}
            <li>
              <Link
                href={localeSwitchHref as Route}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="hover:bg-base-200 text-base-content/80 hover:text-base-content flex items-center gap-2.5 px-4 py-2 text-sm"
              >
                <FontAwesomeIcon
                  icon={faGlobe}
                  className="text-base-content/50 h-3.5 w-3.5"
                />
                <span className="flex-1">{labels.language}</span>
                <span className="text-base-content/55 font-mono text-[10px] uppercase">
                  {locale === 'es' ? labels.languageEs : labels.languageEn}
                  {' → '}
                  {locale === 'es' ? labels.languageEn : labels.languageEs}
                </span>
              </Link>
            </li>
          </ul>

          <div className="border-base-300 border-t">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut({ redirectUrl: `/${locale}` });
              }}
              className="hover:bg-base-200 text-error/90 hover:text-error flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-3.5 w-3.5" />
              {labels.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function computeInitials(
  first?: string,
  last?: string,
  email?: string | null,
  phone?: string | null,
): string {
  const f = (first ?? '')[0];
  const l = (last ?? '')[0];
  if (f || l) return `${f ?? ''}${l ?? ''}`.toUpperCase() || '·';
  if (email) return email[0]?.toUpperCase() ?? '·';
  if (phone) return phone[1]?.toUpperCase() ?? '·';
  return '·';
}
