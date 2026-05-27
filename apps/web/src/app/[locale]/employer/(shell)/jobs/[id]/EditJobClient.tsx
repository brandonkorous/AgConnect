'use client';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { useLocale } from 'next-intl';
import { JobForm } from '@/components/employer/JobForm';
import {
  useEmployerJobSuspense,
  useEmployerProfileSuspense,
  useCropsSuspense,
  useRoleTypesSuspense,
  useSkillsLookupSuspense,
  useEmployerContactsSuspense,
  verificationStatus,
} from '@/lib/api/hooks/employer';
import { SkeletonCard } from '@/components/ui/skeleton';

function EditJobInner({ id }: { id: string }) {
  const locale = useLocale();
  const { data: job } = useEmployerJobSuspense(id);
  const { data: profile } = useEmployerProfileSuspense();
  const { data: crops } = useCropsSuspense();
  const { data: roleTypes } = useRoleTypesSuspense();
  const { data: skills } = useSkillsLookupSuspense();
  const { data: contacts } = useEmployerContactsSuspense();
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

export function EditJobClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <EditJobInner id={id} />
    </Suspense>
  );
}
