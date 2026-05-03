'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isOk } from '@agconn/api-client';
import { AddressAutocomplete, type AddressLabels, type AddressValue } from '@agconn/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faSeedling, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useAddressPinDropFallback } from '@/components/ui/useAddressPinDropFallback';
import { getApiClient } from '@/lib/api/client';

const CV_PROXIMITY: [number, number] = [-119.78, 36.74];

type Props = { locale: string };

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

export function OnboardingForm({ locale }: Props) {
  const t = useTranslations('employer.onboarding');
  const tShared = useTranslations('shell.address');
  const tErr = useTranslations('employer.errors');
  const router = useRouter();

  const [licenseType, setLicenseType] = useState<'grower' | 'flc'>('grower');
  const [participatesInH2a, setParticipatesInH2a] = useState(false);
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
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
    setErrors({});
    if (!address) {
      setErrors({ _root: tErr('address_required'), address: tErr('address_required') });
      return;
    }
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const body = {
      legalName: String(form.get('legalName') ?? '').trim(),
      dbaName: String(form.get('dbaName') ?? '').trim() || undefined,
      licenseType,
      flcLicenseNum: licenseType === 'flc' ? String(form.get('flcLicenseNum') ?? '').trim() : undefined,
      dolMspaNum: licenseType === 'flc' ? String(form.get('dolMspaNum') ?? '').trim() || undefined : undefined,
      ein: licenseType === 'grower' ? String(form.get('ein') ?? '').trim() : undefined,
      county: licenseType === 'grower' ? String(form.get('county') ?? '') : undefined,
      contactEmail: String(form.get('contactEmail') ?? '').trim() || undefined,
      contactPhone: String(form.get('contactPhone') ?? '').trim() || undefined,
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
        // Treat already_onboarded as success — the profile exists, the user
        // just hit a transient post-write error on a previous submit. Route
        // them through to the dashboard rather than re-trying.
        if (code === 'already_onboarded' || res.error.message === 'already_onboarded') {
          setDone(true);
          return;
        }
        const fieldErrs = res.error.fields ?? {};
        const msg = tErrSafe(tErr, code) ?? res.error.message ?? tErr('internal');
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

  if (done) {
    return (
      <div className="bg-base-100 border-base-300 w-full rounded-3xl border p-10 text-center shadow-md">
        <span className="bg-primary/10 text-primary mx-auto grid h-12 w-12 place-items-center rounded-full">
          <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
        </span>
        <h1 className="font-display mt-5 text-3xl font-light leading-tight tracking-tight">
          {t('success.title')}
        </h1>
        <p className="text-base-content/65 mx-auto mt-3 max-w-md text-sm leading-relaxed">
          {t('success.body')}
        </p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/employer/dashboard`)}
          className="btn btn-primary mt-6 rounded-full font-semibold"
        >
          {t('success.cta')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-base-100 border-base-300 w-full rounded-3xl border p-7 shadow-md sm:p-8"
      noValidate
    >
      <div className="mb-6">
        <h1 className="font-display text-3xl font-light leading-tight tracking-tight">
          {t('title')}
        </h1>
        <p className="text-base-content/65 mt-2 text-sm leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      {errors._root && (
        <div role="alert" className="alert alert-error alert-soft mb-5 text-sm">
          {errors._root}
        </div>
      )}

      <div className="grid gap-5">
        <Field label={t('legal_name.label')} help={t('legal_name.help')}>
          <input
            name="legalName"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="organization"
            className="input input-bordered w-full"
          />
        </Field>

        <Field label={t('dba_name.label')} help={t('dba_name.help')}>
          <input
            name="dbaName"
            type="text"
            maxLength={120}
            className="input input-bordered w-full"
          />
        </Field>

        <div>
          <p className="text-base-content/80 mb-2 block text-[13px] font-semibold">
            {t('type.label')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <RadioCard
              icon={faSeedling}
              label={t('type.grower')}
              checked={licenseType === 'grower'}
              onChange={() => setLicenseType('grower')}
              name="licenseType"
              value="grower"
            />
            <RadioCard
              icon={faUsers}
              label={t('type.flc')}
              checked={licenseType === 'flc'}
              onChange={() => setLicenseType('flc')}
              name="licenseType"
              value="flc"
            />
          </div>
        </div>

        {licenseType === 'flc' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('flc_license.label')} help={t('flc_license.help')}>
              <input
                name="flcLicenseNum"
                type="text"
                required
                pattern="[A-Z0-9-]{4,20}"
                className="input input-bordered w-full"
              />
              {errors.flcLicenseNum && (
                <p className="text-error mt-1 text-xs">{errors.flcLicenseNum}</p>
              )}
            </Field>
            <Field label={t('dol_mspa.label')}>
              <input
                name="dolMspaNum"
                type="text"
                maxLength={40}
                className="input input-bordered w-full"
              />
            </Field>
          </div>
        )}

        {licenseType === 'grower' && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('ein.label')} help={t('ein.help')}>
              <input
                name="ein"
                type="text"
                required
                pattern="\d{2}-\d{7}"
                placeholder="XX-XXXXXXX"
                className="input input-bordered w-full"
              />
              {errors.ein && <p className="text-error mt-1 text-xs">{errors.ein}</p>}
            </Field>
            <Field label={t('county.label')}>
              <select
                name="county"
                required
                defaultValue="Fresno"
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
            {t('programs.label')}
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
                {t('programs.h2a_label')}
              </span>
              <span className="text-base-content/55 mt-0.5 block text-[11px]">
                {t('programs.h2a_help')}
              </span>
            </span>
          </label>
        </div>

        <div className="border-base-300 mt-1 border-t pt-5">
          <AddressAutocomplete
            label={t('address.label')}
            labels={labels}
            hint={t('address.help')}
            required
            proximity={CV_PROXIMITY}
            language={locale === 'es' ? 'es' : 'en'}
            value={address}
            onChange={setAddress}
            errorMessage={errors.address ?? null}
            onPinDropRequested={pinDrop.request}
          />
        </div>

        <div className="border-base-300 mt-1 grid gap-5 border-t pt-5 sm:grid-cols-2">
          <Field label={t('contact_email.label')}>
            <input
              name="contactEmail"
              type="email"
              maxLength={255}
              autoComplete="email"
              className="input input-bordered w-full"
            />
          </Field>
          <Field label={t('contact_phone.label')}>
            <input
              name="contactPhone"
              type="tel"
              maxLength={20}
              autoComplete="tel"
              className="input input-bordered w-full"
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary mt-6 w-full rounded-full font-semibold"
      >
        {submitting ? '…' : t('submit')}
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
    <div>
      <label className="text-base-content/80 mb-1.5 block text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {help && <p className="text-base-content/55 mt-1.5 text-[11px]">{help}</p>}
    </div>
  );
}

function RadioCard({
  icon,
  label,
  checked,
  onChange,
  name,
  value,
}: {
  icon: typeof faSeedling;
  label: string;
  checked: boolean;
  onChange: () => void;
  name: string;
  value: string;
}) {
  return (
    <label
      className={[
        'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm font-medium transition',
        checked
          ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
          : 'border-base-300 bg-base-100 hover:border-base-content/30',
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={[
          'grid h-8 w-8 shrink-0 place-items-center rounded-full',
          checked ? 'bg-primary/15 text-primary' : 'bg-base-200 text-base-content/55',
        ].join(' ')}
        aria-hidden
      >
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1">{label}</span>
      {checked && (
        <FontAwesomeIcon icon={faCircleCheck} className="text-primary h-4 w-4" aria-hidden />
      )}
    </label>
  );
}

function tErrSafe(t: ReturnType<typeof useTranslations>, code: string): string | null {
  try {
    return t(code as never);
  } catch {
    return null;
  }
}
