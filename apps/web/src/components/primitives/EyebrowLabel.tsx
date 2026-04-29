type Props = {
  children: React.ReactNode;
  tone?: 'soil' | 'moss' | 'honey' | 'bone';
  withRule?: boolean;
};

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  soil: 'text-soil',
  moss: 'text-moss',
  honey: 'text-honey',
  bone: 'text-bone/80',
};

const ruleBgClass: Record<NonNullable<Props['tone']>, string> = {
  soil: 'bg-soil',
  moss: 'bg-moss',
  honey: 'bg-honey',
  bone: 'bg-bone/40',
};

export function EyebrowLabel({ children, tone = 'soil', withRule = false }: Props) {
  if (withRule) {
    return (
      <div className="flex items-center gap-3.5">
        <div className={`h-px w-8 shrink-0 ${ruleBgClass[tone]}`} aria-hidden />
        <span className={`label ${toneClass[tone]}`}>{children}</span>
      </div>
    );
  }
  return <span className={`label ${toneClass[tone]}`}>{children}</span>;
}
