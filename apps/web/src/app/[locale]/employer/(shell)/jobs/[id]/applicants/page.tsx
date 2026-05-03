import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getEmployerJob, listInbox } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.kanban' });
  return { title: `AgConn — ${t('applied')}` };
}

export default async function JobApplicantsPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.kanban' });
  const tForm = await getTranslations({ locale, namespace: 'employer.jobs.form' });
  const job = await getEmployerJob(id);
  if (!job) notFound();

  const apps = await listInbox();
  const forJob = apps.filter((a) => a.job.id === id);

  const cols = {
    applied: forJob.filter((a) => a.status === 'applied'),
    reviewed: forJob.filter((a) => a.status === 'reviewed'),
    hired: forJob.filter((a) => a.status === 'hired'),
  };

  return (
    <div className="px-5 md:px-8 lg:px-20 pb-16 pt-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/employer/jobs`}
          className="text-base-content/60 hover:text-base-content text-sm"
        >
          ← {tForm('back')}
        </Link>
        <h1 className="font-display mt-2 text-3xl font-light">
          {locale === 'es' ? job.titleEs : job.titleEn}
        </h1>
        <p className="text-base-content/60 text-sm">
          {job.county} · ${job.wageMin}–${job.wageMax}/hr · {job.hireCount}/{job.positionsTotal}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Column title={t('applied')} apps={cols.applied} locale={locale} />
        <Column title={t('reviewed')} apps={cols.reviewed} locale={locale} />
        <Column title={t('hired')} apps={cols.hired} locale={locale} />
      </div>
    </div>
  );
}

function Column({
  title,
  apps,
  locale,
}: {
  title: string;
  apps: Awaited<ReturnType<typeof listInbox>>;
  locale: string;
}) {
  return (
    <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-base-content/60 font-mono text-xs">{apps.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {apps.map((a) => (
          <Link
            key={a.id}
            href={`/${locale}/employer/applications/${a.id}`}
            className="border-base-300 hover:bg-base-200 rounded-xl border p-3 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-content grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold">
                {a.worker.firstName[0]}
                {a.worker.lastInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {a.worker.firstName} {a.worker.lastInitial}.
                </div>
                <div className="text-base-content/60 text-xs">{a.worker.county}</div>
              </div>
            </div>
            {a.worker.skillsMatchCount > 0 && (
              <div className="text-primary mt-2 font-mono text-[10px]">
                {a.worker.skillsMatchCount} match
              </div>
            )}
          </Link>
        ))}
        {apps.length === 0 && (
          <div className="text-base-content/40 py-8 text-center text-xs">—</div>
        )}
      </div>
    </section>
  );
}
