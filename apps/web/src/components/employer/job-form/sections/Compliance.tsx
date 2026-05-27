'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMinus, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import type { EmployerProfileView } from '@/lib/api/hooks/employer';
import { SectionShell } from '../SectionShell';
import type { JobFormState } from '../types';

type ItemStatus = 'ok' | 'pending' | 'warn';

type ComplianceItem = {
  key: string;
  status: ItemStatus;
  sub: string;
};

type Props = {
  state: JobFormState;
  profile: EmployerProfileView | null;
  locale: string;
};

export function ComplianceSection({ state, profile, locale }: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  const isPiece = state.wageStructure !== 'hourly';
  const isLaborContractor =
    profile?.licenseType === 'flc' || profile?.licenseType === 'labor_contractor';

  const items: ComplianceItem[] = [];

  items.push({
    key: 'business_verified',
    status: profile?.flcVerifiedAt ? 'ok' : 'pending',
    sub: profile?.flcVerifiedAt
      ? t('compliance_business_verified_sub')
      : t('compliance_business_pending_sub'),
  });

  if (isLaborContractor) {
    items.push({
      key: 'flc_license',
      status: profile?.flcLicenseNum ? 'ok' : 'pending',
      sub: profile?.flcLicenseNum
        ? t('compliance_flc_license_ok_sub', { num: profile.flcLicenseNum })
        : t('compliance_flc_license_pending_sub'),
    });
  }

  if (isLaborContractor && profile?.dolLastInspectionResult) {
    const result = profile.dolLastInspectionResult;
    items.push({
      key: 'dol_inspection',
      status: result === 'pass' ? 'ok' : result === 'fail' ? 'warn' : 'pending',
      sub: t(`compliance_dol_${result}_sub`),
    });
  }

  items.push({
    key: 'heat_illness_plan',
    status: 'pending',
    sub: t('compliance_attest_required_sub'),
  });
  items.push({
    key: 'wps_current',
    status: 'pending',
    sub: t('compliance_attest_required_sub'),
  });
  items.push({
    key: 'wage_statement',
    status: 'pending',
    sub: isPiece ? t('compliance_wage_statement_piece_sub') : t('compliance_wage_statement_sub'),
  });

  items.push({
    key: 'i9_process',
    status: 'ok',
    sub: t('compliance_i9_sub'),
  });

  if (profile?.participatesInH2a) {
    items.push({
      key: 'h2a_status',
      status: 'ok',
      sub: t('compliance_h2a_yes'),
    });
  }

  return (
    <SectionShell
      num={7}
      id="s-compliance"
      title={t('compliance_title')}
      subtitle={t('compliance_sub_honest')}
    >
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.key}
            className={[
              'flex items-center gap-3 rounded-xl border px-3.5 py-2.5',
              it.status === 'ok' && 'bg-success/10 border-success/20',
              it.status === 'pending' && 'bg-base-200 border-base-300',
              it.status === 'warn' && 'bg-warning/10 border-warning/30',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span
              className={[
                'grid h-6 w-6 shrink-0 place-items-center rounded-full',
                it.status === 'ok' && 'bg-success/20 text-success',
                it.status === 'pending' &&
                  'bg-base-100 text-base-content/40 border-base-300 border',
                it.status === 'warn' && 'bg-warning/20 text-warning',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <FontAwesomeIcon
                icon={
                  it.status === 'ok'
                    ? faCheck
                    : it.status === 'warn'
                      ? faTriangleExclamation
                      : faMinus
                }
                className="h-3 w-3"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t(`compliance_${it.key}`)}</div>
              <div className="text-base-content/55 mt-0.5 text-xs">{it.sub}</div>
            </div>
            {it.status !== 'ok' && (
              <Link
                href={`/${locale}/employer/compliance#item-${it.key}`}
                className="btn btn-ghost btn-xs border-base-300 rounded-full border whitespace-nowrap"
              >
                {t('compliance_attest_link')}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
