import Link from 'next/link';

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  className?: string;
};

export function OnboardingNavButton({
  href,
  children,
  variant = 'primary',
  disabled = false,
  className,
}: Props) {
  const base =
    variant === 'primary'
      ? 'btn btn-primary btn-lg w-full'
      : 'btn btn-ghost btn-lg w-full';
  if (disabled) {
    return (
      <button type="button" className={`${base} ${className ?? ''}`} disabled>
        {children}
      </button>
    );
  }
  return (
    <Link href={href} className={`${base} ${className ?? ''}`}>
      {children}
    </Link>
  );
}
