import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type EmptyStateCardProps = {
    icon?: IconDefinition;
    title: string;
    description?: string;
    cta?: { label: string; onClick?: () => void; href?: string };
    className?: string;
};

export function EmptyStateCard({ icon, title, description, cta, className }: EmptyStateCardProps) {
    const renderCta = () => {
        if (!cta) return null;
        const ctaClass = 'btn btn-sm btn-primary mt-4';
        if (cta.href) {
            const isInternal = cta.href.startsWith('/');
            if (isInternal) {
                return (
                    <Link href={cta.href as Route} className={ctaClass}>
                        {cta.label}
                    </Link>
                );
            }
            return (
                <a href={cta.href} className={ctaClass}>
                    {cta.label}
                </a>
            );
        }
        return (
            <button type="button" onClick={cta.onClick} className={ctaClass}>
                {cta.label}
            </button>
        );
    };

    return (
        <div
            className={[
                'rounded-2xl border-2 border-dashed border-base-300 bg-base-100 p-8 text-center',
                className ?? '',
            ].join(' ')}
        >
            {icon && (
                <FontAwesomeIcon icon={icon} className="mx-auto mb-3 h-10 w-10 text-base-content/40" />
            )}
            <p className="text-base font-semibold text-base-content">{title}</p>
            {description && <p className="mt-1 text-sm text-base-content/70">{description}</p>}
            {renderCta()}
        </div>
    );
}
