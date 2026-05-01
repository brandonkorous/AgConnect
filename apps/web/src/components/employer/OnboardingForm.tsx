'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wordmark } from '@/components/primitives/Wordmark';

type Props = { locale: string };

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

export function OnboardingForm({ locale }: Props) {
  const t = useTranslations('employer.onboarding');
  const tErr = useTranslations('employer.errors');
  const router = useRouter();

  const [licenseType, setLicenseType] = useState<'grower' | 'flc'>('grower');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
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
    };

    try {
      const res = await fetch('/api/v1/employer/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code: string = data?.error?.code ?? 'internal';
        const fieldErrs: Record<string, string> = data?.error?.fields ?? {};
        const msg = tErrSafe(tErr, code) ?? data?.error?.message ?? tErr('internal');
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
      <div className="bg-base-100 border-base-300 rounded-3xl border p-10 text-center">
        <Wordmark size="md" tone="ink" />
        <h1 className="font-display mt-6 text-3xl font-light">{t('success.title')}</h1>
        <p className="text-base-content/70 mx-auto mt-3 max-w-md text-sm">
          {t('success.body')}
        </p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/employer/dashboard`)}
          className="btn btn-primary mt-6"
        >
          {t('success.cta')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-base-100 border-base-300 rounded-3xl border p-8">
      <div className="mb-6">
        <Wordmark size="sm" tone="ink" />
        <h1 className="font-display mt-4 text-3xl font-light">{t('title')}</h1>
        <p className="text-base-content/70 mt-2 text-sm">{t('subtitle')}</p>
      </div>

      {errors._root && (
        <div className="alert alert-error mb-4 text-sm">{errors._root}</div>
      )}

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('legal_name.label')}</legend>
        <input
          name="legalName"
          type="text"
          required
          minLength={2}
          maxLength={120}
          className="input w-full"
        />
        <p className="label">{t('legal_name.help')}</p>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('dba_name.label')}</legend>
        <input
          name="dbaName"
          type="text"
          maxLength={120}
          className="input w-full"
        />
        <p className="label">{t('dba_name.help')}</p>
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('type.label')}</legend>
        <label className="label cursor-pointer justify-start gap-3 py-2">
          <input
            type="radio"
            name="licenseType"
            value="grower"
            className="radio radio-primary"
            checked={licenseType === 'grower'}
            onChange={() => setLicenseType('grower')}
          />
          <span className="text-sm font-medium">{t('type.grower')}</span>
        </label>
        <label className="label cursor-pointer justify-start gap-3 py-2">
          <input
            type="radio"
            name="licenseType"
            value="flc"
            className="radio radio-primary"
            checked={licenseType === 'flc'}
            onChange={() => setLicenseType('flc')}
          />
          <span className="text-sm font-medium">{t('type.flc')}</span>
        </label>
      </fieldset>

      {licenseType === 'flc' && (
        <>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('flc_license.label')}</legend>
            <input
              name="flcLicenseNum"
              type="text"
              required
              pattern="[A-Z0-9-]{4,20}"
              className="input w-full"
            />
            <p className="label">{t('flc_license.help')}</p>
            {errors.flcLicenseNum && <p className="text-error text-xs">{errors.flcLicenseNum}</p>}
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('dol_mspa.label')}</legend>
            <input name="dolMspaNum" type="text" maxLength={40} className="input w-full" />
          </fieldset>
        </>
      )}

      {licenseType === 'grower' && (
        <>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('ein.label')}</legend>
            <input
              name="ein"
              type="text"
              required
              pattern="\d{2}-\d{7}"
              placeholder="XX-XXXXXXX"
              className="input w-full"
            />
            <p className="label">{t('ein.help')}</p>
            {errors.ein && <p className="text-error text-xs">{errors.ein}</p>}
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">{t('county.label')}</legend>
            <select name="county" required className="select w-full">
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
        <legend className="fieldset-legend">{t('contact_email.label')}</legend>
        <input name="contactEmail" type="email" maxLength={255} className="input w-full" />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('contact_phone.label')}</legend>
        <input name="contactPhone" type="tel" maxLength={20} className="input w-full" />
      </fieldset>

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={submitting}>
        {submitting ? '…' : t('submit')}
      </button>
    </form>
  );
}

function tErrSafe(t: ReturnType<typeof useTranslations>, code: string): string | null {
  try {
    return t(code as never);
  } catch {
    return null;
  }
}
