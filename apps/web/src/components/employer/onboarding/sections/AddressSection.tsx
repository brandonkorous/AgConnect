'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AddressAutocomplete, type AddressLabels, type AddressValue } from '@agconn/ui';
import type { OnboardingFormActions, OnboardingFormState } from '../useOnboardingForm';

const CV_PROXIMITY: [number, number] = [-119.78, 36.74];

type Props = {
  locale: string;
  state: OnboardingFormState;
  actions: OnboardingFormActions;
  pinDropRequest: () => Promise<AddressValue | null>;
  pinDropModal: ReactNode;
};

export function AddressSection({ locale, state, actions, pinDropRequest, pinDropModal }: Props) {
  const t = useTranslations('employer.onboarding');
  const tShared = useTranslations('shell.address');

  const labels: AddressLabels = {
    placeholder: tShared('placeholder'),
    searching: tShared('searching'),
    noMatches: tShared('noMatches'),
    suggestionsAria: tShared('suggestions.aria'),
    selectedAria: tShared('selected.aria'),
    pinFallback: tShared('dropPin.fallbackLink'),
    edit: tShared('edit'),
  };

  return (
    <div className="border-base-300 border-t pt-5">
      <div className="w-full min-w-0">
        <AddressAutocomplete
          label={t('address.label')}
          labels={labels}
          hint={t('address.help')}
          proximity={CV_PROXIMITY}
          language={locale === 'es' ? 'es' : 'en'}
          value={state.address}
          onChange={actions.setAddress}
          errorMessage={state.errors.address ?? null}
          onPinDropRequested={pinDropRequest}
        />
      </div>
      {pinDropModal}
    </div>
  );
}
