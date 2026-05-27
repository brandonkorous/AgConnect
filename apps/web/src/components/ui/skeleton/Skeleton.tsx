'use client';

// Base skeleton block. Tierra-styled: hairline border, base-200 fill,
// subtle pulse. Domain-specific skeleton compositions in
// components/ui/skeleton/domain/* compose from this.

type Props = {
  w?: string | number;
  h?: string | number;
  r?: string | number;
  className?: string;
};

function toSize(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

export function Skeleton({ w, h = '1rem', r = '0.25rem', className }: Props) {
  return (
    <div
      aria-hidden
      className={`bg-base-200 border border-base-300 animate-pulse motion-reduce:animate-none ${className ?? ''}`}
      style={{
        width: toSize(w) ?? '100%',
        height: toSize(h),
        borderRadius: toSize(r),
      }}
    />
  );
}
