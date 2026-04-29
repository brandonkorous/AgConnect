import { useTranslations } from 'next-intl';

type Card = { name: string; tag: string; wage?: string; tagTone: 'sage' | 'honey' | 'moss' };

const applied: Card[] = [
  { name: 'Carlos M.', tag: 'Madera · 4 yrs', tagTone: 'sage' },
  { name: 'Lupe G.', tag: 'Fresno · 7 yrs', tagTone: 'sage' },
  { name: 'Diego R.', tag: 'Tulare · 2 yrs', tagTone: 'sage' },
];
const reviewed: Card[] = [
  { name: 'Maribel S.', tag: 'Fresno · 9 yrs', tagTone: 'honey' },
  { name: 'José A.', tag: 'Kern · 5 yrs', tagTone: 'honey' },
];
const hired: Card[] = [
  { name: 'María R.', tag: 'Tulare · 6 yrs', wage: '$19.50/hr', tagTone: 'moss' },
];

export function EmployerDashboardMock() {
  const t = useTranslations('landing.employer_showcase.mock');

  return (
    <div className="border-ink/10 bg-bone relative w-full max-w-[620px] border p-6 shadow-[0_24px_48px_rgba(31,27,20,0.08)]">
      <div className="border-ink/10 flex items-center justify-between border-b pb-4">
        <div className="flex flex-col">
          <span className="text-soil text-[11px] font-semibold tracking-[0.18em] uppercase">
            {t('title')}
          </span>
          <span className="text-ink mt-1 font-serif text-xl font-medium tracking-tight">
            Driscoll's Madera Ranch
          </span>
        </div>
        <div className="flex items-center gap-4">
          <KpiTile value="12" label={t('kpi_active')} />
          <KpiTile value="47" label={t('kpi_filled')} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <KanbanCol title={t('col_applied')} count={applied.length} cards={applied} />
        <KanbanCol title={t('col_reviewed')} count={reviewed.length} cards={reviewed} />
        <KanbanCol
          title={t('col_hired')}
          count={hired.length}
          cards={hired}
          wageLabel={t('wage_label')}
        />
      </div>
    </div>
  );
}

function KpiTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-moss font-mono text-2xl font-medium leading-none">{value}</span>
      <span className="text-soil mt-1 font-sans text-[11px]">{label}</span>
    </div>
  );
}

function KanbanCol({
  title,
  count,
  cards,
  wageLabel,
}: {
  title: string;
  count: number;
  cards: Card[];
  wageLabel?: string;
}) {
  return (
    <div className="bg-sage/40 border-soil/15 border p-3">
      <div className="flex items-center justify-between pb-3">
        <span className="text-soil text-[10px] font-semibold tracking-[0.18em] uppercase">
          {title}
        </span>
        <span className="text-soil font-mono text-[11px]">{count}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {cards.map((c) => (
          <li key={c.name} className="border-soil/15 bg-bone border p-2.5">
            <p className="text-ink font-sans text-[13px] font-semibold">{c.name}</p>
            <p className="text-soil mt-0.5 font-sans text-[11px]">{c.tag}</p>
            {c.wage && (
              <div className="border-soil/15 mt-2 border-t pt-1.5">
                <span className="text-soil font-sans text-[10px] tracking-[0.12em] uppercase">
                  {wageLabel}
                </span>
                <p className="text-moss font-mono text-sm font-medium">{c.wage}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
