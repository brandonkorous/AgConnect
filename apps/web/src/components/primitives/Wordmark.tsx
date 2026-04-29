type Props = {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'ink' | 'bone' | 'moss';
};

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-[32px] leading-none',
};

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  ink: 'text-ink',
  bone: 'text-bone',
  moss: 'text-moss',
};

export function Wordmark({ size = 'md', tone = 'ink' }: Props) {
  return (
    <div className="flex items-center gap-2">
      <SunMark tone={tone} size={size} />
      <span
        className={`font-serif font-semibold tracking-tight ${sizeClass[size]} ${toneClass[tone]}`}
      >
        AgConn
      </span>
    </div>
  );
}

function SunMark({ tone, size }: Required<Pick<Props, 'tone' | 'size'>>) {
  const px = size === 'sm' ? 18 : size === 'md' ? 24 : 32;
  const fill = tone === 'bone' ? '#EFE6D2' : tone === 'moss' ? '#2D4030' : '#1F1B14';
  const accent = '#C8A24A';
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="11" fill={fill} />
      <path
        d="M12 5.5 C15 7.5 16 11.5 15 14.5 C14 16.5 12 17.5 12 17.5 C12 17.5 10 16.5 9 14.5 C8 11.5 9 7.5 12 5.5Z"
        fill={accent}
      />
    </svg>
  );
}
