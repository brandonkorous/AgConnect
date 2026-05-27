'use client';

import { Skeleton } from './Skeleton';
import { SkeletonText } from './SkeletonText';

// List-row placeholder: optional avatar/icon on the left, title + subtitle
// stacked. Matches the common pattern for shift rows, application rows,
// message thread rows.

type Props = {
  withAvatar?: boolean;
  withTrailing?: boolean;
};

export function SkeletonRow({ withAvatar = true, withTrailing = false }: Props) {
  return (
    <div className="flex items-center gap-3 p-3">
      {withAvatar && <Skeleton w="2.25rem" h="2.25rem" r="9999px" />}
      <div className="flex-1 min-w-0">
        <SkeletonText lines={2} />
      </div>
      {withTrailing && <Skeleton w="3rem" h="1rem" />}
    </div>
  );
}
