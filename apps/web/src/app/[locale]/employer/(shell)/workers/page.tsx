import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { getEmployerProfile } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.workers' });
  return { title: `AgConn — ${t('title')}` };
}

const MOCK_WORKERS = [
  { id: 'w1', firstName: 'Pedro', lastInitial: 'E', county: 'Madera', skills: ['Forklift', 'Bilingual', 'Refs ✓'], matchScore: 96, certs: ['WPS', 'Bilingual'] },
  { id: 'w2', firstName: 'Soledad', lastInitial: 'S', county: 'Madera', skills: ['Sort line', 'WPS'], matchScore: 94, certs: ['Forklift'] },
  { id: 'w3', firstName: 'Joaquín', lastInitial: 'N', county: 'Chowchilla', skills: ['CDL-A', 'Almond'], matchScore: 92, certs: ['CDL-A'] },
  { id: 'w4', firstName: 'Rosa', lastInitial: 'A', county: 'Madera', skills: ['Vineyard', 'Citrus'], matchScore: 88, certs: ['Bilingual'] },
];

export default async function WorkersSearchPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.workers' });
  const profile = await getEmployerProfile();
  const isProPlus = profile?.plan === 'pro' || profile?.plan === 'enterprise';

  if (!isProPlus) {
    return (
      <div className="px-8 pb-16 pt-8">
        <div className="mx-auto max-w-xl">
          <div className="bg-base-100 border-base-300 rounded-2xl border p-8 text-center">
            <div className="bg-primary/10 text-primary mx-auto grid h-12 w-12 place-items-center rounded-full">
              <FontAwesomeIcon icon={faLock} className="h-5 w-5" />
            </div>
            <h1 className="font-display mt-4 text-2xl font-light">{t('plan_gate.title')}</h1>
            <p className="text-base-content/70 mx-auto mt-2 max-w-md text-sm">
              {t('plan_gate.body')}
            </p>
            <Link href={`/${locale}/employer/billing`} className="btn btn-primary mt-6">
              {t('plan_gate.upgrade')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-16 pt-8">
      <div className="mb-6">
        <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
          search
        </p>
        <h1 className="font-display mt-1 text-4xl font-light leading-tight tracking-tight">
          {t('title')}
        </h1>
        <p className="text-base-content/70 mt-2 max-w-2xl text-sm">{t('subtitle')}</p>
      </div>

      <div className="mb-4 text-sm font-medium">{t('results', { count: MOCK_WORKERS.length })}</div>

      <div className="grid gap-3 lg:grid-cols-2">
        {MOCK_WORKERS.map((w) => (
          <Link
            key={w.id}
            href={`/${locale}/employer/workers/${w.id}`}
            className="bg-base-100 border-base-300 hover:border-primary rounded-2xl border p-5 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-content grid h-11 w-11 place-items-center rounded-full text-xs font-bold">
                {w.firstName[0]}
                {w.lastInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">
                    {w.firstName} {w.lastInitial}.
                  </div>
                  <span className="bg-success/15 text-success font-mono text-[10px] font-bold rounded-full px-2 py-0.5">
                    {w.matchScore}% {t('match_label')}
                  </span>
                </div>
                <div className="text-base-content/60 text-xs">{w.county}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {w.skills.map((s) => (
                    <span key={s} className="bg-base-200 rounded-full px-2 py-0.5 text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
