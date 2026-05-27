'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useLocale } from 'next-intl';
import type { CrewView } from '@/lib/api/hooks/employer-ops';

type Props = {
  crew: CrewView;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
};

export function CrewEditTrigger({ crew, className, ariaLabel, children }: Props) {
  const locale = useLocale();
  return (
    <Link
      href={`/${locale}/employer/crews/${crew.id}/edit` as Route}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </Link>
  );
}
