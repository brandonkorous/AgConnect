import { getTranslations } from 'next-intl/server';
import { fetchApplications } from '@/lib/api/applications';
import { MyApplicationsList } from '@/components/field/applications/MyApplicationsList';

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function FieldApplicationsPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.applications' });
    // Fetch every application; the list component partitions by status into
    // Active / Hired / Past tabs so a hired worker can still see the job.
    const { applications } = await fetchApplications('all');

    return (
        <div className="space-y-4">
            <div className="px-1">
                <h1 className="text-base-content text-2xl font-semibold leading-tight">
                    {t('title')}
                </h1>
                <p className="text-base-content/70 mt-1 text-sm">{t('subtitle')}</p>
            </div>
            <MyApplicationsList locale={locale} applications={applications} />
        </div>
    );
}
