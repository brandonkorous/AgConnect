import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faFilter,
  faMagnifyingGlass,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { getEmployerProfile } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.workers' });
  return { title: `AgConn — ${t('title')}` };
}

const MOCK_WORKERS = [
  { id: 'w1', firstName: 'Pedro', lastInitial: 'E', county: 'Madera', distance: '8 mi', exp: '5 yr · Almond, grape', skills: ['Forklift', 'Bilingual'], matchScore: 96, certs: ['WPS', 'Refs ✓'] },
  { id: 'w2', firstName: 'Soledad', lastInitial: 'S', county: 'Madera', distance: '4 mi', exp: '3 yr · Sort line, packing', skills: ['Sort line', 'WPS'], matchScore: 94, certs: ['Forklift', 'Bilingual'] },
  { id: 'w3', firstName: 'Joaquín', lastInitial: 'N', county: 'Chowchilla', distance: '12 mi', exp: '8 yr · Almond harvest', skills: ['CDL-A', 'Almond'], matchScore: 92, certs: ['CDL-A', 'Refs ✓'] },
  { id: 'w4', firstName: 'Rosa', lastInitial: 'A', county: 'Madera', distance: '3 mi', exp: '4 yr · Vineyard, citrus', skills: ['Vineyard', 'Citrus'], matchScore: 88, certs: ['Bilingual', 'Refs ✓'] },
  { id: 'w5', firstName: 'Beto', lastInitial: 'V', county: 'Madera', distance: '6 mi', exp: '6 yr · Sort line', skills: ['Forklift', 'WPS'], matchScore: 89, certs: ['Forklift', 'WPS'] },
  { id: 'w6', firstName: 'Lupita', lastInitial: 'P', county: 'Madera', distance: '5 mi', exp: '2 yr · Almond, citrus', skills: ['WPS'], matchScore: 86, certs: ['WPS', 'Bilingual'] },
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
          <div className="bg-base-100 border-base-300 rounded-2xl border p-10 text-center">
            <div className="bg-primary/10 text-primary mx-auto grid h-14 w-14 place-items-center rounded-full">
              <FontAwesomeIcon icon={faLock} className="h-6 w-6" />
            </div>
            <h1 className="font-display mt-5 text-3xl font-light tracking-tight">
              {t('plan_gate.title')}
            </h1>
            <p className="text-base-content/70 mx-auto mt-3 max-w-md text-sm">
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
            {t('eyebrow')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
            {t('title_a')}{' '}
            <em className="text-primary not-italic font-light">
              {t('title_b', { count: MOCK_WORKERS.length })}
            </em>
          </h1>
          <p className="text-base-content/70 mt-2 max-w-2xl text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="border-base-300 mb-5 flex flex-wrap items-center gap-2 border-b pb-4">
        <div className="bg-base-100 border-base-300 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-base-content/50 h-3 w-3" />
          <span className="text-base-content/60">{t('search_placeholder')}</span>
        </div>
        <button
          type="button"
          className="bg-base-content text-base-100 border-base-content rounded-full border px-3 py-1.5 text-xs font-semibold"
        >
          {t('filter.all_counties')} <span className="opacity-70 font-mono">142</span>
        </button>
        {(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const).map((c) => (
          <button
            key={c}
            type="button"
            className="bg-base-100 border-base-300 rounded-full border px-3 py-1.5 text-xs font-semibold"
          >
            {c}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          className="bg-base-100 border-base-300 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
        >
          <FontAwesomeIcon icon={faFilter} className="h-2.5 w-2.5" />
          {t('filters')}
        </button>
        <button
          type="button"
          className="bg-base-100 border-base-300 rounded-full border px-3 py-1.5 text-xs font-semibold"
        >
          {t('sort_match')}
        </button>
      </div>

      <div className="text-base-content/70 mb-4 text-sm">
        {t('results', { count: MOCK_WORKERS.length })}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {MOCK_WORKERS.map((w) => (
          <article
            key={w.id}
            className="bg-base-100 border-base-300 rounded-2xl border p-5"
          >
            <div className="flex items-start gap-3">
              <div className="bg-base-content text-base-100 grid h-11 w-11 shrink-0 place-items-center rounded-full font-mono text-xs font-bold">
                {w.firstName[0]}
                {w.lastInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold">
                    {w.firstName} {w.lastInitial}.
                  </div>
                  <MatchScore pct={w.matchScore} t={t} />
                </div>
                <div className="text-base-content/60 mt-0.5 text-[11px]">
                  {w.county} · {w.distance} · {w.exp}
                </div>
              </div>
            </div>

            <div className="border-base-300 mt-3 flex flex-wrap gap-1.5 border-t border-dashed pt-3">
              {w.skills.map((s) => (
                <span
                  key={s}
                  className="bg-base-200 text-base-content/80 rounded px-2 py-0.5 text-[10px] font-semibold"
                >
                  {s}
                </span>
              ))}
              {w.certs.map((c) => (
                <span
                  key={c}
                  className="bg-success/15 text-success inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="h-2 w-2" />
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Link
                href={`/${locale}/employer/workers/${w.id}`}
                className="border-base-300 rounded-full border bg-transparent px-3 py-1.5 text-[11px] font-semibold"
              >
                {t('view')}
              </Link>
              <button
                type="button"
                className="bg-base-content text-base-100 rounded-full px-3.5 py-1.5 text-[11px] font-semibold"
              >
                {t('invite')} →
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MatchScore({
  pct,
  t,
}: {
  pct: number;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="grid h-7 w-7 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-primary) ${pct * 3.6}deg, var(--color-base-200) 0)`,
        }}
      >
        <div className="bg-base-100 text-primary grid h-5 w-5 place-items-center rounded-full font-mono text-[8px] font-bold">
          {pct}
        </div>
      </div>
      <span className="text-base-content/60 text-[10px] font-bold">
        {pct}% {t('match_label')}
      </span>
    </div>
  );
}
