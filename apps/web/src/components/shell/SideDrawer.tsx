'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type Props = {
    open: boolean;
    onClose: () => void;
    /** Accessible label announced when the panel opens. */
    ariaLabel: string;
    children: React.ReactNode;
};

export function SideDrawer({ open, onClose, ariaLabel, children }: Props) {
    const pathname = usePathname();
    const lastPathnameRef = useRef(pathname);
    const panelRef = useRef<HTMLDivElement>(null);

    // Auto-close when the route changes — covers nav-item taps inside the
    // drawer without forcing every link to call onNavigate.
    useEffect(() => {
        if (lastPathnameRef.current !== pathname) {
            lastPathnameRef.current = pathname;
            if (open) onClose();
        }
    }, [pathname, open, onClose]);

    // ESC to close + lock body scroll while open.
    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        // Move focus to the panel for screen-reader continuity.
        panelRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    return (
        <>
            <div
                aria-hidden={!open}
                onClick={onClose}
                className={[
                    'bg-base-content/40 fixed inset-0 z-40 transition-opacity duration-200 md:hidden',
                    open ? 'opacity-100' : 'pointer-events-none opacity-0',
                ].join(' ')}
            />
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                className={[
                    'bg-base-100 fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col outline-none shadow-2xl transition-transform duration-200 ease-out md:hidden',
                    open ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
            >
                {children}
            </div>
        </>
    );
}
