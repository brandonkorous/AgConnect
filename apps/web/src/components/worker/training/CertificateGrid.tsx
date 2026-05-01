import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAward } from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import type { EnrollmentListItem } from '@/lib/api/training';

type Props = { certs: EnrollmentListItem[]; locale: string };

export function CertificateGrid({ certs, locale }: Props) {
  const t = useTranslations('worker.training_hub.certs');
  if (certs.length === 0) return null;
  return (
    <>
      <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
      <div className="grid gap-3.5 lg:grid-cols-3">
        {certs.map((c) => {
          const title = locale === 'es' ? c.program.titleEs : c.program.titleEn;
          const issued = c.completedAt
            ? new Date(c.completedAt).toLocaleDateString(locale, {
                month: 'short',
                year: 'numeric',
              })
            : '—';
          return (
            <div
              key={c.id}
              className="border-base-300 bg-base-100 rounded-2xl border p-5"
            >
              <div className="flex items-start justify-between">
                <FontAwesomeIcon icon={faAward} className="text-primary h-5 w-5" />
                <Pill tone="success">{t('verified')}</Pill>
              </div>
              <div className="font-serif mt-3.5 text-[17px] leading-tight tracking-[-0.015em]">
                {title}
              </div>
              <div className="text-base-content/60 mt-2 font-mono text-[11.5px]">
                {c.certificateId ?? '—'} · {t('issued', { date: issued })}
              </div>
              {c.certUrl ? (
                <a
                  href={c.certUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary mt-3.5 inline-block bg-transparent text-[12px] font-bold"
                >
                  {t('download')}
                </a>
              ) : (
                <div className="text-base-content/50 mt-3.5 text-[12px]">
                  {locale === 'es' ? 'Generando…' : 'Generating…'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
