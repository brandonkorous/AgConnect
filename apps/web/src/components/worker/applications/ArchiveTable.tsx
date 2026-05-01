import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { CropGlyph } from '@/components/jobs/CropGlyph';

export type ArchiveAppRow = {
  id: string;
  crop: string;
  jobTitleEn: string;
  jobTitleEs: string;
  employerName: string;
  date: string;
  result: 'hired' | 'not_selected' | 'withdrawn';
  earned: string | null;
};

const COLS = '1.4fr 1.2fr 0.8fr 1fr 1fr 0.6fr';

type Props = { rows: ArchiveAppRow[]; locale: string };

export function ArchiveTable({ rows, locale }: Props) {
  const t = useTranslations('worker.applications_dense.archive');
  if (rows.length === 0) return null;
  return (
    <>
      <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
      <div className="border-base-300 bg-base-100 overflow-hidden rounded-2xl border opacity-90">
        {rows.map((a, i) => {
          const title = locale === 'es' ? a.jobTitleEs : a.jobTitleEn;
          return (
            <Link
              key={a.id}
              href={`/${locale}/worker/applications/${a.id}`}
              className={[
                'grid items-center gap-4 px-5 py-4 text-[13px] no-underline',
                i < rows.length - 1 ? 'border-base-300 border-b' : '',
              ].join(' ')}
              style={{ gridTemplateColumns: COLS }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-base-200 grid h-8 w-8 shrink-0 place-items-center rounded-lg">
                  <CropGlyph crop={a.crop} size={20} />
                </div>
                <div className="text-base-content truncate font-semibold">{title}</div>
              </div>
              <div className="text-base-content/80 truncate">{a.employerName}</div>
              <div className="text-base-content/60 font-mono text-[12px]">{a.date}</div>
              <div>
                <Pill tone={a.result === 'hired' ? 'success' : 'ghost'}>
                  {t(`result.${a.result}`)}
                </Pill>
              </div>
              <div
                className={[
                  'font-serif text-[15px] tracking-[-0.02em]',
                  a.earned ? 'text-base-content' : 'text-base-content/60',
                ].join(' ')}
              >
                {a.earned ?? '—'}
              </div>
              <div className="text-primary text-right text-[12px] font-semibold">
                {t('view')}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
