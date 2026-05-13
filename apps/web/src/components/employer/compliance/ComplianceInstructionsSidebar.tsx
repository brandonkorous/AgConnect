'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import type { ComplianceInstructionsView } from '@/lib/api/employer-ops';

type Props = {
    instructions: ComplianceInstructionsView | null;
};

export function ComplianceInstructionsSidebar({ instructions }: Props) {
    const t = useTranslations('employer.compliance.instructions');

    if (!instructions || !instructions.why) {
        return (
            <p className="text-base-content/60 text-xs leading-relaxed">{t('empty_neutral')}</p>
        );
    }

    return (
        <div className="space-y-5 text-sm">
            <Section heading={t('why')}>
                <p className="text-base-content/80 leading-relaxed">{instructions.why}</p>
            </Section>

            {instructions.how.length > 0 && (
                <Section heading={t('how')}>
                    <ol className="text-base-content/80 list-decimal space-y-1.5 pl-4 leading-relaxed">
                        {instructions.how.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>
                </Section>
            )}

            {instructions.acceptableEvidence.length > 0 && (
                <Section heading={t('acceptable_evidence')}>
                    <ul className="text-base-content/80 list-disc space-y-1 pl-4 leading-relaxed">
                        {instructions.acceptableEvidence.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </Section>
            )}

            {instructions.deadline && (
                <Section heading={t('deadline')}>
                    <p className="text-base-content/80 leading-relaxed">{instructions.deadline}</p>
                </Section>
            )}

            <Section heading={t('source')}>
                <ul className="space-y-1.5">
                    <li>
                        <SourceLink label={instructions.source.label} url={instructions.source.url} />
                    </li>
                    {instructions.extraSources?.map((s, i) => (
                        <li key={i}>
                            <SourceLink label={s.label} url={s.url} />
                        </li>
                    ))}
                </ul>
                <p className="text-base-content/55 mt-2 text-xs tabular-nums">
                    {t('last_verified', { date: instructions.lastVerified })}
                </p>
            </Section>
        </div>
    );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
    return (
        <section>
            <h3 className="text-base-content/60 mb-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
                {heading}
            </h3>
            {children}
        </section>
    );
}

function SourceLink({ label, url }: { label: string; url: string }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-baseline gap-1 leading-relaxed"
        >
            <span>{label}</span>
            <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                className="h-2.5 w-2.5 shrink-0 self-center"
            />
        </a>
    );
}
