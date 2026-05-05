import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

type Props = {
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason: string | null;
  locale: string;
};

export function VerificationBanner({ status, rejectionReason, locale }: Props) {
  const t = useTranslations('employer.verification');

  if (status === 'verified') return null;

  if (status === 'rejected') {
    return (
      <div className="container mx-auto px-5 pt-6 md:px-8 lg:px-20">
        <div role="alert" className="alert alert-error">
          <FontAwesomeIcon icon={faCircleXmark} className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t('rejected.title')}</div>
            {rejectionReason && (
              <div className="mt-1 text-sm">
                {t('rejected.reason', { reason: rejectionReason })}
              </div>
            )}
          </div>
          <Link
            href={`/${locale}/employer/profile`}
            className="btn btn-sm"
          >
            {t('rejected.cta')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 pt-6 md:px-8 lg:px-20">
      <div role="status" className="alert alert-warning">
        <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{t('pending.title')}</div>
          <div className="mt-1 text-sm">{t('pending.body')}</div>
        </div>
        <Link
          href={`/${locale}/employer/profile`}
          className="btn btn-sm btn-ghost"
        >
          {t('pending.edit')}
        </Link>
      </div>
    </div>
  );
}
