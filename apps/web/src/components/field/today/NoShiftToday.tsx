import Link from 'next/link';
import type { Route } from 'next';
import { useFormatter, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import type { ShiftRow } from '@/lib/api/hooks/shifts';

type Props = {
    locale: string;
    upcoming: ShiftRow | null;
};

export function NoShiftToday({ locale, upcoming }: Props) {
    const t = useTranslations('worker.field.today.empty');
    const formatter = useFormatter();
    return (
        <div className="bg-base-100 border-base-300 rounded-2xl border px-5 py-6 text-center">
            <span className="bg-base-200 text-base-content/70 mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
                <FontAwesomeIcon icon={faCalendarDays} className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-base-content text-xl font-semibold">{t('title')}</h1>
            <p className="text-base-content/65 mx-auto mt-1.5 max-w-xs text-sm">
                {t('body')}
            </p>
            {upcoming && (
                <Link
                    href={`/${locale}/field/shifts` as Route}
                    aria-label={t('see_shift_details')}
                    className="border-base-300 hover:bg-base-200 active:bg-base-200 mt-5 block rounded-2xl border-t pt-5 text-left transition-colors -mx-5 px-5 pb-1"
                >
                    <p className="text-base-content/55 mb-1 font-mono text-[10px] uppercase tracking-wide">
                        {t('next_up')}
                    </p>
                    <p className="text-base-content text-base font-semibold tabular-nums slashed-zero">
                        {/* Anchor to noon to dodge runtime-TZ midnight roll-back. */}
                        {formatter.dateTime(new Date(`${upcoming.shift.date}T12:00:00`), {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                        })}
                        {' · '}
                        {upcoming.shift.startTime}
                    </p>
                    <p className="text-base-content/70 mt-0.5 text-sm">
                        {(locale === 'es'
                            ? upcoming.shift.jobTitleEs
                            : upcoming.shift.jobTitleEn) ??
                            upcoming.shift.jobTitleEn ??
                            upcoming.shift.employer}
                    </p>
                </Link>
            )}
            <Link
                href={`/${locale}/field/shifts` as Route}
                className="text-primary hover:text-primary/80 active:text-primary/90 mt-5 inline-flex h-11 items-center text-sm font-semibold underline-offset-4 hover:underline"
            >
                {t('see_all_shifts')}
            </Link>
        </div>
    );
}
