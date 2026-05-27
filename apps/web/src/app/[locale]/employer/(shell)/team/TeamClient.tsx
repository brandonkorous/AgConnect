'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { hasPermission } from '@agconn/schemas';
import { useMembersSuspense, useMyMembershipsSuspense } from '@/lib/api/hooks/members';
import { TeamRoster } from '@/components/employer/team/TeamRoster';
import { SkeletonCard } from '@/components/ui/skeleton';

function TeamInner() {
  const t = useTranslations('employer.team');
  const { data: members } = useMembersSuspense();
  const { data: memberships } = useMyMembershipsSuspense();

  const active = memberships.memberships.find(
    (m) => m.employerId === memberships.activeEmployerId,
  );
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
        <p className="text-base-content/70 mt-2 max-w-2xl text-sm">{t('subtitle')}</p>
      </div>

      <TeamRoster members={members} canManage={canManage} />
    </div>
  );
}

export function TeamClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <TeamInner />
    </Suspense>
  );
}
