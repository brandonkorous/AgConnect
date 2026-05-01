'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

type Initial = {
  legalName: string;
  dbaName: string;
  flcLicenseNum: string;
  ein: string;
  county: string;
  contactEmail: string;
  contactPhone: string;
  licenseType: 'grower' | 'flc';
};

type Props = { initial: Initial };

export function ProfileEditor({ initial }: Props) {
  const t = useTranslations('employer');
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      legalName: String(f.get('legalName') ?? ''),
      dbaName: String(f.get('dbaName') ?? '').trim() || null,
      contactEmail: String(f.get('contactEmail') ?? '').trim() || null,
      contactPhone: String(f.get('contactPhone') ?? '').trim() || null,
    };
    if (initial.licenseType === 'flc') {
      body.flcLicenseNum = String(f.get('flcLicenseNum') ?? '').trim() || undefined;
    } else {
      body.ein = String(f.get('ein') ?? '').trim() || undefined;
      body.county = String(f.get('county') ?? '') || undefined;
    }
    try {
      const client = getApiClient(locale === 'es' ? 'es' : 'en');
      const res = await client.patch('/v1/employer/onboarding', body, {
        handleErrorInline: true,
      });
      if (!isOk(res)) {
        setError(res.error.message || t('errors.internal'));
        return;
      }
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-base-100 border-base-300 rounded-2xl border p-6">
      {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}
      {saved && <div className="alert alert-success mb-4 text-sm">{t('profile.saved')}</div>}

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('onboarding.legal_name.label')}</legend>
        <input
          name="legalName"
          type="text"
          required
          minLength={2}
          maxLength={120}
          defaultValue={initial.legalName}
          className="input w-full"
        />
        <p className="label">{t('onboarding.legal_name.help')}</p>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('onboarding.dba_name.label')}</legend>
        <input
          name="dbaName"
          type="text"
          maxLength={120}
          defaultValue={initial.dbaName}
          className="input w-full"
        />
        <p className="label">{t('onboarding.dba_name.help')}</p>
      </fieldset>

      {initial.licenseType === 'flc' ? (
        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t('onboarding.flc_license.label')}</legend>
          <input
            name="flcLicenseNum"
            type="text"
            pattern="[A-Z0-9-]{4,20}"
            defaultValue={initial.flcLicenseNum}
            className="input w-full"
          />
        </fieldset>
      ) : (
        <>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('onboarding.ein.label')}</legend>
            <input
              name="ein"
              type="text"
              pattern="\d{2}-\d{7}"
              defaultValue={initial.ein}
              className="input w-full"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('onboarding.county.label')}</legend>
            <select name="county" defaultValue={initial.county} className="select w-full">
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </fieldset>
        </>
      )}

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('onboarding.contact_email.label')}</legend>
        <input
          name="contactEmail"
          type="email"
          maxLength={255}
          defaultValue={initial.contactEmail}
          className="input w-full"
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('onboarding.contact_phone.label')}</legend>
        <input
          name="contactPhone"
          type="tel"
          maxLength={20}
          defaultValue={initial.contactPhone}
          className="input w-full"
        />
      </fieldset>

      <button type="submit" disabled={busy} className="btn btn-primary mt-6">
        {busy ? '…' : t('profile.save')}
      </button>
    </form>
  );
}
