import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import {
    getEmployerProfile,
    getDashboardStats,
    listEmployerJobs,
    listInbox,
    getBilling,
    verificationStatus,
} from '@/lib/api/employer';
import { EmployerGreeting } from '@/components/employer/dashboard/EmployerGreeting';
import { EmployerKpiRow } from '@/components/employer/dashboard/EmployerKpiRow';
import { FeaturedPostingHero } from '@/components/employer/dashboard/FeaturedPostingHero';
import { HiringPipelineBoard } from '@/components/employer/dashboard/HiringPipelineBoard';
import { ActiveJobsBoard } from '@/components/employer/dashboard/ActiveJobsBoard';
import { BillingSnapshot } from '@/components/employer/dashboard/BillingSnapshot';
import { VerificationCard } from '@/components/employer/dashboard/VerificationCard';
import { TopApplicantsCard } from '@/components/employer/dashboard/TopApplicantsCard';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.dashboard.meta' });
    return { title: t('title') };
}

export default async function EmployerDashboardPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.dashboard' });

    const [profile, stats, jobs, applicants, billing] = await Promise.all([
        getEmployerProfile(),
        getDashboardStats(),
        listEmployerJobs(),
        listInbox(),
        getBilling(),
    ]);

    if (!profile) {
        return null;
    }

    const status = verificationStatus(profile);
    const firstName =
        (profile.contactEmail?.split('@')[0] ?? profile.displayName.split(/\s+/)[0] ?? '')
            .replace(/[._-]+/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase())
            .split(' ')[0] ?? '';

    const activePostings = jobs.filter((j) => j.status === 'active').length;
    const totalSeats = jobs
        .filter((j) => j.status === 'active' || j.status === 'draft')
        .reduce((sum, j) => sum + j.positionsTotal, 0);

    const newApplicants = applicants.filter((a) => a.status === 'applied').length;
    const summaryLine = t('summary', {
        open: activePostings,
        applicants: newApplicants,
        spots: stats.spotsRemaining,
    });

    const featured = pickFeaturedJob(jobs);

    return (
        <div className="px-5 pb-16 pt-8">
            <EmployerGreeting
                locale={locale}
                firstName={firstName}
                county={profile.county}
                companyName={profile.displayName}
                summaryLine={summaryLine}
            />

            <EmployerKpiRow
                locale={locale}
                stats={stats}
                activePostings={activePostings}
                totalSeatsThisWeek={totalSeats}
            />

            {featured && (
                <FeaturedPostingHero locale={locale} job={featured} applicants={applicants} />
            )}

            <HiringPipelineBoard locale={locale} applicants={applicants} />

            <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
                <div className="grid gap-5">
                    <ActiveJobsBoard locale={locale} jobs={jobs} />
                </div>
                <div className="grid gap-3.5">
                    {billing && <BillingSnapshot locale={locale} billing={billing} />}
                    <VerificationCard locale={locale} profile={profile} status={status} />
                    <TopApplicantsCard locale={locale} applicants={applicants} />
                </div>
            </div>
        </div>
    );
}

function pickFeaturedJob(
    jobs: Awaited<ReturnType<typeof listEmployerJobs>>,
): Awaited<ReturnType<typeof listEmployerJobs>>[number] | null {
    const candidates = jobs
        .filter((j) => j.status === 'active' || j.status === 'filled')
        .sort((a, b) => {
            const aScore = openSeats(a) > 0 ? 1000 - new Date(a.startDate).getTime() / 1e9 : -1;
            const bScore = openSeats(b) > 0 ? 1000 - new Date(b.startDate).getTime() / 1e9 : -1;
            if (aScore !== bScore) return bScore - aScore;
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
    return candidates[0] ?? null;
}

function openSeats(j: { positionsTotal: number; hireCount: number }): number {
    return Math.max(0, j.positionsTotal - j.hireCount);
}
