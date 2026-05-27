'use client';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faClock,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  useEmployerProfileSuspense,
  verificationStatus,
} from '@/lib/api/hooks/employer';
import { ProfileEditor } from '@/components/employer/ProfileEditor';
import { SkeletonCard } from '@/components/ui/skeleton';

function ProfileInner() {
  const locale = useLocale();
  const t = useTranslations('employer.profile');
  const { data: profile } = useEmployerProfileSuspense();
  if (!profile) return null;
  const status = verificationStatus(profile);
  const statusTone =
    status === 'verified'
      ? { bg: 'bg-success/15', fg: 'text-success', icon: faCircleCheck }
      : status === 'rejected'
        ? { bg: 'bg-error/15', fg: 'text-error', icon: faTriangleExclamation }
        : { bg: 'bg-warning/15', fg: 'text-warning', icon: faClock };

  return (
    <div className=" px-5 pb-16 pt-8">
      <div className="mb-7">
        <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
          {t('eyebrow')}
        </p>
        <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
          {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
        </h1>
        <p className="text-base-content/70 mt-2 max-w-2xl text-sm">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="bg-base-100 border-base-300 rounded-2xl border p-6">
          <ProfileEditor
            initial={{
              legalName: profile.legalName,
              dbaName: profile.dbaName ?? '',
              flcLicenseNum: profile.flcLicenseNum ?? '',
              ein: profile.ein ?? '',
              county: profile.county ?? '',
              contactEmail: profile.contactEmail ?? '',
              contactPhone: profile.contactPhone ?? '',
              licenseType: (profile.licenseType ?? 'grower') as 'grower' | 'flc',
              participatesInH2a: profile.participatesInH2a ?? false,
              address:
                profile.streetAddress &&
                  profile.city &&
                  profile.stateCode &&
                  profile.postalCode &&
                  profile.addressLat != null &&
                  profile.addressLng != null
                  ? {
                    streetAddress: profile.streetAddress,
                    city: profile.city,
                    stateCode: profile.stateCode,
                    postalCode: profile.postalCode,
                    addressLat: profile.addressLat,
                    addressLng: profile.addressLng,
                    mapboxId: profile.mapboxId ?? undefined,
                  }
                  : null,
            }}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
            <h2 className="text-base-content/60 font-mono text-xs font-semibold uppercase tracking-wider">
              {t('sidebar.status_label')}
            </h2>
            <div
              className={[
                'mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider',
                statusTone.bg,
                statusTone.fg,
              ].join(' ')}
            >
              <FontAwesomeIcon icon={statusTone.icon} className="h-3 w-3" />
              {t(`sidebar.status.${status}`)}
            </div>
            {profile.flcVerifiedAt && status === 'verified' && (
              <p className="text-base-content/60 mt-3 text-xs">
                {t('sidebar.verified_at', {
                  date: new Date(profile.flcVerifiedAt).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                })}
              </p>
            )}
            {profile.rejectionReason && status === 'rejected' && (
              <p className="text-base-content/60 mt-3 text-xs">
                {t('sidebar.rejection_reason', { reason: profile.rejectionReason })}
              </p>
            )}
          </div>

          <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
            <dl className="grid gap-3 text-xs">
              <div>
                <dt className="text-base-content/60">{t('sidebar.legal_name')}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{profile.legalName}</dd>
              </div>
              {profile.dbaName && (
                <div>
                  <dt className="text-base-content/60">{t('sidebar.dba_name')}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{profile.dbaName}</dd>
                </div>
              )}
              <div>
                <dt className="text-base-content/60">{t('sidebar.license_type')}</dt>
                <dd className="mt-0.5 font-mono text-sm font-bold uppercase">
                  {profile.licenseType ?? '—'}
                </dd>
              </div>
              {profile.licenseType === 'flc' && profile.flcLicenseNum && (
                <div>
                  <dt className="text-base-content/60">{t('sidebar.flc_license')}</dt>
                  <dd className="mt-0.5 font-mono text-sm font-bold">{profile.flcLicenseNum}</dd>
                </div>
              )}
              {profile.licenseType !== 'flc' && profile.ein && (
                <div>
                  <dt className="text-base-content/60">{t('sidebar.ein')}</dt>
                  <dd className="mt-0.5 font-mono text-sm font-bold">{profile.ein}</dd>
                </div>
              )}
              <div>
                <dt className="text-base-content/60">{t('sidebar.county')}</dt>
                <dd className="mt-0.5 text-sm font-semibold">{profile.county ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-base-content/60">{t('address.label')}</dt>
                {profile.streetAddress ? (
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                    <div>{profile.streetAddress}</div>
                    <div className="text-base-content/70 text-xs">
                      {profile.city}, {profile.stateCode} {profile.postalCode}
                    </div>
                  </dd>
                ) : (
                  <dd className="text-base-content/55 mt-0.5 text-xs">
                    {t('address.missing')}
                  </dd>
                )}
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ProfileClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <ProfileInner />
    </Suspense>
  );
}
