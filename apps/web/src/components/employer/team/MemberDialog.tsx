'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { MemberView } from '@agconn/schemas';
import { ASSIGNABLE_ROLE_KEYS } from './roles';

export type MemberDraft = {
    name: string;
    phone: string;
    email: string;
    roleKey: string;
    languages: ('en' | 'es')[];
    invite: boolean;
};

type Props = {
    mode: 'add' | 'edit';
    initial?: MemberView | null;
    busy: boolean;
    onClose: () => void;
    onSubmit: (draft: MemberDraft) => void;
};

export function MemberDialog({ mode, initial, busy, onClose, onSubmit }: Props) {
    const t = useTranslations('employer.team');
    const tRoles = useTranslations('employer.roles');
    const [languages, setLanguages] = useState<('en' | 'es')[]>(
        initial?.languages?.length ? initial.languages : ['en', 'es'],
    );

    function toggleLang(l: 'en' | 'es') {
        setLanguages((cur) =>
            cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l],
        );
    }

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSubmit({
            name: String(f.get('name') ?? '').trim(),
            phone: String(f.get('phone') ?? '').trim(),
            email: String(f.get('email') ?? '').trim(),
            roleKey: String(f.get('roleKey') ?? ''),
            languages: languages.length ? languages : ['en'],
            invite: f.get('invite') === 'on',
        });
    }

    return (
        <dialog className="modal modal-open" aria-modal>
            <div className="modal-box bg-base-100 border-base-300 max-w-lg rounded-2xl border">
                <h2 className="font-display text-2xl font-light">
                    {mode === 'add' ? t('dialog.add_title') : t('dialog.edit_title')}
                </h2>
                <p className="text-base-content/60 mb-5 mt-1 text-sm">
                    {t('dialog.subtitle')}
                </p>

                <form onSubmit={submit} className="grid gap-4">
                    <fieldset className="fieldset w-full min-w-0">
                        <legend className="fieldset-legend">{t('field.name')}</legend>
                        <input
                            name="name"
                            type="text"
                            required
                            minLength={2}
                            maxLength={120}
                            defaultValue={initial?.name ?? ''}
                            className="input w-full"
                        />
                    </fieldset>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <fieldset className="fieldset w-full min-w-0">
                            <legend className="fieldset-legend">{t('field.phone')}</legend>
                            <input
                                name="phone"
                                type="tel"
                                maxLength={40}
                                defaultValue={initial?.phone ?? ''}
                                className="input w-full"
                            />
                            <p className="label">{t('field.phone_hint')}</p>
                        </fieldset>
                        <fieldset className="fieldset w-full min-w-0">
                            <legend className="fieldset-legend">{t('field.email')}</legend>
                            <input
                                name="email"
                                type="email"
                                maxLength={200}
                                defaultValue={initial?.email ?? ''}
                                className="input w-full"
                            />
                            <p className="label">{t('field.email_hint')}</p>
                        </fieldset>
                    </div>

                    <fieldset className="fieldset w-full min-w-0">
                        <legend className="fieldset-legend">{t('field.role')}</legend>
                        <select
                            name="roleKey"
                            required
                            defaultValue={
                                initial && initial.roleKey !== 'owner'
                                    ? initial.roleKey
                                    : 'manager'
                            }
                            className="select w-full"
                        >
                            {ASSIGNABLE_ROLE_KEYS.map((k) => (
                                <option key={k} value={k}>
                                    {tRoles(k)}
                                </option>
                            ))}
                        </select>
                    </fieldset>

                    <fieldset className="fieldset w-full min-w-0">
                        <legend className="fieldset-legend">{t('field.languages')}</legend>
                        <div className="flex gap-4">
                            {(['en', 'es'] as const).map((l) => (
                                <label key={l} className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm checkbox-primary"
                                        checked={languages.includes(l)}
                                        onChange={() => toggleLang(l)}
                                    />
                                    {t(`lang.${l}`)}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {mode === 'add' && (
                        <label className="border-base-300 hover:border-base-content/30 flex cursor-pointer items-start gap-3 rounded-2xl border p-3">
                            <input
                                type="checkbox"
                                name="invite"
                                defaultChecked
                                className="checkbox checkbox-primary mt-0.5"
                            />
                            <span>
                                <span className="block text-sm font-medium">
                                    {t('field.invite_label')}
                                </span>
                                <span className="text-base-content/55 mt-0.5 block text-xs">
                                    {t('field.invite_hint')}
                                </span>
                            </span>
                        </label>
                    )}

                    <div className="modal-action mt-2">
                        <button
                            type="button"
                            className="btn btn-ghost rounded-full"
                            onClick={onClose}
                            disabled={busy}
                        >
                            {t('action.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary rounded-full font-semibold"
                            disabled={busy}
                            aria-busy={busy}
                        >
                            {busy && <span className="loading loading-spinner loading-xs" />}
                            {mode === 'add' ? t('action.add') : t('action.save')}
                        </button>
                    </div>
                </form>
            </div>
            <button
                type="button"
                className="modal-backdrop"
                aria-label={t('action.cancel')}
                onClick={onClose}
            />
        </dialog>
    );
}
