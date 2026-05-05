'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';
import { ProfilePhotoSection } from './ProfilePhotoSection';
import { PersonalInfoSection } from './PersonalInfoSection';
import { EmailsSection } from './EmailsSection';
import { PhoneNumbersSection } from './PhoneNumbersSection';
import { ConnectedAccountsSection } from './ConnectedAccountsSection';
import { PasswordSection } from './PasswordSection';
import { TwoStepVerificationSection } from './TwoStepVerificationSection';
import { ActiveDevicesSection } from './ActiveDevicesSection';
import { DangerZoneSection } from './DangerZoneSection';

type Props = {
    locale: string;
    activeTab: 'profile' | 'security';
    firstName: string;
    businessName: string;
};

export function AccountSurface({ locale, activeTab, firstName, businessName }: Props) {
    const t = useTranslations('employer.account');
    const { isLoaded, user } = useUser();

    const profileHref = `/${locale}/employer/account` as Route;
    const securityHref = `/${locale}/employer/account/security` as Route;

    const eyebrow =
        locale === 'es'
            ? `CUENTA${firstName ? ` · ${firstName}` : ''}`
            : `BUSINESS ACCOUNT${firstName ? ` · ${firstName}` : ''}`;

    return (
        <div className=" px-5 pb-16 pt-8">
            <div className="mb-7 max-w-3xl">
                <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                    {eyebrow}
                </p>
                <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                    {t('title_a')}{' '}
                    <em className="text-primary not-italic font-light">{t('title_b')}</em>
                </h1>
                <p className="text-base-content/70 mt-3 text-base">{t('subtitle')}</p>
            </div>

            <div role="tablist" className="tabs tabs-bordered mb-8 max-w-3xl">
                <Link
                    role="tab"
                    href={profileHref}
                    className={[
                        'tab',
                        activeTab === 'profile' ? 'tab-active text-primary' : '',
                    ].join(' ')}
                >
                    {t('tab_profile')}
                </Link>
                <Link
                    role="tab"
                    href={securityHref}
                    className={[
                        'tab',
                        activeTab === 'security' ? 'tab-active text-primary' : '',
                    ].join(' ')}
                >
                    {t('tab_security')}
                </Link>
            </div>

            {!isLoaded || !user ? (
                <div className="border-base-300 bg-base-100 max-w-3xl rounded-2xl border p-6">
                    <div className="bg-base-200 mb-3 h-4 w-40 animate-pulse rounded" />
                    <div className="bg-base-200 h-4 w-72 animate-pulse rounded" />
                </div>
            ) : activeTab === 'profile' ? (
                <div className="grid max-w-3xl gap-5">
                    <ProfilePhotoSection user={user} />
                    <PersonalInfoSection user={user} />
                    <EmailsSection user={user} />
                    <PhoneNumbersSection user={user} />
                    <ConnectedAccountsSection user={user} locale={locale} />
                </div>
            ) : (
                <div className="grid max-w-3xl gap-5">
                    <PasswordSection user={user} />
                    <TwoStepVerificationSection user={user} />
                    <ActiveDevicesSection user={user} locale={locale} />
                    <DangerZoneSection
                        user={user}
                        locale={locale}
                        businessName={businessName}
                    />
                </div>
            )}
        </div>
    );
}
