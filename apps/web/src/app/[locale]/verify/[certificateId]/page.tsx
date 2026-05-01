import { getTranslations } from 'next-intl/server';
import { PublicShell } from '@/components/public/PublicShell';

type Props = { params: Promise<{ locale: string; certificateId: string }> };

export default async function VerifyPage({ params }: Props) {
  const { locale, certificateId } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.verify' });
  return (
    <PublicShell locale={locale} title={t('title')}>
      <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-6 text-center">
        <p className="text-base-content/60 text-xs font-mono">{certificateId}</p>
        <p className="text-base-content/80">{t('coming_soon')}</p>
      </div>
    </PublicShell>
  );
}
