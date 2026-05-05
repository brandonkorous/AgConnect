'use client';

import { useTranslations } from 'next-intl';
import { CheckboxCard } from '@/components/employer/primitives';
import type { OnboardingFormActions, OnboardingFormState } from '../useOnboardingForm';

const COUNTIES = ['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare'] as const;

type Props = {
  state: OnboardingFormState;
  actions: OnboardingFormActions;
};

export function RegulatorySection({ state, actions }: Props) {
  const t = useTranslations('employer.onboarding');

  return (
    <div className="border-base-300 grid gap-5 border-t pt-5">
      {state.licenseType === 'flc' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="fieldset w-full min-w-0">
            <legend className="fieldset-legend">{t('flc_license.label')}</legend>
            <input
              name="flcLicenseNum"
              type="text"
              pattern="[A-Z0-9-]{4,20}"
              value={state.flcLicenseNum}
              onChange={(e) => actions.setFlcLicenseNum(e.target.value)}
              aria-invalid={state.errors.flcLicenseNum ? true : undefined}
              className={['input w-full', state.errors.flcLicenseNum ? 'input-error' : ''].join(' ')}
            />
            {state.errors.flcLicenseNum ? (
              <p className="label text-error">{state.errors.flcLicenseNum}</p>
            ) : (
              <p className="label">{t('flc_license.help')}</p>
            )}
          </fieldset>
          <fieldset className="fieldset w-full min-w-0">
            <legend className="fieldset-legend">{t('dol_mspa.label')}</legend>
            <input
              name="dolMspaNum"
              type="text"
              maxLength={40}
              value={state.dolMspaNum}
              onChange={(e) => actions.setDolMspaNum(e.target.value)}
              className="input w-full"
            />
          </fieldset>
        </div>
      )}

      {state.licenseType === 'grower' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="fieldset w-full min-w-0">
            <legend className="fieldset-legend">{t('ein.label')}</legend>
            <input
              name="ein"
              type="text"
              inputMode="numeric"
              pattern="\d{2}-\d{7}"
              placeholder="XX-XXXXXXX"
              maxLength={10}
              value={state.ein}
              onChange={(e) => actions.setEin(e.target.value)}
              aria-invalid={state.errors.ein ? true : undefined}
              className={['input w-full', state.errors.ein ? 'input-error' : ''].join(' ')}
            />
            {state.errors.ein ? (
              <p className="label text-error">{state.errors.ein}</p>
            ) : (
              <p className="label">{t('ein.help')}</p>
            )}
          </fieldset>
          <fieldset className="fieldset w-full min-w-0">
            <legend className="fieldset-legend">{t('county.label')}</legend>
            <select
              name="county"
              value={state.county}
              onChange={(e) => actions.setCounty(e.target.value)}
              className="select w-full"
            >
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </fieldset>
        </div>
      )}

      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">{t('programs.label')}</legend>
        <CheckboxCard
          variant="check"
          checked={state.participatesInH2a}
          onChange={actions.setParticipatesInH2a}
          title={t('programs.h2a_label')}
          description={t('programs.h2a_help')}
        />
      </fieldset>
    </div>
  );
}
