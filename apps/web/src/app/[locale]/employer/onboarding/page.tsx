import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { requireRole, UserRole } from '@/lib/auth/role';
import { AccountChip } from '@/components/shell/AccountChip';
import { OnboardingForm } from '@/components/employer/OnboardingForm';
import { Wordmark } from '@/components/primitives/Wordmark';
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
    const altLocale = locale === 'es' ? 'en' : 'es';
    const altHref = `/${altLocale}/employer/onboarding` as Route;
    return (
        <main className="bg-base-200 relative isolate flex min-h-[100dvh] flex-col px-4 py-8 sm:px-8">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    backgroundImage:
                        'radial-gradient(circle at 12% 8%, oklch(83% 0.13 88 / 0.18) 0%, transparent 55%), radial-gradient(circle at 92% 96%, oklch(67% 0.18 145 / 0.10) 0%, transparent 60%)',
                }}
            />

            <header className="mx-auto flex w-full max-w-xl items-center justify-between">
                <Link
                    href={`/${locale}`}
                    className="text-base-content no-underline"
                    aria-label="AgConn"
                >
                    <Wordmark size="sm" tone="ink" />
                </Link>
                <div className="flex items-center gap-2">
                    <Link
                        href={altHref}
                        prefetch={false}
                        aria-label={t('locale_switch_aria')}
                        className="bg-base-100 border-base-300 text-base-content/70 hover:text-base-content inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold tracking-wider no-underline"
                    >
                        <FontAwesomeIcon icon={faGlobe} className="h-3 w-3" />
                        {altLocale.toUpperCase()}
                    </Link>
                    <AccountChip
                        locale={locale}
                        labels={{
                            ariaLabel: t('account_chip.aria_label'),
                            signedInAs: t('account_chip.signed_in_as'),
                            signOut: t('account_chip.sign_out'),
                        }}
                    />
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center py-6">
                <OnboardingForm locale={locale} />
            </div>
        </main>
    );
}
