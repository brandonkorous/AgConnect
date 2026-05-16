import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Wordmark } from '@/components/primitives/Wordmark';
import { AcceptInvite } from '@/components/employer/AcceptInvite';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.accept_invite' });
    return { title: `AGCONN — ${t('title')}` };
}

export default async function AcceptInvitePage({ params, searchParams }: Props) {
    const { locale } = await params;
    const { token } = await searchParams;
    const t = await getTranslations({ locale, namespace: 'employer.accept_invite' });

    return (
        <main className="bg-base-200 grid min-h-screen place-items-center px-5 py-16">
            <div className="bg-base-100 border-base-300 w-full max-w-md rounded-2xl border p-8">
                <Wordmark size="sm" tone="ink" />
                <h1 className="font-display mt-6 text-3xl font-light leading-tight tracking-tight">
                    {t('heading')}
                </h1>
                {!token ? (
                    <p className="text-error mt-3 text-sm">{t('no_token')}</p>
                ) : (
                    <>
                        <p className="text-base-content/70 mt-3 text-sm">{t('intro')}</p>
                        <AcceptInvite token={token} locale={locale} />
                    </>
                )}
            </div>
        </main>
    );
}
