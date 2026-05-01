'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Day = (typeof DAYS)[number];
type Slot = 'am' | 'pm';

type State = Record<Day, { am: boolean; pm: boolean }>;

const empty: State = {
  mon: { am: false, pm: false },
  tue: { am: false, pm: false },
  wed: { am: false, pm: false },
  thu: { am: false, pm: false },
  fri: { am: false, pm: false },
  sat: { am: false, pm: false },
  sun: { am: false, pm: false },
};

export function AvailabilityGrid({ locale }: { locale: string }) {
  const t = useTranslations('worker.onboarding.availability');
  const tProfile = useTranslations('worker.onboarding.profile');
  const router = useRouter();
  const [state, setState] = useState<State>(empty);
  const [notes, setNotes] = useState('');

  function toggle(day: Day, slot: Slot) {
    setState((s) => ({ ...s, [day]: { ...s[day], [slot]: !s[day][slot] } }));
  }

  function setAll(value: boolean) {
    const next: State = { ...empty };
    for (const day of DAYS) next[day] = { am: value, pm: value };
    setState(next);
  }

  const hasAny = Object.values(state).some((d) => d.am || d.pm);

  function next() {
    if (!hasAny) return;
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(
        window.localStorage.getItem('agconn:onboarding:profile') ?? '{}',
      );
      window.localStorage.setItem(
        'agconn:onboarding:profile',
        JSON.stringify({
          ...existing,
          availability: { ...state, notes: notes.trim() || undefined },
        }),
      );
    }
    router.push(`/${locale}/onboarding/complete`);
  }

  return (
    <div className="grid gap-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAll(true)}
          className="btn btn-sm btn-outline"
        >
          {t('mark_all')}
        </button>
        <button
          type="button"
          onClick={() => setAll(false)}
          className="btn btn-sm btn-ghost"
        >
          {t('clear_all')}
        </button>
      </div>

      <div className="border-base-300 bg-base-100 overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-base-200/60 text-base-content/70 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">{t('day_label')}</th>
              <th className="px-3 py-2">{t('am')}</th>
              <th className="px-3 py-2">{t('pm')}</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => (
              <tr key={day} className="border-base-300 border-t">
                <td className="px-3 py-2 font-medium">
                  {t(`day.${day}` as 'day.mon')}
                </td>
                {(['am', 'pm'] as const).map((slot) => (
                  <td key={slot} className="px-3 py-2 text-center">
                    <button
                      type="button"
                      aria-pressed={state[day][slot]}
                      onClick={() => toggle(day, slot)}
                      className={[
                        'h-9 w-full rounded-lg text-xs font-bold uppercase transition-colors',
                        state[day][slot]
                          ? 'bg-primary text-primary-content'
                          : 'bg-base-200 text-base-content/50 hover:bg-base-300',
                      ].join(' ')}
                    >
                      {state[day][slot] ? t('on') : t('off')}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">{t('notes.label')}</legend>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={280}
          rows={2}
          className="textarea textarea-bordered w-full"
          placeholder={t('notes.placeholder')}
        />
      </fieldset>

      <button
        type="button"
        onClick={next}
        disabled={!hasAny}
        className="btn btn-primary btn-lg w-full"
      >
        {tProfile('continue')}
      </button>
    </div>
  );
}
