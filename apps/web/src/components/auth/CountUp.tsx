'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  to: number;
  durationMs?: number;
  suffix?: string;
};

export function CountUp({ to, durationMs = 750, suffix = '' }: Props) {
  // SSR + first client paint render the final value to avoid layout jump.
  // After mount, replay 0 → target unless the user prefers reduced motion.
  const [n, setN] = useState<number>(to);
  const played = useRef(false);

  useEffect(() => {
    if (played.current || to === 0) return;
    played.current = true;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let raf = 0;
    setN(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);

  return (
    <span>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}
