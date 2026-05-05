import Link from 'next/link';
import type { Route } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export type DashboardErrorCard = {
  href: string;
  icon: IconDefinition;
  label: string;
  hint: string;
};

export type DashboardErrorStateProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { href: string; label: string };
  cardsLabel: string;
  cards: DashboardErrorCard[];
};

export function DashboardErrorState({
  code,
  eyebrow,
  title,
  description,
  primaryAction,
  cardsLabel,
  cards,
}: DashboardErrorStateProps) {
  return (
    <div className="container mx-auto px-5 py-12 md:px-8 md:py-20 lg:px-20 lg:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <div className="text-base-content/60 flex items-center justify-center gap-2.5">
          <span className="font-mono text-xs tabular-nums tracking-[0.18em]">{code}</span>
          <span aria-hidden className="text-base-content/30 select-none">
            ·
          </span>
          <span className="eyebrow text-xs">{eyebrow}</span>
        </div>

        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl">
          {title}
        </h1>

        <p className="text-base-content/80 max-w-md text-base leading-relaxed">{description}</p>

        <Link href={primaryAction.href as Route} className="btn btn-primary mt-2">
          <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
          {primaryAction.label}
        </Link>
      </div>

      <div className="mx-auto mt-14 max-w-5xl md:mt-20">
        <div className="mb-6 flex items-center gap-4">
          <span className="bg-base-300 h-px flex-1" aria-hidden />
          <p className="text-base-content/60 eyebrow text-xs">{cardsLabel}</p>
          <span className="bg-base-300 h-px flex-1" aria-hidden />
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href as Route}
                className="bg-base-100 border-base-300 hover:border-primary group flex h-full flex-col gap-3 rounded-box border p-5 transition-colors"
              >
                <span className="bg-base-200 text-base-content/70 group-hover:bg-primary/10 group-hover:text-primary flex h-10 w-10 items-center justify-center rounded-field transition-colors">
                  <FontAwesomeIcon icon={card.icon} className="h-4 w-4" />
                </span>
                <span className="text-base-content text-sm font-medium leading-tight group-hover:text-primary">
                  {card.label}
                </span>
                <span className="text-base-content/60 text-xs leading-relaxed">{card.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
