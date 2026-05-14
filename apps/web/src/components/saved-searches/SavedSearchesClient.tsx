'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faTrash,
    faBell,
    faBellSlash,
    faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import {
    createSavedSearchAction,
    deleteSavedSearchAction,
    patchSavedSearchAction,
} from '@/lib/api/saved-searches-actions';
import type { SavedSearch } from '@/lib/api/saved-searches';

type Props = { locale: string; initial: SavedSearch[] };

export function SavedSearchesClient({ locale, initial }: Props) {
    const t = useTranslations('worker.saved_searches');
    const [items, setItems] = useState(initial);
    const [adding, setAdding] = useState(false);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    function refresh() {
        router.refresh();
    }

    function toggleAlerts(s: SavedSearch) {
        const next = items.map((it) =>
            it.id === s.id ? { ...it, alertActive: !it.alertActive } : it,
        );
        setItems(next);
        startTransition(async () => {
            await patchSavedSearchAction(s.id, { alertActive: !s.alertActive });
            refresh();
        });
    }

    function remove(s: SavedSearch) {
        setItems((prev) => prev.filter((it) => it.id !== s.id));
        startTransition(async () => {
            await deleteSavedSearchAction(s.id);
            refresh();
        });
    }

    if (items.length === 0 && !adding) {
        return (
            <div className="border-base-300 grid gap-3 rounded-2xl border bg-white p-8 text-center">
                <p className="text-base-content/80 font-semibold">{t('empty.title')}</p>
                <p className="text-base-content/60 text-sm">{t('empty.body')}</p>
                <div className="flex justify-center gap-2">
                    <Link
                        href={`/${locale}/worker/jobs`}
                        className="btn btn-outline btn-sm rounded-full"
                    >
                        {t('empty.cta_browse')}
                    </Link>
                    <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className="btn btn-primary btn-sm rounded-full"
                    >
                        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                        {t('add')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-3.5">
            {items.map((s) => (
                <div
                    key={s.id}
                    className="border-base-300 bg-base-100 grid gap-2 rounded-2xl border p-5"
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-semibold">
                                    {s.name ?? formatFiltersAsName(s.filters, locale)}
                                </h3>
                                {s.alertActive && (
                                    <Pill tone="primary">
                                        {s.alertChannel === 'sms'
                                            ? 'SMS'
                                            : s.alertChannel === 'email'
                                                ? 'Email'
                                                : t('alerts.both')}
                                    </Pill>
                                )}
                            </div>
                            <div className="text-base-content/60 mt-1 text-sm">
                                {formatFiltersAsName(s.filters, locale)}
                            </div>
                            {s.lastNotifiedAt && (
                                <div className="text-base-content/50 mt-1.5 font-mono text-xs">
                                    {t('last_notified', {
                                        date: new Date(s.lastNotifiedAt).toLocaleDateString(locale),
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                            <Link
                                href={filtersToHref(s.filters, locale) as Route}
                                className="bg-primary text-primary-content inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-semibold no-underline"
                            >
                                {t('view_jobs')}
                                <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => toggleAlerts(s)}
                                disabled={pending}
                                className="border-base-300 inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1.5 text-[11.5px] font-semibold"
                                title={
                                    s.alertActive
                                        ? t('alerts.pause')
                                        : t('alerts.resume')
                                }
                            >
                                <FontAwesomeIcon
                                    icon={s.alertActive ? faBellSlash : faBell}
                                    className="h-3 w-3"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(s)}
                                disabled={pending}
                                className="border-base-300 hover:border-error hover:text-error inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1.5 text-[11.5px] font-semibold"
                            >
                                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            {adding ? (
                <AddForm
                    onCancel={() => setAdding(false)}
                    onCreated={(s) => {
                        setItems((prev) => [s, ...prev]);
                        setAdding(false);
                        refresh();
                    }}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="border-base-300 hover:border-primary text-primary inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed bg-transparent px-4 py-3 text-[13px] font-semibold"
                >
                    <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                    {t('add')}
                </button>
            )}
        </div>
    );
}

function AddForm({
    onCancel,
    onCreated,
}: {
    onCancel: () => void;
    onCreated: (s: SavedSearch) => void;
}) {
    const t = useTranslations('worker.saved_searches.form');
    const [name, setName] = useState('');
    const [county, setCounty] = useState('');
    const [wageMin, setWageMin] = useState('');
    const [housing, setHousing] = useState(false);
    const [transport, setTransport] = useState(false);
    const [noExperience, setNoExperience] = useState(false);
    const [thisWeek, setThisWeek] = useState(false);
    const [skills, setSkills] = useState('');
    const [channel, setChannel] = useState<SavedSearch['alertChannel']>('sms');
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function submit() {
        setError(null);
        startTransition(async () => {
            const skillsList = skills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            let startBefore: string | undefined;
            if (thisWeek) {
                const d = new Date();
                d.setUTCDate(d.getUTCDate() + 7);
                startBefore = d.toISOString().slice(0, 10);
            }
            const res = await createSavedSearchAction({
                name: name.trim() || null,
                filters: {
                    ...(county ? { county: [county] } : {}),
                    ...(wageMin ? { wageMin: Number(wageMin) } : {}),
                    ...(skillsList.length ? { skills: skillsList } : {}),
                    ...(housing ? { housing: true } : {}),
                    ...(transport ? { transport: true } : {}),
                    ...(noExperience ? { noExperience: true } : {}),
                    ...(startBefore ? { startBefore } : {}),
                },
                alertChannel: channel,
                alertActive: channel !== 'none',
            });
            if (!res.ok) {
                if (res.code === 'validation_failed' && /phone/.test(res.message)) {
                    setError(t('error_phone'));
                } else if (res.code === 'validation_failed') {
                    setError(t('error_validation'));
                } else {
                    setError(t('error'));
                }
                return;
            }
            onCreated(res.data);
        });
    }

    function setChannelAndClear(c: SavedSearch['alertChannel']) {
        setChannel(c);
        setError(null);
    }

    return (
        <div className="border-primary/40 bg-base-100 grid gap-3 rounded-2xl border p-5">
            <h3 className="font-serif text-[18px]">{t('title')}</h3>
            <fieldset className="fieldset">
                <legend className="fieldset-legend">{t('name')}</legend>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder={t('name_placeholder')}
                />
            </fieldset>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">{t('county')}</legend>
                    <input
                        value={county}
                        onChange={(e) => setCounty(e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="Madera"
                    />
                </fieldset>
                <fieldset className="fieldset">
                    <legend className="fieldset-legend">{t('wage_min')}</legend>
                    <input
                        value={wageMin}
                        onChange={(e) => setWageMin(e.target.value)}
                        inputMode="decimal"
                        className="input input-bordered w-full"
                        placeholder="22"
                    />
                </fieldset>
            </div>
            <fieldset className="fieldset">
                <legend className="fieldset-legend">{t('skills_label')}</legend>
                <input
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="input input-bordered w-full"
                    placeholder={t('skills_placeholder')}
                />
                <p className="label">{t('skills_hint')}</p>
            </fieldset>
            <fieldset className="fieldset">
                <legend className="fieldset-legend">{t('extras_label')}</legend>
                <div className="flex flex-wrap gap-3">
                    <label className="label cursor-pointer gap-2">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={housing}
                            onChange={(e) => setHousing(e.target.checked)}
                        />
                        <span className="label-text">{t('extras.housing')}</span>
                    </label>
                    <label className="label cursor-pointer gap-2">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={transport}
                            onChange={(e) => setTransport(e.target.checked)}
                        />
                        <span className="label-text">{t('extras.transport')}</span>
                    </label>
                    <label className="label cursor-pointer gap-2">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={noExperience}
                            onChange={(e) => setNoExperience(e.target.checked)}
                        />
                        <span className="label-text">{t('extras.no_experience')}</span>
                    </label>
                    <label className="label cursor-pointer gap-2">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={thisWeek}
                            onChange={(e) => setThisWeek(e.target.checked)}
                        />
                        <span className="label-text">{t('extras.this_week')}</span>
                    </label>
                </div>
            </fieldset>
            <fieldset className="fieldset">
                <legend className="fieldset-legend">{t('alert_channel')}</legend>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('alert_channel')}>
                    {(['sms', 'email', 'both', 'none'] as const).map((c) => (
                        <label
                            key={c}
                            className={[
                                'cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-semibold',
                                channel === c
                                    ? 'bg-primary text-primary-content'
                                    : 'border-base-300 border bg-transparent',
                            ].join(' ')}
                        >
                            <input
                                type="radio"
                                name="alert-channel"
                                value={c}
                                checked={channel === c}
                                onChange={() => setChannelAndClear(c)}
                                className="sr-only"
                            />
                            {t(`channel.${c}`)}
                        </label>
                    ))}
                </div>
            </fieldset>
            {error && <div className="text-error text-[12px]">{error}</div>}
            <div className="flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-ghost btn-sm"
                    disabled={pending}
                >
                    {t('cancel')}
                </button>
                <button
                    type="button"
                    onClick={submit}
                    className="btn btn-primary btn-sm"
                    disabled={pending}
                >
                    {pending ? t('saving') : t('save')}
                </button>
            </div>
        </div>
    );
}

function formatFiltersAsName(filters: SavedSearch['filters'], locale: string): string {
    const parts: string[] = [];
    if (filters.county?.length) parts.push(filters.county.join(', '));
    if (filters.wageMin !== undefined) parts.push(`$${filters.wageMin}+/hr`);
    if (filters.skills?.length) parts.push(filters.skills.slice(0, 2).join(', '));
    return parts.join(' · ') || (locale === 'es' ? 'Todos los trabajos' : 'All jobs');
}

function filtersToHref(filters: SavedSearch['filters'], locale: string): string {
    const sp = new URLSearchParams();
    const firstCounty = filters.county?.[0];
    if (firstCounty) sp.set('county', firstCounty);
    if (filters.skills?.length) sp.set('skills', filters.skills.join(','));
    if (filters.wageMin !== undefined) sp.set('wageMin', String(filters.wageMin));
    if (filters.startBefore) sp.set('startBefore', filters.startBefore);
    if (filters.housing) sp.set('housing', '1');
    if (filters.transport) sp.set('transport', '1');
    if (filters.noExperience) sp.set('noExperience', '1');
    const qs = sp.toString();
    return `/${locale}/worker/jobs${qs ? `?${qs}` : ''}`;
}
