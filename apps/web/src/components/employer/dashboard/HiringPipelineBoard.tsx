import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ApplicantCardView } from '@/lib/api/employer';
import {
    HiringPipelineBoard as PipelineBoard,
    type PipelineLane,
} from '@/components/employer/primitives';

type Props = {
    locale: string;
    applicants: ApplicantCardView[];
};

const LANE_KEYS = ['applied', 'reviewed', 'hired'] as const;

function swatchClass(key: (typeof LANE_KEYS)[number]): string {
    switch (key) {
        case 'applied':
            return 'bg-base-content/30';
        case 'reviewed':
            return 'bg-info';
        case 'hired':
            return 'bg-success';
    }
}

export async function HiringPipelineBoard({ locale, applicants }: Props) {
    const t = await getTranslations({ locale, namespace: 'employer.dashboard.pipeline' });
    const tStatus = await getTranslations({ locale, namespace: 'employer.kanban' });

    const lanes: PipelineLane[] = LANE_KEYS.map((key) => {
        const items = applicants
            .filter((a) => a.status === key)
            .map((a) => ({
                id: a.id,
                firstName: a.worker.firstName,
                lastInitial: a.worker.lastInitial,
                appliedAt: a.appliedAt,
                jobTitle: locale === 'es' ? a.job.titleEs : a.job.titleEn,
                href: `/${locale}/employer/applications/${a.id}`,
                status: key,
                matchLabel: `${a.worker.skillsMatchCount} ${t('match')}`,
            }));
        return {
            key,
            label: tStatus(key),
            items,
            emptyCopy: t('empty_lane'),
            swatch: swatchClass(key),
        };
    });

    const total = applicants.length;

    return (
        <section className="mb-7">
            <div className="mb-3.5 flex items-end justify-between">
                <div>
                    <h2 className="font-display text-2xl font-light tracking-tight">{t('title')}</h2>
                    <div className="text-base-content/60 mt-1 text-xs">{t('subtitle', { count: total })}</div>
                </div>
                <Link
                    href={`/${locale}/employer/inbox`}
                    className="text-primary text-sm font-semibold"
                >
                    {t('open_full')} →
                </Link>
            </div>
            <PipelineBoard lanes={lanes} moreLabel={t('more')} />
        </section>
    );
}
