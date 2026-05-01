type Props = {
    eyebrow: string;
    headline: React.ReactNode;
    aside?: React.ReactNode;
    tone?: 'default' | 'inverse';
    align?: 'split' | 'stack';
    maxWidth?: string;
};

export function SectionHeader({
    eyebrow,
    headline,
    aside,
    tone = 'default',
    align = 'split',
    maxWidth = '[680px]',
}: Props) {
    const isInverse = tone === 'inverse';
    const ruleClass = isInverse ? 'bg-accent' : 'bg-secondary';
    const eyebrowClass = isInverse ? 'text-accent' : 'text-secondary';
    const headlineClass = isInverse ? 'text-base-content' : 'text-base-content';

    return (
        <div
            className={`flex gap-10 lg:gap-16 ${align === 'split' ? 'flex-col lg:flex-row lg:items-end lg:justify-between' : 'flex-col'
                }`}
        >
            <div className={`flex flex-col gap-4 ${maxWidth}`}>
                <div className="flex items-center gap-3.5">
                    <span className={`h-px w-8 shrink-0 ${ruleClass}`} aria-hidden />
                    <span className={`label ${eyebrowClass}`}>{eyebrow}</span>
                </div>
                <h2
                    className={`font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-6xl ${headlineClass}`}
                >
                    {headline}
                </h2>
            </div>
            {aside && <div className="lg:[420px] lg:pb-2">{aside}</div>}
        </div>
    );
}
