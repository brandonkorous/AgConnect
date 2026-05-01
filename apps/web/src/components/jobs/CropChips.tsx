import { useTranslations } from 'next-intl';
import { CropGlyph } from './CropGlyph';

const CROPS: Array<{ key: string; n: number }> = [
  { key: 'grape', n: 38 },
  { key: 'almond', n: 24 },
  { key: 'tomato', n: 19 },
  { key: 'citrus', n: 31 },
  { key: 'strawberry', n: 12 },
  { key: 'lettuce', n: 18 },
];

export function CropChips() {
  const t = useTranslations('worker.jobs.browse.crop');
  return (
    <div className="thin-scroll mb-[22px] flex gap-2.5 overflow-x-auto pb-1">
      {CROPS.map(({ key, n }) => (
        <button
          type="button"
          key={key}
          className="border-base-300 hover:border-primary/40 flex shrink-0 items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition-colors"
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
      ))}
    </div>
  );
}
