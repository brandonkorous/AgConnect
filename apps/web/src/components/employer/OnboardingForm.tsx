'use client';

import { useEffect, useState, type FormEvent } from 'react';
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

function formatEin(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

export function OnboardingForm({ locale }: Props) {
  const t = useTranslations('employer.onboarding');
  const tShared = useTranslations('shell.address');
  const tErr = useTranslations('employer.errors');
  const router = useRouter();

  const [licenseType, setLicenseType] = useState<'grower' | 'flc'>('grower');
  const [participatesInH2a, setParticipatesInH2a] = useState(false);
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [legalName, setLegalName] = useState('');
  const [ein, setEin] = useState('');
  const [flcLicenseNum, setFlcLicenseNum] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const pinDrop = useAddressPinDropFallback(CV_PROXIMITY);

  useEffect(() => {
    if (address && (errors.address || errors._root)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.address;
        if (next._root === tErr('address_required')) delete next._root;
        return next;
      });
    }
  }, [address, errors.address, errors._root, tErr]);

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

    const form = new FormData(e.currentTarget);
    const trimmedLegal = legalName.trim();
    const trimmedEin = ein.trim();
    const trimmedFlc = flcLicenseNum.trim();

    const clientErrors: Record<string, string> = {};
    if (trimmedLegal.length < 2) {
      clientErrors.legalName = tErr('grower_fields_required');
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
      dbaName: String(form.get('dbaName') ?? '').trim() || undefined,
      licenseType,
      flcLicenseNum: licenseType === 'flc' ? trimmedFlc : undefined,
      dolMspaNum: licenseType === 'flc' ? String(form.get('dolMspaNum') ?? '').trim() || undefined : undefined,
      ein: licenseType === 'grower' ? trimmedEin : undefined,
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
        if (code === 'already_onboarded' || res.error.message === 'already_onboarded') {
          setDone(true);
          return;
        }
        const fieldErrs = res.error.fields ?? {};
        const fieldKeys = Object.keys(fieldErrs);
        const onlyHidden =
          fieldKeys.length > 0 && fieldKeys.every((k) => !VISIBLE_FIELDS.has(k.split('.')[0] ?? k));
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

  if (done) {
    return (
      <div className="bg-base-100 border-base-300 mx-auto w-full max-w-xl rounded-3xl border p-10 text-center shadow-md">
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
            minLength={2}
            maxLength={120}
            autoComplete="organization"
            value={legalName}
            onChange={(e) => {
              setLegalName(e.target.value);
              if (errors.legalName) {
                setErrors((p) => {
                  const n = { ...p };
                  delete n.legalName;
                  return n;
                });
              }
            }}
            className={`input input-bordered w-full ${errors.legalName ? 'input-error' : ''}`}
          />
          {errors.legalName && (
            <p className="text-error mt-1 text-xs">{errors.legalName}</p>
          )}
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
                pattern="[A-Z0-9-]{4,20}"
                value={flcLicenseNum}
                onChange={(e) => {
                  setFlcLicenseNum(e.target.value.toUpperCase());
                  if (errors.flcLicenseNum) {
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.flcLicenseNum;
                      return n;
                    });
                  }
                }}
                className={`input input-bordered w-full ${errors.flcLicenseNum ? 'input-error' : ''}`}
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
                inputMode="numeric"
                pattern="\d{2}-\d{7}"
                placeholder="XX-XXXXXXX"
                maxLength={10}
                value={ein}
                onChange={(e) => {
                  setEin(formatEin(e.target.value));
                  if (errors.ein) {
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.ein;
                      return n;
                    });
                  }
                }}
                className={`input input-bordered w-full ${errors.ein ? 'input-error' : ''}`}
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
