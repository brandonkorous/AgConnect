import { CheckCircle } from '@/components/primitives/CheckCircle';
import { ArrowRight } from '@/components/primitives/ArrowRight';

export type AudienceCardProps = {
  surface: 'moss' | 'bone' | 'sage';
  eyebrow: string;
  subscript: string;
  headlineLine1: string;
  headlineLine2: string;
  bullets: [string, string, string, string];
  ctaText: string;
  ctaHref: string;
};

export function AudienceCard(props: AudienceCardProps) {
  const { surface } = props;
  const isMoss = surface === 'moss';
  const isBone = surface === 'bone';
  const isSage = surface === 'sage';

  const containerClass = isMoss
    ? 'bg-moss'
    : isBone
      ? 'bg-bone border-moss border-[1.5px]'
      : 'bg-sage';
  const eyebrowTone = isMoss ? 'text-honey' : 'text-soil';
  const subscriptTone = isMoss ? 'text-sage' : 'text-soil';
  const headlineTone = isMoss ? 'text-bone' : 'text-ink';
  const bulletTextTone = isMoss ? 'text-bone' : 'text-ink';
  const checkColor = isMoss ? '#C8A24A' : '#2D4030';
  const ctaTone = isMoss ? 'text-honey' : 'text-moss';
  const ctaArrow = isMoss ? '#C8A24A' : '#2D4030';
  const dividerClass = isMoss ? 'border-soil' : isSage ? 'border-soil/30' : 'border-soil/20';

  return (
    <article className={`flex min-h-[480px] flex-col gap-6 p-10 ${containerClass}`}>
      <div className="flex items-center gap-2.5">
        <span className={`label ${eyebrowTone}`}>{props.eyebrow}</span>
        <span className={`font-serif text-[13px] italic ${subscriptTone}`}>
          {props.subscript}
        </span>
      </div>

      <h3
        className={`font-serif text-[34px] font-medium leading-[1.1] tracking-tight md:text-[42px] ${headlineTone}`}
      >
        {props.headlineLine1}
        <br />
        {props.headlineLine2}
      </h3>

      <ul className="flex flex-col gap-3.5 pt-2">
        {props.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-[3px]">
              <CheckCircle stroke={checkColor} />
            </span>
            <span className={`font-sans text-base leading-relaxed ${bulletTextTone}`}>
              {bullet}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={props.ctaHref}
        className={`mt-auto flex items-center gap-2 border-t pt-6 ${dividerClass} ${ctaTone}`}
      >
        <span className="font-sans text-[15px] font-semibold">{props.ctaText}</span>
        <ArrowRight size={14} stroke={ctaArrow} />
      </a>
    </article>
  );
}
