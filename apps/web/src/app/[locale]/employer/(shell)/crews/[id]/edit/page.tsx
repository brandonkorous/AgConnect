import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCrew, getCrewInsights, listActiveHires } from '@/lib/api/employer-ops';
import { CrewEditorPage } from '@/components/employer/crews/edit-crew/CrewEditorPage';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.crews.edit_crew' });
    const detail = await getCrew(id);
    if (!detail) return { title: `AGCONN — ${t('breadcrumb_edit')}` };
    return { title: `AGCONN — ${detail.crew.name}` };
}

export default async function EditCrewRoute({ params }: Props) {
    const { locale, id } = await params;
    const [detail, insights, hires] = await Promise.all([
        getCrew(id),
        getCrewInsights(id),
        listActiveHires(),
    ]);
    if (!detail) notFound();
    return (
        <CrewEditorPage
            locale={locale}
            mode="edit"
            crew={detail.crew}
            members={detail.members}
            insights={insights}
            hires={hires}
        />
    );
}
