import { getTranslations } from 'next-intl/server';
import { OfflineRetryButton } from './retry-button';

export default async function OfflinePage() {
  const t = await getTranslations('shell.offline.page');
  return (
    <main className="bg-base-100 text-base-content flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-3xl font-medium tracking-tight">{t('title')}</h1>
      <p className="text-base-content/80 max-w-md text-base">{t('description')}</p>
      <OfflineRetryButton label={t('try_again')} />
    </main>
  );
}
