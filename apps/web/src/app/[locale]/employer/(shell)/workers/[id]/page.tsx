import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function WorkerPreviewPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.workers' });

  // Mock for now — will fetch from /v1/employer/workers/:id later.
  const worker = {
    id,
    firstName: 'Pedro',
    lastInitial: 'E',
    county: 'Madera',
    skills: ['Forklift', 'Bilingual', 'Refs ✓'],
    matchScore: 96,
    experience: ['Almond Pre-shake — Driscoll Madera Ranch · 2024-2026'],
    education: ['Madera HS · 2018'],
    languages: ['English', 'Spanish'],
  };

  return (
    <div className="px-8 pb-16 pt-8">
      <Link
        href={`/${locale}/employer/workers`}
        className="text-base-content/60 hover:text-base-content mb-6 inline-block text-sm"
      >
        ← {t('title')}
      </Link>
      <div className="mx-auto max-w-2xl">
        <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary text-primary-content grid h-14 w-14 place-items-center rounded-full text-base font-bold">
              {worker.firstName[0]}
              {worker.lastInitial}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-light">
                {worker.firstName} {worker.lastInitial}.
              </h1>
              <p className="text-base-content/70 text-sm">{worker.county}</p>
            </div>
            <button type="button" className="btn btn-primary btn-sm">
              {t('invite')}
            </button>
          </div>

          <Section heading={t('preview.skills')}>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((s) => (
                <span key={s} className="bg-base-200 rounded-full px-3 py-1 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </Section>

          <Section heading={t('preview.experience')}>
            <ul className="text-sm">
              {worker.experience.map((e) => (
                <li key={e} className="border-base-200 border-b py-2 last:border-0">
                  {e}
                </li>
              ))}
            </ul>
          </Section>

          <Section heading={t('preview.education')}>
            <ul className="text-sm">
              {worker.education.map((e) => (
                <li key={e} className="border-base-200 border-b py-2 last:border-0">
                  {e}
                </li>
              ))}
            </ul>
          </Section>

          <Section heading={t('preview.languages')}>
            <div className="flex flex-wrap gap-2">
              {worker.languages.map((l) => (
                <span key={l} className="bg-base-200 rounded-full px-3 py-1 text-xs">
                  {l}
                </span>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
        {heading}
      </h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}
