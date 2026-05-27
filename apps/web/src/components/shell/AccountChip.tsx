'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRightFromBracket,
    faArrowsLeftRight,
} from '@fortawesome/free-solid-svg-icons';
import { computeInitials } from './UserMenu';

type Props = {
    locale: string;
    labels: {
        ariaLabel: string;
        signedInAs: string;
        signOut: string;
        switchToField?: string;
        switchToWorker?: string;
    };
};

function computeSwitchHref(pathname: string): {
    href: string;
    target: 'field' | 'worker';
} | null {
    if (/^\/[a-z]{2}\/field\//.test(pathname)) {
        return { href: pathname.replace('/field/', '/worker/'), target: 'worker' };
    }
    if (/^\/[a-z]{2}\/worker\//.test(pathname)) {
        return { href: pathname.replace('/worker/', '/field/'), target: 'field' };
    }
    return null;
}

export function AccountChip({ locale, labels }: Props) {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useClerk();
    const pathname = usePathname() ?? '';
    const switchEntry = computeSwitchHref(pathname);
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

    if (!isLoaded) {
        return (
            <div
                aria-hidden
                className="bg-base-200 border-base-300 h-8 w-8 animate-pulse rounded-full border"
            />
        );
    }
    if (!isSignedIn || !user) return null;

    const email = user.primaryEmailAddress?.emailAddress ?? null;
    const phone = user.primaryPhoneNumber?.phoneNumber ?? null;
    const identifier = email ?? phone ?? '';
    const initials = computeInitials(
        user.firstName ?? undefined,
        user.lastName ?? undefined,
        email,
        phone,
    );

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={labels.ariaLabel}
                className="bg-primary text-primary-content grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-opacity hover:opacity-90"
            >
                {initials}
            </button>

            {open && (
                <div
                    role="menu"
                    className="bg-base-100 border-base-300 absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border shadow-lg"
                >
                    <div className="border-base-300 border-b px-4 py-3">
                        <div className="text-base-content/60 text-xs font-medium uppercase tracking-wider">
                            {labels.signedInAs}
                        </div>
                        <div className="text-base-content mt-1 truncate text-sm font-semibold">
                            {identifier}
                        </div>
                    </div>
                    {switchEntry &&
                        ((switchEntry.target === 'field' && labels.switchToField) ||
                            (switchEntry.target === 'worker' && labels.switchToWorker)) && (
                            <Link
                                href={switchEntry.href as Route}
                                onClick={() => setOpen(false)}
                                role="menuitem"
                                className="border-base-300 hover:bg-base-200 text-base-content/80 hover:text-base-content flex w-full items-center gap-2.5 border-b px-4 py-2.5 text-sm no-underline"
                            >
                                <FontAwesomeIcon
                                    icon={faArrowsLeftRight}
                                    className="text-base-content/50 h-3.5 w-3.5"
                                />
                                {switchEntry.target === 'field'
                                    ? labels.switchToField
                                    : labels.switchToWorker}
                            </Link>
                        )}
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
            )}
        </div>
    );
}
