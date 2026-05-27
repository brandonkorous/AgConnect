'use client';

import { Skeleton } from './Skeleton';

// Pill-shaped placeholder matching the Tierra filter-chip shape (radius-field
// = 9999px). Used for status chips, tag chips, filter chips.

type Props = {
  w?: string | number;
  h?: string | number;
};

export function SkeletonChip({ w = '4.5rem', h = '1.25rem' }: Props) {
  return <Skeleton w={w} h={h} r="9999px" />;
}
