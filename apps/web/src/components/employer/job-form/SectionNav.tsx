'use client';

// Sticky left rail at xl+. At lg it becomes horizontal scrollable tabs above
// the form. At sm it's a daisyUI `select` dropdown jump-to (rendered by the
// parent layout as a separate component to keep markup simple).

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Section = { num: number; key: string; href: string };

type Props = {
  sections: Section[];
};

export function SectionNav({ sections }: Props) {
  const t = useTranslations('employer.jobs.form_v2');
  const [activeId, setActiveId] = useState<string>(sections[0]?.href ?? '');

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.href.replace(/^#/, '')))
      .filter((x): x is HTMLElement => x != null);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)[0];
        if (visible) setActiveId(`#${visible.target.id}`);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label={t('section_nav_label')} className="hidden xl:block">
      <div className="text-base-content/60 px-2.5 pb-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em]">
        {t('sections_heading')}
      </div>
      <ul className="space-y-0.5">
        {sections.map((s) => {
          const active = activeId === s.href;
          return (
            <li key={s.key}>
              <a
                href={s.href}
                className={[
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm no-underline transition-colors',
                  active
                    ? 'bg-primary/10 text-primary-content/90'
                    : 'text-base-content/70 hover:bg-base-200',
                ].join(' ')}
              >
                <span className="text-base-content/50 font-mono text-[10.5px] font-bold">
                  {String(s.num).padStart(2, '0')}
                </span>
                <span className={active ? 'font-semibold' : 'font-medium'}>
                  {t(`section_${s.key}_title`)}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <div className="bg-primary/10 text-primary mt-4 rounded-xl p-3 text-xs leading-relaxed">
        <strong className="font-mono text-[10px] font-bold uppercase tracking-[0.06em]">
          {t('tip_label')}
        </strong>
        <div className="mt-1">{t('tip_body')}</div>
      </div>
    </nav>
  );
}
