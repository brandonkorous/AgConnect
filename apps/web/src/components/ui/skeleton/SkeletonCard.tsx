'use client';

import { Skeleton } from './Skeleton';
import { SkeletonText } from './SkeletonText';

// Generic card placeholder. Used for secondary surfaces where a hand-shaped
// domain skeleton would be overkill. Primary surfaces (dashboard KPI row,
// up-next shift, matched jobs) get domain-specific skeletons under
// components/ui/skeleton/domain/.

type Props = {
  withTitle?: boolean;
  rows?: number;
  className?: string;
};

export function SkeletonCard({ withTitle = true, rows = 3, className }: Props) {
  return (
    <div
      className={`card bg-base-100 border border-base-300 p-4 flex flex-col gap-3 ${className ?? ''}`}
    >
      {withTitle && <Skeleton h="1.25rem" w="40%" />}
      <SkeletonText lines={rows} />
    </div>
  );
}
