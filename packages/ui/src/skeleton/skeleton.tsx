import type { CSSProperties } from 'react';

export type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

const base =
  'block bg-base-300/60 motion-safe:animate-pulse rounded-md';

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <span aria-hidden className={`${base} ${className}`.trim()} style={style} />;
}

export function SkeletonBlock({ className = '', style }: SkeletonProps) {
  return <div aria-hidden className={`${base} ${className}`.trim()} style={style} />;
}

export function SkeletonAvatar({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`${base} rounded-full ${className}`.trim()}
      style={{ width: size, height: size, display: 'inline-block' }}
    />
  );
}
