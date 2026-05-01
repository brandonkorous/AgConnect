import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
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
        <div className="bg-base-100 w-full shadow-2xl">
            <div className="border-base-300 flex items-center justify-between border-b px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <Wordmark size="sm" tone="ink" />
                    <span className="border-base-300 border-l py-0.5 pl-2.5">
                        <span className="text-secondary font-sans text-xs">Driscoll's Madera · Pro</span>
                    </span>
                </div>
                <div className="badge badge-primary gap-2">
                    <FontAwesomeIcon icon={faStar} className="text-accent text-[10px]" />
                    <span className="font-semibold tracking-wider">VERIFIED FLC</span>
                </div>
            </div>

            <div className="p-4 md:p-6">
                <div className="flex flex-col items-start justify-between gap-3 pb-4 sm:flex-row sm:items-end sm:gap-4">
                    <div>
                        <p className="text-secondary font-sans text-xs font-semibold tracking-widest uppercase">
                            Applicant Pipeline · Strawberry Crew · Q2
                        </p>
                        <p className="text-base-content mt-1 font-serif text-xl font-semibold tracking-tight md:text-2xl">
                            23 applicants this week
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <button type="button" className="btn btn-primary ">
                            + New post
                        </button>
                        <button type="button" className="btn btn-outline btn-primary ">
                            Export
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <KanbanColumn title="Applied" count={14} cards={applied} variant="light" />
                    <KanbanColumn title="Reviewed" count={5} cards={reviewed} variant="light" />
                    <KanbanColumn title="Hired · wage on record" count={4} cards={hired} variant="dark" />
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
    const colBg = isDark ? 'bg-primary' : 'bg-base-300';
    const titleClass = isDark ? 'text-accent' : 'text-secondary';
    const dividerClass = isDark ? 'border-secondary' : 'border-base-300';
    const countBadge = isDark ? 'badge badge-accent badge-sm' : 'badge badge-secondary badge-sm';
    const cardBg = isDark ? 'bg-neutral' : 'bg-base-100 border-base-300 border';
    const cardName = isDark ? 'text-neutral-content' : 'text-base-content';
    const cardMeta = isDark ? 'text-accent' : 'text-secondary';

    return (
        <div className={`flex flex-col gap-2 p-3 ${colBg}`}>
            <div className={`flex items-center justify-between border-b pb-1.5 ${dividerClass}`}>
                <span
                    className={`font-sans text-xs font-semibold tracking-wider uppercase ${titleClass}`}
                >
                    {title}
                </span>
                <span className={`${countBadge} font-semibold`}>{count}</span>
            </div>
            {cards.map((c) => (
                <div key={c.name} className={`p-2.5 ${cardBg}`}>
                    <p className={`font-serif text-sm font-semibold ${cardName}`}>{c.name}</p>
                    <p className={`font-sans text-xs ${cardMeta}`}>{c.meta}</p>
                </div>
            ))}
        </div>
    );
}
