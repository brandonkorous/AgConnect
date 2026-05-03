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
      <div role="alert" className="border-error/30 bg-error/5 mx-8 mt-6 flex items-start gap-3 rounded-xl border p-4">
        <FontAwesomeIcon icon={faCircleXmark} className="text-error mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-base-content text-sm font-semibold">
            {t('rejected.title')}
          </div>
          {rejectionReason && (
            <div className="text-base-content/70 mt-1 text-sm">
              {t('rejected.reason', { reason: rejectionReason })}
            </div>
          )}
        </div>
        <Link
          href={`/${locale}/employer/profile`}
          className="btn btn-sm btn-error"
        >
          {t('rejected.cta')}
        </Link>
      </div>
    );
  }

  return (
    <div role="status" className="border-warning/30 bg-warning/5 mx-8 mt-6 flex items-start gap-3 rounded-xl border p-4">
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-base-content text-sm font-semibold">{t('pending.title')}</div>
        <div className="text-base-content/70 mt-1 text-sm">{t('pending.body')}</div>
      </div>
      <Link
        href={`/${locale}/employer/profile`}
        className="btn btn-sm btn-ghost border-warning/30 border"
      >
        {t('pending.edit')}
      </Link>
    </div>
  );
}
