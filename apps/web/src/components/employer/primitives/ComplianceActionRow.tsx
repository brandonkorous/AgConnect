'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { StatusBadge } from './StatusBadge';

type ComplianceActionRowProps = {
    severity: 'urgent' | 'soon';
    title: string;
    body: string;
    cta: { label: string; onClick?: () => void; href?: string };
    className?: string;
};

export function ComplianceActionRow({
    severity,
    title,
    body,
    cta,
    className,
}: ComplianceActionRowProps) {
    const alertClass =
        severity === 'urgent' ? 'alert alert-error alert-soft' : 'alert alert-warning alert-soft';
    const ctaClass = severity === 'urgent' ? 'btn btn-sm btn-error' : 'btn btn-sm btn-warning';
    const renderCta = () => {
        if (cta.href) {
            const isInternal = cta.href.startsWith('/');
            return isInternal ? (
                <Link href={cta.href as Route} className={ctaClass}>
                    {cta.label}
                </Link>
            ) : (
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
                alertClass,
                'flex flex-col items-start gap-3 rounded-2xl sm:flex-row sm:items-center sm:gap-4',
                className ?? '',
            ].join(' ')}
        >
            <div className="shrink-0">
                <StatusBadge
                    status={severity}
                    label={severity === 'urgent' ? 'URGENT' : 'SOON'}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-base-content">{title}</p>
                <p className="mt-0.5 text-sm text-base-content/70">{body}</p>
            </div>
            <div className="shrink-0">{renderCta()}</div>
        </div>
    );
}
