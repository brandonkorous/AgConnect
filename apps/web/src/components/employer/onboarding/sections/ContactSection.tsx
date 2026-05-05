'use client';

import { useTranslations } from 'next-intl';
import type { OnboardingFormActions, OnboardingFormState } from '../useOnboardingForm';

type Props = {
  state: OnboardingFormState;
  actions: OnboardingFormActions;
};

export function ContactSection({ state, actions }: Props) {
  const t = useTranslations('employer.onboarding');

  return (
    <div className="border-base-300 grid grid-cols-1 gap-5 border-t pt-5 sm:grid-cols-2">
      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">{t('contact_email.label')}</legend>
        <input
          name="contactEmail"
          type="email"
          maxLength={255}
          autoComplete="email"
          value={state.contactEmail}
          onChange={(e) => actions.setContactEmail(e.target.value)}
          className="input w-full"
        />
      </fieldset>
      <fieldset className="fieldset w-full min-w-0">
        <legend className="fieldset-legend">{t('contact_phone.label')}</legend>
        <input
          name="contactPhone"
          type="tel"
          maxLength={20}
          autoComplete="tel"
          value={state.contactPhone}
          onChange={(e) => actions.setContactPhone(e.target.value)}
          className="input w-full"
        />
      </fieldset>
    </div>
  );
}
