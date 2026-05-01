type Props = {
    children: React.ReactNode;
    tone?: 'soil' | 'moss' | 'honey' | 'bone';
    withRule?: boolean;
};

const toneClass: Record<NonNullable<Props['tone']>, string> = {
    soil: 'text-secondary',
    moss: 'text-primary',
    honey: 'text-accent',
    bone: 'text-base-content/80',
};

const ruleBgClass: Record<NonNullable<Props['tone']>, string> = {
    soil: 'bg-secondary',
    moss: 'bg-primary',
    honey: 'bg-accent',
    bone: 'bg-neutral-content/40',
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
