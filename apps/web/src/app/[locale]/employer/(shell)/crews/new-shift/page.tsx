import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NewShiftPage } from '@/components/employer/crews/new-shift/NewShiftPage';
import { listCrews } from '@/lib/api/employer-ops';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ crewId?: string; date?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.crews.new_shift' });
    return { title: `AgConn — ${t('title')}` };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function NewShiftRoute({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    const crews = await listCrews();
    const defaultCrewId = sp.crewId && crews.some((c) => c.id === sp.crewId) ? sp.crewId : undefined;
    const defaultDate = sp.date && DATE_RE.test(sp.date) ? sp.date : undefined;
    return (
        <NewShiftPage
            locale={locale}
            crews={crews}
            defaultCrewId={defaultCrewId}
            defaultDate={defaultDate}
        />
    );
}
