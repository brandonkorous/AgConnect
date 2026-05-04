import Link from 'next/link';
import type { Route } from 'next';
import { getLocale } from 'next-intl/server';
import type { CrewView } from '@/lib/api/employer-ops';

type Props = {
  crew: CrewView;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
};

// Server component: links to the full-page crew editor. The previous modal
// trigger is gone — every crew edit now happens at /employer/crews/:id/edit
// so the workflow matches the design template.
export async function CrewEditTrigger({ crew, className, ariaLabel, children }: Props) {
  const locale = await getLocale();
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
