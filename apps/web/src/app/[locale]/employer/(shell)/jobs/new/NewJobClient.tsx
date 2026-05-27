'use client';

import { Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { JobForm } from '@/components/employer/JobForm';
import {
  useEmployerProfileSuspense,
  useEmployerJobSuspense,
  useCropsSuspense,
  useRoleTypesSuspense,
  useSkillsLookupSuspense,
  useEmployerContactsSuspense,
  verificationStatus,
} from '@/lib/api/hooks/employer';
import { SkeletonCard } from '@/components/ui/skeleton';

function NewJobInner() {
  const locale = useLocale();
  const sp = useSearchParams();
  const from = sp.get('from') ?? undefined;
  const { data: profile } = useEmployerProfileSuspense();
  const { data: crops } = useCropsSuspense();
  const { data: roleTypes } = useRoleTypesSuspense();
  const { data: skills } = useSkillsLookupSuspense();
  const { data: contacts } = useEmployerContactsSuspense();
  const canPublish = profile ? verificationStatus(profile) === 'verified' : false;

  return (
    <div className=" px-5 pb-16 pt-8">
      {from ? (
        <DuplicateLoader
          fromId={from}
          locale={locale}
          canPublish={canPublish}
          profile={profile}
          crops={crops}
          roleTypes={roleTypes}
          skills={skills}
          contacts={contacts}
        />
      ) : (
        <JobForm
          locale={locale}
          mode="create"
          canPublish={canPublish}
          profile={profile}
          crops={crops}
          roleTypes={roleTypes}
          skills={skills}
          contacts={contacts}
        />
      )}
    </div>
  );
}

function DuplicateLoader({
  fromId,
  locale,
  canPublish,
  profile,
  crops,
  roleTypes,
  skills,
  contacts,
}: {
  fromId: string;
  locale: string;
  canPublish: boolean;
  profile: ReturnType<typeof useEmployerProfileSuspense>['data'];
  crops: ReturnType<typeof useCropsSuspense>['data'];
  roleTypes: ReturnType<typeof useRoleTypesSuspense>['data'];
  skills: ReturnType<typeof useSkillsLookupSuspense>['data'];
  contacts: ReturnType<typeof useEmployerContactsSuspense>['data'];
}) {
  const { data: source } = useEmployerJobSuspense(fromId);
  const initial = source
    ? { ...source, id: '', startDate: '', endDate: null, status: 'draft' as const }
    : undefined;
  return (
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
  );
}

export function NewJobClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <NewJobInner />
    </Suspense>
  );
}
