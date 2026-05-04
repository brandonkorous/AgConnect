'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SECTION_IDS, type SectionId } from './types';

// Sticky left rail. Tracks scroll position via IntersectionObserver so the
// active item highlights as the user scrolls through form sections.
export function SectionNav() {
  const t = useTranslations('employer.crews.edit_shift.section');
  const [active, setActive] = useState<SectionId>('type');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id as SectionId;
            if (SECTION_IDS.includes(id)) setActive(id);
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label={t('nav_aria')}
      className="flex flex-col gap-0.5"
    >
      {SECTION_IDS.map((id) => {
        const on = active === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            aria-current={on ? 'true' : undefined}
            className={[
              'rounded-r-md border-l-2 px-3 py-1.5 text-xs transition',
              on
                ? 'text-primary border-primary bg-primary/10 font-bold'
                : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/40 font-medium',
            ].join(' ')}
          >
            {t(`item.${id}`)}
          </a>
        );
      })}
    </nav>
  );
}
