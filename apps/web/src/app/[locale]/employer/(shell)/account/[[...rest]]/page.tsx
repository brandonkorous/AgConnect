import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UserProfile } from '@clerk/nextjs';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.account' });
    return { title: `AgConn — ${t('title')}` };
}

export default async function EmployerAccountPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.account' });

    return (
        <div className="px-5 pb-16 pt-8">
            <div className="mb-7 max-w-3xl">
                <p className="text-base-content/60 font-mono text-[11px] uppercase tracking-wider">
                    {t('eyebrow')}
                </p>
                <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                    {t('title_a')} <em className="text-primary not-italic font-light">{t('title_b')}</em>
                </h1>
                <p className="text-base-content/70 mt-3 text-base">{t('subtitle')}</p>
            </div>

            <UserProfile
                path={`/${locale}/employer/account`}
                appearance={{
                    elements: {
                        rootBox: 'w-full',
                        cardBox: 'w-full max-w-none shadow-none border border-base-300 rounded-2xl',
                    },
                }}
            />
        </div>
    );
}
