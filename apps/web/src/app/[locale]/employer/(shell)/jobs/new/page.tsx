import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { JobForm } from '@/components/employer/JobForm';
import {
  getEmployerProfile,
  getEmployerJob,
  verificationStatus,
  listCrops,
  listRoleTypes,
  listSkills,
  listEmployerContacts,
} from '@/lib/api/employer';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'employer.jobs.list' });
  return { title: `AgConn — ${t('new_posting')}` };
}

export default async function NewJobPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const [profile, crops, roleTypes, skills, contacts] = await Promise.all([
    getEmployerProfile(),
    listCrops(),
    listRoleTypes(),
    listSkills(),
    listEmployerContacts(),
  ]);
  const canPublish = profile ? verificationStatus(profile) === 'verified' : false;

  // Duplicate-from-template support: copy almost everything except dates +
  // status-specific fields. Caller passes `?from=<jobId>`.
  const source = sp.from ? await getEmployerJob(sp.from) : null;
  const initial = source
    ? { ...source, id: '', startDate: '', endDate: null, status: 'draft' as const }
    : undefined;

  return (
    <div className="pb-16 pt-8">
      <JobForm
        locale={locale}
        mode="create"
        canPublish={canPublish}
        initial={initial}
        profile={profile}
        crops={crops}
        roleTypes={roleTypes}
        skills={skills}
        contacts={contacts}
      />
    </div>
  );
}
