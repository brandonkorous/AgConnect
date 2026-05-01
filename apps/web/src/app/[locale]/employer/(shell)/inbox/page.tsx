import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { listInbox } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.inbox' });
  return { title: `AgConn — ${t('title')}` };
}

export default async function EmployerInboxPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.inbox' });
  const apps = await listInbox();

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6">
        <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
          pipeline
        </p>
        <h1 className="font-display mt-1 text-4xl font-light leading-tight tracking-tight">
          {t('title')}
        </h1>
      </div>

      {apps.length === 0 ? (
        <div className="bg-base-100 border-base-300 rounded-2xl border p-12 text-center">
          <p className="text-base-content/70">{t('empty')}</p>
        </div>
      ) : (
        <div className="bg-base-100 border-base-300 overflow-hidden rounded-2xl border">
          {apps.map((a, i) => (
            <Link
              key={a.id}
              href={`/${locale}/employer/applications/${a.id}`}
              className={[
                'border-base-300 hover:bg-base-200 grid grid-cols-[40px_1.6fr_1fr_0.8fr_0.8fr_72px] items-center gap-4 px-5 py-4 transition-colors',
                i < apps.length - 1 ? 'border-b' : '',
              ].join(' ')}
            >
              <div className="bg-primary text-primary-content grid h-9 w-9 place-items-center rounded-full text-xs font-bold">
                {a.worker.firstName[0]}
                {a.worker.lastInitial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {a.worker.firstName} {a.worker.lastInitial}.
                </div>
                <div className="text-base-content/60 truncate text-xs">{a.worker.county}</div>
              </div>
              <div className="text-base-content/80 truncate text-sm">
                {locale === 'es' ? a.job.titleEs : a.job.titleEn}
              </div>
              <div className="text-base-content/70 font-mono text-xs">
                {a.worker.skillsMatchCount} match
              </div>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-center font-mono text-[10px] font-bold uppercase',
                  statusToneClass(a.status),
                ].join(' ')}
              >
                {t(a.status)}
              </span>
              <div className="text-base-content/60 text-right text-xs">{relTime(a.appliedAt)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function statusToneClass(status: string): string {
  switch (status) {
    case 'applied':
      return 'bg-warning/15 text-warning';
    case 'reviewed':
      return 'bg-info/15 text-info';
    case 'hired':
      return 'bg-success/15 text-success';
    case 'rejected':
      return 'bg-error/15 text-error';
    default:
      return 'bg-base-200 text-base-content/60';
  }
}

function relTime(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
