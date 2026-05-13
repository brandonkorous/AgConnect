import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCopy } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';

type Props = {
    eyebrow: string;
    titleA: string;
    titleB: string;
    summary: ReactNode;
    duplicateHref: string | null;
    duplicateLabel: string;
    duplicateEmptyTitle: string;
    newHref: string;
    newLabel: string;
};

export function JobsHeader({
    eyebrow,
    titleA,
    titleB,
    summary,
    duplicateHref,
    duplicateLabel,
    duplicateEmptyTitle,
    newHref,
    newLabel,
}: Props) {
    return (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
                    {eyebrow}
                </p>
                <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                    {titleA} <em className="text-primary not-italic font-light">{titleB}</em>
                </h1>
                <div className="text-base-content/70 mt-2 text-sm">{summary}</div>
            </div>
            <div className="flex gap-2">
                {duplicateHref ? (
                    <Link href={duplicateHref as Route} className="btn btn-sm rounded-full">
                        <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                        {duplicateLabel}
                    </Link>
                ) : (
                    <button
                        type="button"
                        disabled
                        title={duplicateEmptyTitle}
                        className="btn btn-sm rounded-full"
                    >
                        <FontAwesomeIcon icon={faCopy} className="h-3 w-3" />
                        {duplicateLabel}
                    </button>
                )}
                <Link href={newHref as Route} className="btn btn-sm btn-primary rounded-full">
                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                    {newLabel}
                </Link>
            </div>
        </header>
    );
}
