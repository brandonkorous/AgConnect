import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

type LockedCardProps = {
    title: string;
    description: string;
    cta: { label: string; href: string };
    hint?: string;
    className?: string;
};

export function LockedCard({ title, description, cta, hint, className }: LockedCardProps) {
    const isInternal = cta.href.startsWith('/');
    const ctaClass = 'btn btn-primary mt-6';

    return (
        <div
            className={[
                'mx-auto rounded-2xl border border-base-300 bg-base-100 p-8 text-center',
                className ?? '',
            ].join(' ')}
        >
            <FontAwesomeIcon icon={faLock} className="mx-auto mb-4 h-12 w-12 text-base-content/40" />
            <h3 className="font-display text-2xl font-light text-base-content">{title}</h3>
            <p className="mt-2 text-sm text-base-content/70">{description}</p>
            {hint && <p className="mt-2 text-xs text-base-content/50">{hint}</p>}
            {isInternal ? (
                <Link href={cta.href as Route} className={ctaClass}>
                    {cta.label}
                </Link>
            ) : (
                <a href={cta.href} className={ctaClass}>
                    {cta.label}
                </a>
            )}
        </div>
    );
}
