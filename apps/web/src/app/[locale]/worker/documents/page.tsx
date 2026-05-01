import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faPlus,
  faCheck,
  faAward,
  faLeaf,
  faIdBadge,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { WorkerPageHeader } from '@/components/worker/WorkerPageHeader';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { fetchProfile } from '@/lib/api/profile';
import { fetchWallet, type WalletItem } from '@/lib/api/wallet';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.documents' });
  return { title: t('meta.title') };
}

export default async function DocumentsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'worker.documents' });
  const tComp = await getTranslations({
    locale,
    namespace: 'worker.documents.completeness',
  });
  const tGroup = await getTranslations({ locale, namespace: 'worker.documents.group' });
  const tStatus = await getTranslations({ locale, namespace: 'worker.documents.status' });
  const tShares = await getTranslations({ locale, namespace: 'worker.documents.shares' });

  const [profile, wallet] = await Promise.all([fetchProfile(), fetchWallet()]);

  const tasks = [
    { key: 'identity', done: Boolean(profile.firstName && profile.lastName) },
    { key: 'banking', done: Boolean(profile.zipCode) },
    {
      key: 'references',
      done:
        profile.experience.length > 0 ||
        profile.education.length > 0 ||
        profile.certifications.length > 0,
    },
    {
      key: 'photo',
      done: profile.availability.weekdays || profile.availability.weekends,
    },
  ];
  const pct = Math.round((tasks.filter((x) => x.done).length / tasks.length) * 100);

  const profileItems = [
    {
      name: t('item.resume.name'),
      meta: profile.experience.length
        ? t('item.resume.entries', { n: profile.experience.length })
        : t('item.resume.empty'),
      status: profile.experience.length > 0 ? 'Current' : 'Missing',
      icon: faLeaf,
    },
    {
      name: t('item.skills.name'),
      meta: t('item.skills.count', { n: profile.skills.length }),
      status: profile.skills.length > 0 ? 'Current' : 'Missing',
      icon: faShieldHalved,
    },
    {
      name: t('item.location.name'),
      meta:
        profile.county || profile.zipCode
          ? `${profile.county ?? ''} ${profile.zipCode ?? ''}`.trim()
          : t('item.location.empty'),
      status: profile.county || profile.zipCode ? 'Verified' : 'Missing',
      icon: faIdBadge,
    },
  ] as const;

  const certItems = wallet
    .filter((w): w is Extract<WalletItem, { source: 'enrollment' }> => w.source === 'enrollment')
    .map((c) => ({
      name: locale === 'es' ? c.programTitleEs : c.programTitleEn,
      meta: `${c.certificateId ?? '—'} · ${c.completedAt}`,
      status: 'Verified' as const,
      icon: faAward,
      href: `/${locale}/worker/wallet/cert/${c.id}`,
    }));

  return (
    <div className="px-8 pb-16 pt-8">
      <WorkerPageHeader
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('title.lead')}{' '}
            <em className="text-primary font-light not-italic">{t('title.em')}</em>
            .
          </>
        }
        sub={t('sub')}
        right={
          <>
            <Link
              href={`/${locale}/worker/profile`}
              className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-2 text-[13px] font-semibold no-underline"
            >
              <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
              {t('cta_download')}
            </Link>
            <Link
              href={`/${locale}/worker/profile/reupload`}
              className="btn btn-primary btn-sm rounded-full"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              {t('cta_upload')}
            </Link>
          </>
        }
      />

      <div className="border-base-300 bg-base-100 mb-5 grid items-center gap-8 rounded-2xl border p-[22px] lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em]">
            {tComp('eyebrow')}
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <div className="font-serif text-primary text-[48px] leading-none tracking-[-0.025em]">
              {pct}
              <span className="text-[24px] opacity-50">%</span>
            </div>
            <div className="text-base-content/80 max-w-[360px] text-[13.5px]">
              {tComp.rich('blurb', {
                top: (chunks) => <strong className="text-base-content">{chunks}</strong>,
                boost: (chunks) => <strong className="text-primary">{chunks}</strong>,
              })}
            </div>
          </div>
          <div className="bg-base-200 mt-4 h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="grid gap-2">
          {tasks.map((s) => (
            <div
              key={s.key}
              className={[
                'flex items-center gap-2.5 rounded-lg px-3 py-2',
                s.done ? 'bg-primary/10' : 'bg-base-200',
              ].join(' ')}
            >
              <div
                className={[
                  'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-white',
                  s.done
                    ? 'bg-primary'
                    : 'border-base-300 border-[1.5px] border-dashed bg-transparent',
                ].join(' ')}
              >
                {s.done && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />}
              </div>
              <div
                className={[
                  'flex-1 text-[12.5px] font-semibold',
                  s.done ? 'text-primary' : 'text-base-content/80',
                ].join(' ')}
              >
                {tComp(`task.${s.key}` as 'task.identity')}
              </div>
              {!s.done && (
                <Link
                  href={`/${locale}/worker/profile`}
                  className="text-primary text-[11.5px] font-bold no-underline"
                >
                  {tComp('add')}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <SectionHeading sub={tGroup('on_file', { n: profileItems.length })}>
          {tGroup('title.identification')}
        </SectionHeading>
        <div className="grid gap-3.5 lg:grid-cols-3">
          {profileItems.map((it) => (
            <DocCard
              key={it.name}
              name={it.name}
              meta={it.meta}
              status={it.status}
              icon={it.icon}
              tStatus={tStatus}
              href={`/${locale}/worker/profile`}
            />
          ))}
        </div>
      </div>

      <div className="mb-5">
        <SectionHeading sub={tGroup('on_file', { n: certItems.length })}>
          {tGroup('title.certs')}
        </SectionHeading>
        {certItems.length === 0 ? (
          <div className="border-base-300 bg-base-100 rounded-2xl border p-6 text-center">
            <p className="text-base-content/70 text-[13.5px]">
              {locale === 'es'
                ? 'Aún no tienes certificados. Completa una capacitación para verlo aquí.'
                : "You don't have any certificates yet. Finish a training program to see them here."}
            </p>
            <Link
              href={`/${locale}/worker/training`}
              className="btn btn-primary btn-sm mt-3 rounded-full"
            >
              {locale === 'es' ? 'Ver capacitación' : 'Browse training'}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3.5 lg:grid-cols-3">
            {certItems.map((it) => (
              <DocCard
                key={it.name}
                name={it.name}
                meta={it.meta}
                status={it.status}
                icon={it.icon}
                tStatus={tStatus}
                href={it.href}
              />
            ))}
          </div>
        )}
      </div>

      <SectionHeading sub={tShares('sub')}>{tShares('title')}</SectionHeading>
      <div className="border-base-300 bg-base-100 grid place-items-center rounded-2xl border p-8 text-center">
        <p className="text-base-content/70 text-[13.5px]">
          {locale === 'es'
            ? 'Aquí verás cuándo compartiste tu perfil con un empleador.'
            : "When you share your profile with an employer, it'll appear here."}
        </p>
      </div>
    </div>
  );
}

type DocStatus = 'Verified' | 'Current' | 'Expiring soon' | 'Missing';

function DocCard({
  name,
  meta,
  status,
  icon,
  tStatus,
  href,
}: {
  name: string;
  meta: string;
  status: DocStatus;
  icon: typeof faAward;
  tStatus: (k: string) => string;
  href: string;
}) {
  const tone =
    status === 'Verified'
      ? 'success'
      : status === 'Current'
        ? 'primary'
        : status === 'Expiring soon'
          ? 'warning'
          : 'danger';
  const key =
    status === 'Verified'
      ? 'verified'
      : status === 'Current'
        ? 'current'
        : status === 'Expiring soon'
          ? 'expiring'
          : 'missing';
  return (
    <div className="border-base-300 bg-base-100 rounded-2xl border p-[18px]">
      <div className="flex items-start gap-3">
        <div className="bg-base-200 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl">
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{name}</div>
          <div className="text-base-content/60 mt-1 text-[11.5px]">{meta}</div>
        </div>
      </div>
      <div className="border-base-300 mt-3.5 flex items-center justify-between border-t pt-3.5">
        <Pill tone={tone}>{tStatus(key)}</Pill>
        <Link href={href as Route} className="text-base-content/80 text-[12px] no-underline">
          →
        </Link>
      </div>
    </div>
  );
}
