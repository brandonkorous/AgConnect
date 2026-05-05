import { getTranslations } from 'next-intl/server';
import { fetchRecommendedJobs } from '@/lib/api/jobs';
import { ApplyList } from '@/components/field/apply/ApplyList';

type Props = {
    params: Promise<{ locale: string }>;
};

export default async function FieldApplyPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'worker.field.apply' });
    const jobs = await fetchRecommendedJobs();

    return (
        <div className="space-y-4">
            <div className="px-1">
                <h1 className="text-base-content text-2xl font-semibold leading-tight">
                    {t('title')}
                </h1>
                <p className="text-base-content/70 mt-1 text-sm">{t('subtitle')}</p>
            </div>
            <ApplyList locale={locale} jobs={jobs} />
        </div>
    );
}
