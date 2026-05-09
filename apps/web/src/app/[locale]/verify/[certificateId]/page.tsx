import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { PublicShell } from '@/components/public/PublicShell';
import { getPublicCert } from '@/lib/api/landing';

type Props = { params: Promise<{ locale: string; certificateId: string }> };

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }: Props) {
  const { locale, certificateId } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.verify' });
  const cert = await getPublicCert(certificateId);

  if (!cert || !cert.valid) {
    return (
      <PublicShell locale={locale} title={t('title')}>
        <div className="border-base-300 bg-base-100 grid gap-3 rounded-2xl border p-8 text-center">
          <FontAwesomeIcon icon={faCircleXmark} className="text-secondary mx-auto h-8 w-8" />
          <p className="text-base-content/80">{t('not_found')}</p>
          <p className="text-base-content/60 font-mono text-xs">{certificateId}</p>
        </div>
      </PublicShell>
    );
  }

  const title = locale === 'es' ? cert.programTitleEs : cert.programTitleEn;
  const workerName = `${cert.workerFirstName} ${cert.workerLastInitial}.`.trim();

  return (
    <PublicShell locale={locale} title={t('title')}>
      <div className="grid gap-4">
        <div className="border-success/30 bg-success/10 text-success flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold">
          <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4" />
          <span>{t('valid_badge')}</span>
        </div>

        <div className="bg-primary text-primary-content relative overflow-hidden rounded-3xl p-10">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 100% at 100% 0%, rgba(245,158,11,0.28), transparent 60%)',
            }}
          />
          <div className="relative">
            <div className="flex items-start justify-between">
              <FontAwesomeIcon icon={faAward} className="h-12 w-12 opacity-90" />
              <div className="text-right">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] opacity-75">
                  {t('cert_id')}
                </div>
                <div className="font-mono text-[13px] font-bold">{cert.certificateId}</div>
              </div>
            </div>

            <div className="mt-12">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] opacity-75">
                {t('certificate_of_completion')}
              </div>
              <h2 className="font-serif mt-3 text-[36px] leading-tight tracking-[-0.025em]">
                {title}
              </h2>
              <div className="mt-6 grid gap-3 border-t border-white/20 pt-6 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="opacity-75">{t('issued_to')}</span>
                  <span className="font-semibold">{workerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">{t('issued_by')}</span>
                  <span className="font-semibold">{cert.org}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">{t('funded_by')}</span>
                  <span className="font-semibold">{cert.funder}</span>
                </div>
                {cert.completedAt && (
                  <div className="flex items-center justify-between">
                    <span className="opacity-75">{t('completed')}</span>
                    <span className="font-mono font-semibold">{cert.completedAt}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-base-content/60 px-2 text-xs leading-relaxed">{t('footnote')}</p>
      </div>
    </PublicShell>
  );
}
