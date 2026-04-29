import { useTranslations } from 'next-intl';
import type { Testimonial } from '@/data/testimonials';

const initialBg: Record<Testimonial['role'], string> = {
  worker: 'bg-honey text-ink',
  employer: 'bg-moss text-bone',
  training: 'bg-soil text-bone',
};

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const t = useTranslations('testimonials');
  const placeholderT = useTranslations('landing.testimonials');
  const name = t(`${testimonial.id}.name`);
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <article className="border-ink/15 bg-bone flex h-full flex-col gap-5 border p-8">
      <p className="text-ink font-serif text-2xl leading-snug italic">
        "{t(`${testimonial.id}.quote`)}"
      </p>
      <p className="text-soil font-sans text-sm leading-relaxed">
        {t(`${testimonial.id}.translation`)}
      </p>

      <div className="border-soil/20 mt-auto flex items-center gap-3 border-t pt-5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center font-serif text-lg font-semibold italic ${initialBg[testimonial.role]}`}
        >
          {initial}
        </div>
        <div className="flex flex-1 flex-col">
          <p className="text-ink font-sans text-sm font-semibold">{name}</p>
          <p className="text-soil font-sans text-xs">{t(`${testimonial.id}.context`)}</p>
        </div>
        {testimonial.isPlaceholder && (
          <span className="text-soil/70 font-mono text-[10px] tracking-[0.04em]">
            {placeholderT('placeholder_badge')}
          </span>
        )}
      </div>
    </article>
  );
}
