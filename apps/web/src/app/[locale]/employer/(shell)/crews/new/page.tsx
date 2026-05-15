import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { listActiveHires } from '@/lib/api/employer-ops';
import { CrewEditorPage } from '@/components/employer/crews/edit-crew/CrewEditorPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.crews.edit_crew' });
    return { title: `AGCONN — ${t('title_new_a')} ${t('title_new_b')}` };
}

export default async function NewCrewRoute({ params }: Props) {
    const { locale } = await params;
    const hires = await listActiveHires();
    return (
        <CrewEditorPage
            locale={locale}
            mode="new"
            crew={null}
            members={[]}
            insights={{ yield: [], activity: [], skillCoverage: [] }}
            hires={hires}
        />
    );
}
