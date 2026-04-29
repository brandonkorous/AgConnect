import { Wordmark } from '@/components/primitives/Wordmark';

const applied = [
  { name: 'M. Hernández', meta: 'Recolector · 5 yrs' },
  { name: 'J. Ramírez', meta: 'Pesticide · cert ✓' },
  { name: 'P. Vega', meta: 'Recolector · 3 yrs' },
];
const reviewed = [
  { name: 'C. Soto', meta: 'Forklift · cert ✓' },
  { name: 'L. Méndez', meta: 'Recolector · 8 yrs' },
];
const hired = [
  { name: 'A. Cortés', meta: '$19.50/hr · 04-22' },
  { name: 'R. Salazar', meta: '$22.00/hr · 04-21' },
  { name: 'D. Ortega', meta: '$24.00/hr · 04-19' },
];

export function EmployerDashboardMock() {
  return (
    <div className="bg-bone w-full shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
      <div className="border-hairline flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Wordmark size="sm" tone="ink" />
          <span className="border-hairline border-l py-0.5 pl-2.5">
            <span className="text-soil font-sans text-[11px]">Driscoll's Madera · Pro</span>
          </span>
        </div>
        <div className="bg-moss flex items-center gap-2 px-2.5 py-1">
          <svg width="9" height="9" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M7 1 L9 5 L13 5.5 L10 8.5 L11 13 L7 11 L3 13 L4 8.5 L1 5.5 L5 5 Z"
              fill="#C8A24A"
            />
          </svg>
          <span className="text-bone font-sans text-[11px] font-semibold tracking-[0.06em]">
            VERIFIED FLC
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-end justify-between pb-4">
          <div>
            <p className="text-soil font-sans text-[11px] font-semibold tracking-[0.16em] uppercase">
              Applicant Pipeline · Strawberry Crew · Q2
            </p>
            <p className="text-ink mt-1 font-serif text-2xl font-semibold tracking-[-0.02em]">
              23 applicants this week
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className="bg-moss text-bone px-3 py-1.5 font-sans text-[11px] font-semibold">
              + New post
            </span>
            <span className="border-moss text-moss border px-3 py-1.5 font-sans text-[11px] font-semibold">
              Export
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <KanbanColumn title="Applied" count={14} cards={applied} variant="light" />
          <KanbanColumn title="Reviewed" count={5} cards={reviewed} variant="light" />
          <KanbanColumn
            title="Hired · wage on record"
            count={4}
            cards={hired}
            variant="dark"
          />
        </div>
      </div>
    </div>
  );
}

type Card = { name: string; meta: string };

function KanbanColumn({
  title,
  count,
  cards,
  variant,
}: {
  title: string;
  count: number;
  cards: Card[];
  variant: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';
  const colBg = isDark ? 'bg-moss' : 'bg-sage';
  const titleClass = isDark ? 'text-honey' : 'text-soil';
  const dividerClass = isDark ? 'border-soil' : 'border-hairline-warm';
  const countBg = isDark ? 'bg-honey text-ink' : 'bg-soil text-bone';
  const cardBg = isDark ? 'bg-ink' : 'bg-white border-hairline border';
  const cardName = isDark ? 'text-bone' : 'text-ink';
  const cardMeta = isDark ? 'text-honey' : 'text-soil';

  return (
    <div className={`flex min-h-[280px] flex-col gap-2 p-3 ${colBg}`}>
      <div className={`flex items-center justify-between border-b pb-1.5 ${dividerClass}`}>
        <span
          className={`font-sans text-[10px] font-semibold tracking-[0.06em] uppercase ${titleClass}`}
        >
          {title}
        </span>
        <span className={`px-1.5 py-0.5 ${countBg}`}>
          <span className="font-sans text-[10px] font-semibold tracking-[0.06em] uppercase">
            {count}
          </span>
        </span>
      </div>
      {cards.map((c) => (
        <div key={c.name} className={`p-2.5 ${cardBg}`}>
          <p className={`font-serif text-[13px] font-semibold ${cardName}`}>{c.name}</p>
          <p className={`font-sans text-[11px] ${cardMeta}`}>{c.meta}</p>
        </div>
      ))}
    </div>
  );
}
