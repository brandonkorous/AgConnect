import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { fetchWallet } from '@/lib/api/wallet';

type Props = { params: Promise<{ locale: string }> };

export default async function WalletPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.wallet' });
  const items = await fetchWallet();

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <WorkerPageHeader title={t('title')} />
      {items.length === 0 ? (
        <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-8 text-center">
          <p className="font-serif text-xl font-semibold">{t('empty.title')}</p>
          <p className="text-base-content/70">{t('empty.body')}</p>
          <Link
            href={`/${locale}/training`}
            className="btn btn-primary btn-sm justify-self-center"
          >
            {t('empty.cta')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-base-content/60 text-sm">
            {t('count', { count: items.length })}
          </p>
          {items.map((item) => (
            <article
              key={item.id}
              className="border-base-300 grid gap-2 rounded-2xl border bg-white p-5"
            >
              <div className="flex items-center gap-2">
                {item.source === 'enrollment' ? (
                  <span className="text-warning inline-flex items-center gap-1 text-xs font-semibold uppercase">
                    <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
                    {t('source.agconn')}
                  </span>
                ) : (
                  <span className="text-base-content/60 text-xs font-semibold uppercase">
                    {t('source.self')}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-lg font-semibold">
                {item.source === 'enrollment'
                  ? locale === 'es'
                    ? item.programTitleEs
                    : item.programTitleEn
                  : item.name}
              </h3>
              <p className="text-base-content/60 text-sm">
                {item.source === 'enrollment'
                  ? `${item.funder} · ${item.orgName} · ${item.completedAt}`
                  : `${item.issuer ?? '—'} · ${item.issuedAt ?? '—'}`}
              </p>
              {item.source === 'enrollment' && (
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/${locale}/worker/wallet/cert/${item.id}`}
                    className="btn btn-outline btn-sm"
                  >
                    {t('card.download')}
                  </Link>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
