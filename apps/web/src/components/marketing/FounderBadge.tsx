'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import type { FounderSlots } from '@/lib/api/landing';

type Props = {
    slots: FounderSlots;
    activeLabel: string;
    endedLabel: string;
};

export function FounderBadge({ slots, activeLabel, endedLabel }: Props) {
    if (slots.total === 0) return null;

    if (!slots.active) {
        return (
            <div className="self-start inline-flex items-center gap-2 bg-base-100 border border-secondary/30 px-4 py-2">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-secondary">
                    {endedLabel}
                </span>
            </div>
        );
    }

    return (
        <div className="self-start inline-flex items-center gap-2 bg-primary text-primary-content px-4 py-2">
            <FontAwesomeIcon icon={faCircle} className="text-accent text-[8px]" />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.22em]">
                {activeLabel}
            </span>
        </div>
    );
}
