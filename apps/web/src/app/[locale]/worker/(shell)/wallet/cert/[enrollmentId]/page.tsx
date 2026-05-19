import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faAward } from '@fortawesome/free-solid-svg-icons';
import { fetchCert } from '@/lib/api/wallet';
import { PrintCertButton } from '@/components/worker/PrintCertButton';

type Props = { params: Promise<{ locale: string; enrollmentId: string }> };

export default async function CertPreviewPage({ params }: Props) {
    const { locale, enrollmentId } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.wallet.cert' });
    const cert = await fetchCert(enrollmentId);
    if (!cert) notFound();

    const title = locale === 'es' ? cert.programTitleEs : cert.programTitleEn;

    return (
        <div className="px-6 pb-16 pt-8 lg:px-8">
            <Link
                href={`/${locale}/worker/wallet`}
                className="text-base-content/70 hover:text-base-content mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium print:hidden"
            >
                <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
                {locale === 'es' ? 'Volver' : 'Back'}
            </Link>

            <div className="bg-primary text-primary-content relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-10 print:rounded-none print:shadow-none">
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
                            <div className="font-mono text-xs uppercase tracking-[0.18em] opacity-75">
                                {locale === 'es' ? 'ID DE CERT' : 'CERT ID'}
                            </div>
                            <div className="font-mono text-[13px] font-bold">
                                {cert.certificateId ?? '—'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <div className="font-mono text-xs uppercase tracking-[0.18em] opacity-75">
                            {locale === 'es' ? 'CERTIFICADO DE FINALIZACIÓN' : 'CERTIFICATE OF COMPLETION'}
                        </div>
                        <h1 className="font-serif mt-3 text-[44px] leading-tight tracking-[-0.025em]">
                            {title}
                        </h1>
                        <div className="mt-6 grid gap-3 border-t border-white/20 pt-6 text-[13px]">
                            <div className="flex items-center justify-between">
                                <span className="opacity-75">
                                    {locale === 'es' ? 'Emitido por' : 'Issued by'}
                                </span>
                                <span className="font-semibold">{cert.org.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="opacity-75">
                                    {locale === 'es' ? 'Financiado por' : 'Funded by'}
                                </span>
                                <span className="font-semibold">{cert.funder}</span>
                            </div>
                            {cert.completedAt && (
                                <div className="flex items-center justify-between">
                                    <span className="opacity-75">
                                        {locale === 'es' ? 'Completado' : 'Completed'}
                                    </span>
                                    <span className="font-mono font-semibold">{cert.completedAt}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <PrintCertButton label={t('download')} />
                </div>
            </div>

            <p className="text-base-content/60 mt-4 max-w-3xl text-center text-xs leading-relaxed print:hidden">
                {t('print_hint')}
            </p>
        </div>
    );
}
