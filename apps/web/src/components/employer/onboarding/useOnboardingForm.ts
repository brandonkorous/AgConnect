'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import type { AddressValue } from '@agconn/ui';
import { getApiClient } from '@/lib/api/client';

export type LicenseType = 'grower' | 'flc' | 'labor_contractor';

const VISIBLE_FIELDS = new Set([
  'legalName',
  'dbaName',
  'flcLicenseNum',
  'dolMspaNum',
  'ein',
  'county',
  'contactEmail',
  'contactPhone',
  'address',
]);

export function formatEin(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

function tErrSafe(t: ReturnType<typeof useTranslations>, code: string): string | null {
  try {
    return t(code as never);
  } catch {
    return null;
  }
}

export function useOnboardingForm(locale: string) {
  const tErr = useTranslations('employer.errors');
  const router = useRouter();

  const [licenseType, setLicenseType] = useState<LicenseType>('grower');
  const [participatesInH2a, setParticipatesInH2a] = useState(false);
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [legalName, setLegalName] = useState('');
  const [dbaName, setDbaName] = useState('');
  const [ein, setEin] = useState('');
  const [flcLicenseNum, setFlcLicenseNum] = useState('');
  const [dolMspaNum, setDolMspaNum] = useState('');
  const [county, setCounty] = useState('Fresno');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    setErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      const drop = (k: string) => {
        if (next[k]) { delete next[k]; changed = true; }
      };
      if (address) drop('address');
      if (legalName.trim().length >= 2) drop('legalName');
      if (licenseType === 'grower' && /^\d{2}-\d{7}$/.test(ein.trim())) drop('ein');
      if (licenseType === 'flc' && /^[A-Z0-9-]{4,20}$/.test(flcLicenseNum.trim())) drop('flcLicenseNum');
      if (next._root && !next.legalName && !next.ein && !next.flcLicenseNum && !next.address) drop('_root');
      return changed ? next : prev;
    });
  }, [address, legalName, ein, flcLicenseNum, licenseType]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const trimmedLegal = legalName.trim();
    const trimmedEin = ein.trim();
    const trimmedFlc = flcLicenseNum.trim();

    const clientErrors: Record<string, string> = {};
    if (trimmedLegal.length < 2) {
      clientErrors.legalName = tErr('legal_name_required');
    }
    if (licenseType === 'grower' && !/^\d{2}-\d{7}$/.test(trimmedEin)) {
      clientErrors.ein = tErr('ein_format');
    }
    if (licenseType === 'flc' && !/^[A-Z0-9-]{4,20}$/.test(trimmedFlc)) {
      clientErrors.flcLicenseNum = tErr('flc_license_required');
    }
    if (!address) {
      clientErrors.address = tErr('address_required');
    }
    if (Object.keys(clientErrors).length > 0) {
      const firstMsg = Object.values(clientErrors)[0] ?? tErr('validation_failed');
      setErrors({ _root: firstMsg, ...clientErrors });
      return;
    }

    setSubmitting(true);

    const body = {
      legalName: trimmedLegal,
      dbaName: dbaName.trim() || undefined,
      licenseType,
      flcLicenseNum: licenseType === 'flc' ? trimmedFlc : undefined,
      dolMspaNum: licenseType === 'flc' ? dolMspaNum.trim() || undefined : undefined,
      ein: licenseType === 'grower' ? trimmedEin : undefined,
      county: licenseType === 'grower' ? county : undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      participatesInH2a,
      address,
    };

    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.post('/v1/employer/onboarding', body, {
        handleErrorInline: true,
      });
      if (!isOk(res)) {
        const code = res.error.code;
        if (code === 'already_onboarded' || res.error.message === 'already_onboarded') {
          setDone(true);
          return;
        }
        const fieldErrs = res.error.fields ?? {};
        const fieldKeys = Object.keys(fieldErrs);
        const onlyHidden =
          fieldKeys.length > 0 &&
          fieldKeys.every((k) => !VISIBLE_FIELDS.has(k.split('.')[0] ?? k));
        const msg = onlyHidden
          ? tErr('address_repick')
          : tErrSafe(tErr, code) ?? res.error.message ?? tErr('internal');
        setErrors({ _root: msg, ...fieldErrs });
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setErrors({ _root: tErr('internal') });
      setSubmitting(false);
    }
  }

  return {
    state: {
      licenseType,
      participatesInH2a,
      address,
      legalName,
      dbaName,
      ein,
      flcLicenseNum,
      dolMspaNum,
      county,
      contactEmail,
      contactPhone,
      submitting,
      errors,
      done,
    },
    actions: {
      setLicenseType,
      setParticipatesInH2a,
      setAddress,
      setLegalName,
      setDbaName,
      setEin: (v: string) => setEin(formatEin(v)),
      setFlcLicenseNum: (v: string) => setFlcLicenseNum(v.toUpperCase()),
      setDolMspaNum,
      setCounty,
      setContactEmail,
      setContactPhone,
      onSubmit,
      goToDashboard: () => router.push(`/${locale}/employer/dashboard`),
    },
  };
}

export type OnboardingFormState = ReturnType<typeof useOnboardingForm>['state'];
export type OnboardingFormActions = ReturnType<typeof useOnboardingForm>['actions'];
