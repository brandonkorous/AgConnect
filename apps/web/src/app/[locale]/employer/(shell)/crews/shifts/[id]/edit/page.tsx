import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getShift, listCrews, listActiveHires } from '@/lib/api/employer-ops';
import { EditShiftPage } from '@/components/employer/crews/edit-shift/EditShiftPage';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.crews.edit_shift' });
    return { title: `AGCONN — ${t('title')}` };
}

export default async function EditShiftRoute({ params }: Props) {
    const { locale, id } = await params;
    const [detail, crews, hires] = await Promise.all([
        getShift(id),
        listCrews(),
        listActiveHires(),
    ]);
    if (!detail) notFound();
    return (
        <EditShiftPage
            locale={locale}
            shift={detail.shift}
            assignments={detail.assignments}
            crews={crews}
            hires={hires}
        />
    );
}
