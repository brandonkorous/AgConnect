import { ArrowRight } from '@/components/primitives/ArrowRight';
import { CheckCircle } from '@/components/primitives/CheckCircle';

export type PlanCardProps = {
  variant: 'free' | 'pro' | 'enterprise';
  name: string;
  price: string;
  ribbon?: string;
  features: [string, string, string, string];
  cta: string;
  ctaHref: string;
};

export function PlanCard(props: PlanCardProps) {
  const isPro = props.variant === 'pro';

  const containerClass = isPro
    ? 'bg-bone'
    : 'bg-moss border-bone/20 border';

  const headlineTone = isPro ? 'text-ink' : 'text-bone';
  const priceTone = isPro ? 'text-moss' : 'text-honey';
  const featureTone = isPro ? 'text-ink' : 'text-bone';
  const checkColor = isPro ? '#2D4030' : '#C8A24A';
  const ctaBg = isPro ? 'bg-moss text-bone' : 'bg-honey text-ink';
  const ctaArrow = isPro ? '#EFE6D2' : '#1F1B14';

  return (
    <article className={`relative flex h-full flex-col gap-6 p-8 ${containerClass}`}>
      {props.ribbon && (
        <div className="bg-honey text-ink absolute -top-3 right-6 px-3 py-1.5 font-sans text-[10px] font-semibold tracking-[0.18em] uppercase">
          {props.ribbon}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className={`font-serif text-xl font-medium tracking-tight ${headlineTone}`}>
          {props.name}
        </h3>
        <p className={`font-mono text-[34px] font-medium leading-none ${priceTone}`}>
          {props.price}
        </p>
      </div>

      <ul className="flex flex-col gap-3 pt-2">
        {props.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-[3px]">
              <CheckCircle size={18} stroke={checkColor} />
            </span>
            <span className={`font-sans text-sm leading-relaxed ${featureTone}`}>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={props.ctaHref}
        className={`mt-auto inline-flex items-center justify-center gap-2 px-5 py-3 font-sans text-base font-semibold ${ctaBg}`}
      >
        <span>{props.cta}</span>
        <ArrowRight size={14} stroke={ctaArrow} width={2} />
      </a>
    </article>
  );
}
