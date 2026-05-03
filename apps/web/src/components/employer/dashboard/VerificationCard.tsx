import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMinus, faExclamation } from '@fortawesome/free-solid-svg-icons';
import type { EmployerProfileView } from '@/lib/api/employer';

type Props = {
  locale: string;
  profile: EmployerProfileView;
  status: 'pending' | 'verified' | 'rejected';
};

export async function VerificationCard({ locale, profile, status }: Props) {
  const t = await getTranslations({ locale, namespace: 'employer.dashboard.verification_card' });

  const checks = [
    {
      key: 'identity',
      label: t('check.identity'),
      ok: status === 'verified',
    },
    {
      key: 'license',
      label:
        profile.licenseType === 'flc'
          ? t('check.flc_license')
          : t('check.ein'),
      ok: status === 'verified',
    },
    {
      key: 'county',
      label: t('check.county'),
      ok: Boolean(profile.county),
    },
    {
      key: 'contact',
      label: t('check.contact'),
      ok: Boolean(profile.contactEmail || profile.contactPhone),
    },
  ];

  const completePct = Math.round(
    (checks.filter((c) => c.ok).length / checks.length) * 100,
  );

  const actionsCount = checks.filter((c) => !c.ok).length;
  const banner =
    status === 'verified'
      ? { tone: 'bg-success/15 text-success', label: t('verified') }
      : status === 'rejected'
        ? { tone: 'bg-error/15 text-error', label: t('needs_action') }
        : { tone: 'bg-warning/15 text-warning', label: t('pending') };

  return (
    <div className="bg-base-100 border-base-300 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base-content/60 font-mono text-[11px] font-semibold uppercase tracking-wider">
          {t('title')}
        </h2>
        <span
          className={[
            'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
            banner.tone,
          ].join(' ')}
        >
          {banner.label}
        </span>
      </div>
      <div className="text-primary font-display mt-2 text-3xl font-light leading-none tracking-tight">
        {completePct}
        <span className="text-base-content/40 text-lg">%</span>
      </div>
      <div className="text-base-content/60 mt-1 text-xs">{t('completeness')}</div>
      <div className="border-base-300 mt-3 grid gap-2 border-t pt-3">
        {checks.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-xs">
            <div
              className={[
                'grid h-4 w-4 shrink-0 place-items-center rounded-full',
                c.ok
                  ? 'bg-success/15 text-success'
                  : status === 'rejected'
                    ? 'bg-error/15 text-error'
                    : 'bg-warning/15 text-warning',
              ].join(' ')}
            >
              <FontAwesomeIcon
                icon={c.ok ? faCheck : status === 'rejected' ? faExclamation : faMinus}
                className="h-2 w-2"
              />
            </div>
            <span className={c.ok ? 'text-base-content/80' : 'text-base-content'}>{c.label}</span>
          </div>
        ))}
      </div>
      {actionsCount > 0 && (
        <Link
          href={`/${locale}/employer/profile`}
          className="border-base-300 mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold"
        >
          {t('finish_setup')}
        </Link>
      )}
    </div>
  );
}
