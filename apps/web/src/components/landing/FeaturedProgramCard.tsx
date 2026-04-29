import { useTranslations } from 'next-intl';
import { ArrowRight } from '@/components/primitives/ArrowRight';
import type { FeaturedProgram } from '@/data/programs';

export function FeaturedProgramCard({ program }: { program: FeaturedProgram }) {
  const t = useTranslations();
  const cardT = useTranslations('landing.featured_training.card');
  const pct = ((program.capacity - program.spotsLeft) / program.capacity) * 100;

  return (
    <article className="border-soil/15 bg-bone flex h-full flex-col gap-4 border p-6 transition-colors hover:border-soil/40">
      <div className="flex items-center justify-between">
        <span className="bg-honey text-ink px-2 py-1 font-sans text-[10px] font-semibold tracking-[0.06em]">
          {t(program.funderKey as never)}
        </span>
        <span className="text-soil font-mono text-[11px]">{program.startDate}</span>
      </div>

      <div>
        <h3 className="text-ink font-serif text-lg font-semibold leading-tight tracking-tight">
          {t(program.titleKey as never)}
        </h3>
        <p className="text-soil mt-1 font-sans text-[13px]">{t(program.orgKey as never)}</p>
      </div>

      <div className="flex flex-col gap-1 pt-1">
        <p className="text-soil font-mono text-[11px]">
          {cardT('spots_left', { n: program.spotsLeft, capacity: program.capacity })}
        </p>
        <div className="bg-sage/40 relative h-1.5 w-full">
          <div
            className="bg-moss absolute inset-y-0 left-0"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="border-soil/15 mt-auto flex items-center justify-between border-t pt-4">
        <span className="text-moss bg-sage/50 px-2 py-1 font-sans text-[11px] font-semibold tracking-[0.06em] uppercase">
          {cardT('free')} · {program.hours}h
        </span>
        <a
          href={`/training/${program.id}`}
          className="text-moss inline-flex items-center gap-1.5 font-sans text-sm font-semibold"
        >
          <span>{cardT('view')}</span>
          <ArrowRight size={12} stroke="#2D4030" />
        </a>
      </div>
    </article>
  );
}
