import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireRole, UserRole } from '@/lib/auth/role';
import { OnboardingSplitShell } from '@/components/onboarding/OnboardingSplitShell';
import { OnboardingForm } from '@/components/employer/OnboardingForm';
import { getEmployerProfile, verificationStatus } from '@/lib/api/employer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.onboarding' });
    return { title: t('title') };
}

export default async function EmployerOnboardingPage({ params }: Props) {
    const { locale } = await params;
    await requireRole(locale, UserRole.employer);
    const t = await getTranslations({ locale, namespace: 'employer.onboarding' });
    const profile = await getEmployerProfile();
    if (profile && verificationStatus(profile) === 'verified') {
        redirect(`/${locale}/employer/dashboard`);
    }
    return (
        <OnboardingSplitShell
            audience="employer"
            title={t('title')}
            subtitle={t('subtitle')}
            locale={locale}
        >
            <OnboardingForm locale={locale} />
        </OnboardingSplitShell>
    );
}
