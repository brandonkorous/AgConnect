import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { hasPermission } from '@agconn/schemas';
import { listMembers, getMyMemberships } from '@/lib/api/members';
import { TeamRoster } from '@/components/employer/team/TeamRoster';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.team' });
    return { title: `AGCONN — ${t('title')}` };
}

export default async function EmployerTeamPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.team' });

    const [members, { activeEmployerId, memberships }] = await Promise.all([
        listMembers(),
        getMyMemberships(),
    ]);

    const active = memberships.find((m) => m.employerId === activeEmployerId);
    const canManage = hasPermission(active?.permissions ?? [], 'members.manage');

    return (
        <div className="px-5 pb-16 pt-8">
            <div className="mb-7">
                <p className="text-base-content/60 font-mono text-xs uppercase tracking-wider">
                    {t('eyebrow')}
                </p>
                <h1 className="font-display mt-2 text-4xl font-light leading-tight tracking-tight md:text-5xl">
                    {t('title_a')}{' '}
                    <em className="text-primary not-italic font-light">{t('title_b')}</em>
                </h1>
                <p className="text-base-content/70 mt-2 max-w-2xl text-sm">
                    {t('subtitle')}
                </p>
            </div>

            <TeamRoster members={members} canManage={canManage} />
        </div>
    );
}
