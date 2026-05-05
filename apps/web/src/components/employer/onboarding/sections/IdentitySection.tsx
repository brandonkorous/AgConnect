'use client';

import { useTranslations } from 'next-intl';
import { faSeedling, faPeopleGroup, faTractor } from '@fortawesome/free-solid-svg-icons';
import { RadioCard } from '@/components/employer/primitives';
import type { LicenseType, OnboardingFormActions, OnboardingFormState } from '../useOnboardingForm';

type Props = {
  state: OnboardingFormState;
  actions: OnboardingFormActions;
};

export function IdentitySection({ state, actions }: Props) {
  const t = useTranslations('employer.onboarding');

  return (
    <div className="grid grid-cols-1 gap-5">
      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">{t('legal_name.label')}</legend>
        <input
          name="legalName"
          type="text"
          minLength={2}
          maxLength={120}
          autoComplete="organization"
          value={state.legalName}
          onChange={(e) => actions.setLegalName(e.target.value)}
          aria-invalid={state.errors.legalName ? true : undefined}
          className={['input w-full', state.errors.legalName ? 'input-error' : ''].join(' ')}
        />
        {state.errors.legalName ? (
          <p className="label text-error">{state.errors.legalName}</p>
        ) : (
          <p className="label">{t('legal_name.help')}</p>
        )}
      </fieldset>

      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">{t('dba_name.label')}</legend>
        <input
          name="dbaName"
          type="text"
          maxLength={120}
          value={state.dbaName}
          onChange={(e) => actions.setDbaName(e.target.value)}
          className="input w-full"
        />
        <p className="label">{t('dba_name.help')}</p>
      </fieldset>

      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">{t('type.label')}</legend>
        <div className="grid gap-2">
          <RadioCard<LicenseType>
            name="licenseType"
            value="grower"
            icon={faSeedling}
            title={t('type.grower')}
            description={t('type.grower_help')}
            checked={state.licenseType === 'grower'}
            onChange={actions.setLicenseType}
          />
          <RadioCard<LicenseType>
            name="licenseType"
            value="flc"
            icon={faPeopleGroup}
            title={t('type.flc')}
            description={t('type.flc_help')}
            checked={state.licenseType === 'flc'}
            onChange={actions.setLicenseType}
          />
          <RadioCard<LicenseType>
            name="licenseType"
            value="labor_contractor"
            icon={faTractor}
            title={t('type.labor_contractor')}
            description={t('type.labor_contractor_help')}
            checked={state.licenseType === 'labor_contractor'}
            onChange={actions.setLicenseType}
          />
        </div>
      </fieldset>
    </div>
  );
}
