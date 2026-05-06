'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Route } from 'next';
import { CropGlyph } from './CropGlyph';

const CROP_KEYS = ['grape', 'almond', 'tomato', 'citrus', 'strawberry', 'lettuce'] as const;
type CropKey = (typeof CROP_KEYS)[number];

type Props = {
  counts: Record<CropKey, number>;
};

export function CropChips({ counts }: Props) {
  const t = useTranslations('worker.jobs.browse.crop');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSkills = (searchParams.get('skills') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  function toggle(skill: string) {
    const has = activeSkills.includes(skill);
    const nextSkills = has
      ? activeSkills.filter((s) => s !== skill)
      : [...activeSkills, skill];
    const next = new URLSearchParams(searchParams);
    next.delete('cursor');
    if (nextSkills.length > 0) next.set('skills', nextSkills.join(','));
    else next.delete('skills');
    const qs = next.toString();
    router.push((qs ? `${pathname}?${qs}` : pathname) as Route);
  }

  return (
    <div className="thin-scroll mb-[22px] flex gap-2.5 overflow-x-auto pb-1">
      {CROP_KEYS.map((key) => {
        const n = counts[key] ?? 0;
        const active = activeSkills.includes(key);
        return (
          <button
            type="button"
            key={key}
            aria-pressed={active}
            onClick={() => toggle(key)}
            className={[
              'flex shrink-0 items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition-colors',
              active
                ? 'border-primary bg-primary/5'
                : 'border-base-300 hover:border-primary/40',
            ].join(' ')}
            style={{ minWidth: 140 }}
          >
            <div className="bg-base-200 grid h-9 w-9 shrink-0 place-items-center rounded-[10px]">
              <CropGlyph crop={key} size={22} />
            </div>
            <div>
              <div className="text-[13px] font-semibold">
                {t(`${key}` as 'grape')}
              </div>
              <div className="text-base-content/60 font-mono text-[11px]">
                {t('open', { n })}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
