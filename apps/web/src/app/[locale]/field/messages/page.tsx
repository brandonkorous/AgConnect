import { getTranslations } from 'next-intl/server';
import { fetchMyMessageThreads } from '@/lib/api/me';
import { ThreadListItem } from '@/components/field/messages/ThreadListItem';

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function FieldMessagesPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.messages' });
    const { threads } = await fetchMyMessageThreads();

    return (
        <div className="space-y-4">
            <div className="px-1">
                <h1 className="text-base-content text-2xl font-semibold leading-tight">
                    {t('title')}
                </h1>
                <p className="text-base-content/70 mt-1 text-sm">{t('subtitle')}</p>
            </div>
            {threads.length === 0 ? (
                <div className="bg-base-100 border-base-300 rounded-2xl border px-5 py-6 text-center">
                    <h2 className="text-base-content text-xl font-semibold">{t('empty.title')}</h2>
                    <p className="text-base-content/65 mx-auto mt-1.5 max-w-xs text-sm">
                        {t('empty.body')}
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {threads.map((thread) => (
                        <ThreadListItem key={thread.id} locale={locale} thread={thread} />
                    ))}
                </ul>
            )}
        </div>
    );
}
