'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { AddressAutocomplete, type AddressLabels, type AddressValue } from '@agconn/ui';
import { useAddressPinDropFallback } from '@/components/ui/useAddressPinDropFallback';
import { getApiClient } from '@/lib/api/client';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;
const CV_PROXIMITY: [number, number] = [-119.78, 36.74];

type Initial = {
  legalName: string;
  dbaName: string;
  flcLicenseNum: string;
  ein: string;
  county: string;
  contactEmail: string;
  contactPhone: string;
  licenseType: 'grower' | 'flc';
  participatesInH2a: boolean;
  address: AddressValue | null;
};

type Props = { initial: Initial };

export function ProfileEditor({ initial }: Props) {
  const t = useTranslations('employer');
  const tShared = useTranslations('shell.address');
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participatesInH2a, setParticipatesInH2a] = useState(initial.participatesInH2a);
  const [address, setAddress] = useState<AddressValue | null>(initial.address);
  const pinDrop = useAddressPinDropFallback(CV_PROXIMITY);

  const labels: AddressLabels = {
    placeholder: tShared('placeholder'),
    searching: tShared('searching'),
    noMatches: tShared('noMatches'),
    suggestionsAria: tShared('suggestions.aria'),
    selectedAria: tShared('selected.aria'),
    pinFallback: tShared('dropPin.fallbackLink'),
    edit: tShared('edit'),
  };

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
      participatesInH2a,
    };
    if (address) body.address = address;
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
    <form
      onSubmit={onSubmit}
      className="bg-base-100 border-base-300 rounded-2xl border p-6 sm:p-7"
    >
      {error && (
        <div role="alert" className="alert alert-error alert-soft mb-4 text-sm">
          {error}
        </div>
      )}
      {saved && (
        <div role="status" className="alert alert-success alert-soft mb-4 text-sm">
          {t('profile.saved')}
        </div>
      )}

      <div className="grid gap-5">
        <Field label={t('onboarding.legal_name.label')} help={t('onboarding.legal_name.help')}>
          <input
            name="legalName"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="organization"
            defaultValue={initial.legalName}
            className="input input-bordered w-full"
          />
        </Field>

        <Field label={t('onboarding.dba_name.label')} help={t('onboarding.dba_name.help')}>
          <input
            name="dbaName"
            type="text"
            maxLength={120}
            defaultValue={initial.dbaName}
            className="input input-bordered w-full"
          />
        </Field>

        {initial.licenseType === 'flc' ? (
          <Field label={t('onboarding.flc_license.label')} help={t('onboarding.flc_license.help')}>
            <input
              name="flcLicenseNum"
              type="text"
              pattern="[A-Z0-9-]{4,20}"
              defaultValue={initial.flcLicenseNum}
              className="input input-bordered w-full"
            />
          </Field>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('onboarding.ein.label')} help={t('onboarding.ein.help')}>
              <input
                name="ein"
                type="text"
                pattern="\d{2}-\d{7}"
                defaultValue={initial.ein}
                className="input input-bordered w-full"
              />
            </Field>
            <Field label={t('onboarding.county.label')}>
              <select
                name="county"
                defaultValue={initial.county}
                className="select select-bordered w-full"
              >
                {COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <div className="border-base-300 mt-1 border-t pt-5">
          <p className="text-base-content/80 mb-1.5 block text-[13px] font-semibold">
            {t('onboarding.programs.label')}
          </p>
          <label className="border-base-300 hover:border-base-content/30 flex cursor-pointer items-start gap-3 rounded-2xl border p-3">
            <input
              type="checkbox"
              checked={participatesInH2a}
              onChange={(e) => setParticipatesInH2a(e.target.checked)}
              className="checkbox checkbox-primary mt-0.5"
            />
            <span>
              <span className="text-base-content block text-sm font-medium">
                {t('onboarding.programs.h2a_label')}
              </span>
              <span className="text-base-content/55 mt-0.5 block text-[11px]">
                {t('onboarding.programs.h2a_help')}
              </span>
            </span>
          </label>
        </div>

        <div className="border-base-300 mt-1 border-t pt-5">
          <AddressAutocomplete
            label={t('profile.address.label')}
            labels={labels}
            hint={t('profile.address.help')}
            proximity={CV_PROXIMITY}
            language={locale === 'es' ? 'es' : 'en'}
            value={address}
            onChange={setAddress}
            onPinDropRequested={pinDrop.request}
          />
        </div>

        <div className="border-base-300 mt-1 grid gap-5 border-t pt-5 sm:grid-cols-2">
          <Field label={t('onboarding.contact_email.label')}>
            <input
              name="contactEmail"
              type="email"
              maxLength={255}
              autoComplete="email"
              defaultValue={initial.contactEmail}
              className="input input-bordered w-full"
            />
          </Field>
          <Field label={t('onboarding.contact_phone.label')}>
            <input
              name="contactPhone"
              type="tel"
              maxLength={20}
              autoComplete="tel"
              defaultValue={initial.contactPhone}
              className="input input-bordered w-full"
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary mt-6 rounded-full font-semibold"
      >
        {busy ? '…' : t('profile.save')}
      </button>
      {pinDrop.modal}
    </form>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend text-base-content/80 text-[13px] font-semibold">
        {label}
      </legend>
      {children}
      {help && <p className="label text-base-content/55 text-[11px]">{help}</p>}
    </fieldset>
  );
}
