'use client';

// Sticky alert that lists every invalid/missing field grouped by section,
// each with a link that scrolls to the section.

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { groupBySection, type FieldError } from './validation';

type Props = {
    errors: FieldError[];
    onDismiss?: () => void;
};

export function ValidationSummary({ errors }: Props) {
    const t = useTranslations('employer.jobs.form_v2');
    if (errors.length === 0) return null;

    const grouped = groupBySection(errors);
    const total = errors.length;

    return (
        <div role="alert" aria-live="polite" className="alert alert-error alert-soft mb-5 items-start">
            <FontAwesomeIcon icon={faCircleExclamation} className="text-error mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
                <div className="text-base-content text-sm font-semibold">
                    {t('validation_summary_title', { count: total })}
                </div>
                <p className="text-base-content/70 mt-0.5 text-xs">
                    {t('validation_summary_body')}
                </p>
                <ul className="mt-3 space-y-2.5">
                    {Array.from(grouped.entries()).map(([sectionKey, sectionErrors]) => (
                        <li key={sectionKey}>
                            <a
                                href={sectionErrors[0]!.sectionHref}
                                className="text-base-content/55 hover:text-base-content font-mono text-[10px] font-bold uppercase tracking-[0.08em] no-underline"
                            >
                                {t(`section_${sectionKey}_title`)}
                            </a>
                            <ul className="mt-1 space-y-1">
                                {sectionErrors.map((e) => (
                                    <li key={e.path} className="flex items-baseline gap-2 text-sm">
                                        <a
                                            href={e.sectionHref}
                                            className="text-error hover:text-error font-medium underline-offset-2 hover:underline"
                                        >
                                            {t(e.labelKey)}
                                        </a>
                                        <span className="text-base-content/65 text-xs">
                                            — {t(`validation_reason_${e.reason}`)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
