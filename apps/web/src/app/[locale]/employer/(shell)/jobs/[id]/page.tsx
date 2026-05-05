import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
    getEmployerJob,
    getEmployerProfile,
    verificationStatus,
    listCrops,
    listRoleTypes,
    listSkills,
    listEmployerContacts,
} from '@/lib/api/employer';
import { JobForm } from '@/components/employer/JobForm';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
    return { title: `AgConn — ${t('edit_posting')}` };
}

export default async function EditJobPage({ params }: Props) {
    const { locale, id } = await params;
    const [job, profile, crops, roleTypes, skills, contacts] = await Promise.all([
        getEmployerJob(id),
        getEmployerProfile(),
        listCrops(),
        listRoleTypes(),
        listSkills(),
        listEmployerContacts(),
    ]);
    if (!job) notFound();
    const canPublish = profile ? verificationStatus(profile) === 'verified' : false;

    return (
        <div className=" px-5 pb-16 pt-8">
            <JobForm
                locale={locale}
                mode="edit"
                canPublish={canPublish}
                initial={job}
                profile={profile}
                crops={crops}
                roleTypes={roleTypes}
                skills={skills}
                contacts={contacts}
            />
        </div>
    );
}
