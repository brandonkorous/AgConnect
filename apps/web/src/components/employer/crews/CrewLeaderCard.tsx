import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import type { getTranslations } from 'next-intl/server';
import type { CrewView } from '@/lib/api/employer-ops';
import { CrewEditTrigger } from './CrewEditTrigger';

type T = Awaited<ReturnType<typeof getTranslations>>;

export function CrewLeaderCard({
    cr,
    locale,
    t,
}: {
    cr: CrewView;
    locale: string;
    t: T;
}) {
    return (
        <article className="bg-base-100 border-base-300 rounded-2xl border p-4">
            <div className="flex items-center gap-2.5">
                <div className="bg-primary text-primary-content grid h-9 w-9 place-items-center rounded-full font-mono text-xs font-bold">
                    {(cr.foremanName ?? '—').split(' ').map((p) => p[0]).slice(0, 2).join('') || '—'}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{cr.foremanName ?? t('hiring_foreman')}</div>
                    <div className="text-base-content/60 text-xs">
                        {cr.name.split('·')[0]?.trim() ?? cr.name}
                    </div>
                </div>
            </div>
            <div className="border-base-300 mt-3 grid grid-cols-2 gap-2 border-t border-dashed pt-3 text-xs">
                <div>
                    <div className="text-base-content/60">{t('size')}</div>
                    <div className="font-mono text-sm font-bold">{cr.memberCount}</div>
                </div>
                <div>
                    <div className="text-base-content/60">{t('rating')}</div>
                    <div className="text-base-content/40 font-mono text-sm font-bold">—</div>
                </div>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
                <CrewEditTrigger
                    crew={cr}
                    ariaLabel={t('row_edit_aria', { crew: cr.name })}
                    className="border-base-300 hover:bg-base-200 inline-flex w-full items-center justify-center rounded-full border bg-transparent px-3 py-2 text-xs font-semibold"
                >
                    {t('edit_crew_button')}
                </CrewEditTrigger>
                {cr.foremanUserId ? (
                    <Link
                        href={`/${locale}/employer/messages?worker=${cr.foremanUserId}`}
                        className="bg-base-content text-base-100 hover:bg-base-content/90 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold"
                    >
                        <FontAwesomeIcon icon={faComments} className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                            {t('message_foreman', { firstName: cr.foremanName?.split(' ')[0] ?? '' })}
                        </span>
                    </Link>
                ) : (
                    <span className="bg-base-200 border-base-300 text-base-content/40 inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold">
                        <FontAwesomeIcon icon={faComments} className="h-3 w-3 shrink-0" />
                        <span className="truncate">{t('hiring_foreman')}</span>
                    </span>
                )}
            </div>
        </article>
    );
}
