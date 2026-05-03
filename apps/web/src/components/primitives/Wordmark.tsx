type Props = {
    size?: 'sm' | 'md' | 'lg';
    tone?: 'ink' | 'bone' | 'moss';
};

const sizeClass: Record<NonNullable<Props['size']>, string> = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl leading-none',
};

const toneClass: Record<NonNullable<Props['tone']>, string> = {
    ink: 'text-base-content',
    bone: 'text-neutral-content',
    moss: 'text-primary',
};

export function Wordmark({ size = 'md', tone = 'ink' }: Props) {
    return (
        <span className={`inline-flex items-center gap-2 ${toneClass[tone]}`}>
            {/* <SunMark size={size} /> */}
            <span className={`font-serif font-semibold tracking-tight ${sizeClass[size]}`}>
                AG<span className={`${toneClass[tone]}/50`}>CONN</span>
            </span>
        </span>
    );
}

function SunMark({ size }: Required<Pick<Props, 'size'>>) {
    const px = size === 'sm' ? 18 : size === 'md' ? 24 : 32;
    return (
        <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <circle cx="12" cy="12" r="11" fill="currentColor" />
            <path
                d="M12 5.5 C15 7.5 16 11.5 15 14.5 C14 16.5 12 17.5 12 17.5 C12 17.5 10 16.5 9 14.5 C8 11.5 9 7.5 12 5.5Z"
                className="text-accent"
                fill="currentColor"
            />
        </svg>
    );
}
