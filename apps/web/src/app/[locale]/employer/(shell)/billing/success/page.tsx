import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

type Props = { params: Promise<{ locale: string }> };

export default async function BillingSuccessPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.billing.success' });
  const tBilling = await getTranslations({ locale, namespace: 'employer.billing' });

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mx-auto max-w-md">
        <div className="bg-base-100 border-base-300 rounded-2xl border p-8 text-center">
          <div className="bg-success/10 text-success mx-auto grid h-12 w-12 place-items-center rounded-full">
            <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
          </div>
          <h1 className="font-display mt-4 text-2xl font-light">{t('title')}</h1>
          <p className="text-base-content/70 mt-2 text-sm">{t('body', { plan: tBilling('pro') })}</p>
          <Link href={`/${locale}/employer/dashboard`} className="btn btn-primary mt-6">
            {t('cta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
