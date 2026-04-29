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
  maxWidth = 'max-w-[680px]',
}: Props) {
  const isInverse = tone === 'inverse';
  const ruleClass = isInverse ? 'bg-honey' : 'bg-soil';
  const eyebrowClass = isInverse ? 'text-honey' : 'text-soil';
  const headlineClass = isInverse ? 'text-bone' : 'text-ink';

  return (
    <div
      className={`flex gap-10 lg:gap-16 ${
        align === 'split' ? 'flex-col lg:flex-row lg:items-end lg:justify-between' : 'flex-col'
      }`}
    >
      <div className={`flex flex-col gap-4 ${maxWidth}`}>
        <div className="flex items-center gap-3.5">
          <span className={`h-px w-8 shrink-0 ${ruleClass}`} aria-hidden />
          <span className={`label ${eyebrowClass}`}>{eyebrow}</span>
        </div>
        <h2
          className={`font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px] ${headlineClass}`}
        >
          {headline}
        </h2>
      </div>
      {aside && <div className="lg:max-w-[420px] lg:pb-2">{aside}</div>}
    </div>
  );
}
