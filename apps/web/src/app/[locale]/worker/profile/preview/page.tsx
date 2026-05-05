import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faLocationDot,
  faAward,
  faGraduationCap,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { Pill } from '@/components/worker/primitives/Pill';
import { fetchProfile } from '@/lib/api/profile';

type Props = { params: Promise<{ locale: string }> };

export default async function PreviewAsEmployer({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.profile.preview' });
  const profile = await fetchProfile();
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();
  const empty = !profile.firstName && !profile.lastName;
  const availabilityLabel = !profile.availability.weekdays && !profile.availability.weekends
    ? t('availability.none')
    : profile.availability.weekdays && profile.availability.weekends
      ? t('availability.both')
      : profile.availability.weekdays
        ? t('availability.weekdays')
        : t('availability.weekends');

  return (
    <div className="px-6 pb-16 pt-8 lg:px-8">
      <Link
        href={`/${locale}/worker/profile`}
        className="text-base-content/70 hover:text-base-content mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
        {t('back')}
      </Link>
      <WorkerPageHeader title={t('title')} sub={t('sub')} />

      {empty ? (
        <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-8 text-center">
          <p className="font-serif text-xl font-semibold">{t('empty')}</p>
          <Link
            href={`/${locale}/worker/profile`}
            className="btn btn-primary btn-sm justify-self-center"
          >
            {t('cta_complete')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="border-base-300 grid gap-5 rounded-2xl border bg-white p-6">
            <span className="bg-warning/15 text-warning self-start rounded-full px-3 py-1 text-xs font-semibold uppercase">
              {t('badge')}
            </span>
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-content grid h-14 w-14 place-items-center rounded-full font-mono text-[18px] font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="font-serif text-[28px] leading-tight tracking-[-0.02em]">
                  {name}
                </h1>
                {profile.county && (
                  <div className="text-base-content/70 mt-0.5 inline-flex items-center gap-1.5 text-[13.5px]">
                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
                    {profile.county}
                    {profile.zipCode ? ` · ${profile.zipCode}` : ''}
                  </div>
                )}
              </div>
            </div>

            {profile.skills.length > 0 && (
              <div>
                <h2 className="text-base-content/70 mb-2 text-xs font-semibold uppercase tracking-wide">
                  {t('skills')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span
                      key={s}
                      className="bg-base-200 text-base-content/80 rounded-full px-3 py-1 text-[12px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ResumeBlock
              icon={faBriefcase}
              title={t('experience')}
              items={profile.experience}
              emptyLabel={t('experience_empty')}
            />
            <ResumeBlock
              icon={faGraduationCap}
              title={t('education')}
              items={profile.education}
              emptyLabel={t('education_empty')}
            />
            <ResumeBlock
              icon={faAward}
              title={t('certifications')}
              items={profile.certifications}
              emptyLabel={t('certifications_empty')}
            />
          </div>

          <aside className="grid content-start gap-3.5">
            <div className="border-base-300 grid gap-2 rounded-2xl border bg-white p-5">
              <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
                {t('availability.label')}
              </div>
              <Pill tone="primary">{availabilityLabel}</Pill>
            </div>
            <div className="border-base-300 grid gap-2 rounded-2xl border bg-white p-5">
              <p className="text-base-content/70 text-[13px]">{t('privacy')}</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function ResumeBlock({
  icon,
  title,
  items,
  emptyLabel,
}: {
  icon: typeof faBriefcase;
  title: string;
  items: { primary: string; secondary?: string; meta?: string }[];
  emptyLabel: string;
}) {
  return (
    <div>
      <h2 className="text-base-content/70 mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        <FontAwesomeIcon icon={icon} className="h-3 w-3" />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-base-content/60 text-[13px]">{emptyLabel}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((it, i) => (
            <li key={i} className="border-base-300 rounded-xl border p-3">
              <div className="text-[14px] font-semibold">{it.primary}</div>
              {it.secondary && (
                <div className="text-base-content/70 text-[13px]">{it.secondary}</div>
              )}
              {it.meta && (
                <div className="text-base-content/60 text-[12px]">{it.meta}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
