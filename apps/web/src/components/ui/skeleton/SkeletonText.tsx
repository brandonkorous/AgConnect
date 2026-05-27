'use client';

import { Skeleton } from './Skeleton';

// Multi-line text placeholder. Last line is shorter to mimic real paragraph
// shape; lines and shrinkLast are configurable.

type Props = {
  lines?: number;
  lineHeight?: string | number;
  shrinkLast?: boolean;
  className?: string;
};

export function SkeletonText({
  lines = 3,
  lineHeight = '0.85rem',
  shrinkLast = true,
  className,
}: Props) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          h={lineHeight}
          w={shrinkLast && i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}
