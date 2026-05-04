import Link from 'next/link';
import type { Route } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

type Props = {
  variant?: 'primary' | 'ghost' | 'cta';
};

export async function NewCrewButton({ variant = 'ghost' }: Props) {
  const t = await getTranslations('employer.crews');
  const locale = await getLocale();

  const className =
    variant === 'primary'
      ? 'btn btn-sm btn-primary rounded-full'
      : variant === 'cta'
        ? 'btn btn-primary rounded-full'
        : 'btn btn-sm bg-base-100 border-base-300 rounded-full border font-medium';

  return (
    <Link href={`/${locale}/employer/crews/new` as Route} className={className}>
      <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
      {t('new_crew_label')}
    </Link>
  );
}
