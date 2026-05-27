'use client';

import { useTranslations } from 'next-intl';
import { useAddressPinDropFallback } from '@/components/ui/useAddressPinDropFallback';
import { useOnboardingForm } from './onboarding/useOnboardingForm';
import { IdentitySection } from './onboarding/sections/IdentitySection';
import { RegulatorySection } from './onboarding/sections/RegulatorySection';
import { AddressSection } from './onboarding/sections/AddressSection';
import { ContactSection } from './onboarding/sections/ContactSection';
import { SuccessCard } from './onboarding/SuccessCard';

const CV_PROXIMITY: [number, number] = [-119.78, 36.74];

type Props = { locale: string };

export function OnboardingForm({ locale }: Props) {
    const t = useTranslations('employer.onboarding');
    const { state, actions } = useOnboardingForm(locale);
    const pinDrop = useAddressPinDropFallback(CV_PROXIMITY);

    if (state.done) {
        return <SuccessCard onContinue={actions.goToDashboard} />;
    }

    return (
        <form onSubmit={actions.onSubmit} className="w-full" noValidate>
            {state.errors._root && (
                <div role="alert" className="alert alert-error alert-soft mb-5 text-sm">
                    {state.errors._root}
                </div>
            )}

            <IdentitySection state={state} actions={actions} />
            <RegulatorySection state={state} actions={actions} />
            <AddressSection
                locale={locale}
                state={state}
                actions={actions}
                pinDropRequest={pinDrop.request}
                pinDropModal={pinDrop.modal}
            />
            <ContactSection state={state} actions={actions} />

            <button
                type="submit"
                disabled={state.submitting}
                className="btn btn-primary mt-6 w-full rounded-full font-semibold"
            >
                {state.submitting ? '…' : t('submit')}
            </button>
        </form>
    );
}
