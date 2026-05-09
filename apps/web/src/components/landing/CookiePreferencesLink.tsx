'use client';

import { useConsent } from '@agconn/ui';

export function CookiePreferencesLink({ label }: { label: string }) {
    const { reset } = useConsent();
    return (
        <button
            type="button"
            onClick={reset}
            className="hover:text-neutral-content cursor-pointer underline-offset-2 hover:underline"
        >
            {label}
        </button>
    );
}
