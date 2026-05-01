import { getTranslations } from 'next-intl/server';
import { fetchProfile } from '@/lib/api/profile';

type AvailabilitySchema = {
  weekdays?: boolean;
  weekends?: boolean;
  // Optional explicit per-day map: { '2026-08-04': true, ... }
  days?: Record<string, boolean>;
};

type Props = { locale: string };

export async function AvailabilityCard({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'worker.dashboard.availability' });
  const profile = await fetchProfile();
  // The schema fetcher returns the parsed snapshot but not the raw availability
  // JSON. Treat it as best-effort weekday/weekend defaults until we expose it.
  const availability: AvailabilitySchema = {};
  const days = t.raw('days') as string[];
  const conflictDay = t('conflict_day');

  // Build the next 7 days starting tomorrow.
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i);
    const dow = d.getUTCDay(); // 0=Sun..6=Sat
    const isWeekend = dow === 0 || dow === 6;
    const explicit = availability.days?.[d.toISOString().slice(0, 10)];
    const open =
      explicit ?? (isWeekend ? availability.weekends ?? false : availability.weekdays ?? true);
    return { date: d, open };
  });

  return (
    <section className="bg-base-100 border-base-300 rounded-2xl border p-4">
      <header className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-base-content/60">
            {t('eyebrow')}
          </div>
          <h3 className="font-serif mt-0.5 text-xl font-medium tracking-tight">
            {t('title')}
          </h3>
        </div>
        <button
          type="button"
          className="text-primary text-xs font-bold hover:underline"
        >
          {t('edit')}
        </button>
      </header>

      <ol className="mt-3.5 grid grid-cols-7 gap-1">
        {week.map((day, i) => (
          <li
            key={day.date.toISOString()}
            className={[
              'rounded-lg px-1 pb-2.5 pt-2 text-center',
              day.open
                ? 'bg-primary text-primary-content'
                : 'bg-base-200 text-base-content/60',
            ].join(' ')}
          >
            <div className="font-mono text-[10px] font-bold tracking-wider">
              {days[(day.date.getUTCDay() + 6) % 7] ?? ''}
            </div>
            <div className="mt-0.5 text-[9px] font-semibold opacity-80">
              {day.open ? t('open') : t('off')}
            </div>
          </li>
        ))}
      </ol>

      <p className="text-base-content/60 mt-3 text-xs">
        {profile.firstName
          ? t('footer', { day: conflictDay })
          : locale === 'es'
            ? 'Marca tu disponibilidad para que los empleadores te vean primero.'
            : 'Mark your availability so employers see you first.'}
      </p>
    </section>
  );
}
