import Link from 'next/link';
import type { Route } from 'next';
import type { ShiftView } from '@/lib/api/hooks/employer-ops';

type Props = {
  shift: ShiftView;
  locale: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
};

// Renders a cell as an anchor that navigates to the full Edit Shift page.
// Replaces the prior modal-based trigger so the design template's full
// route layout is used instead of an in-place pop-over.
export function ShiftEditTrigger({ shift, locale, className, ariaLabel, children }: Props) {
  return (
    <Link
      href={`/${locale}/employer/crews/shifts/${shift.id}/edit` as Route}
      aria-label={ariaLabel}
      className={['block w-full cursor-pointer', className].filter(Boolean).join(' ')}
    >
      {children}
    </Link>
  );
}
