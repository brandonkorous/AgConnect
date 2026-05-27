'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import type { MemberView } from '@agconn/schemas';
import {
    useCreateMemberMutation,
    usePatchMemberMutation,
    useDeleteMemberMutation,
    useResendInviteMutation,
    useTransferOwnerMutation,
} from '@/lib/api/hooks/mutations/members';
import { MemberRow } from './MemberRow';
import { MemberDialog, type MemberDraft } from './MemberDialog';

type Props = { members: MemberView[]; canManage: boolean };

type Confirm =
    | { kind: 'remove'; member: MemberView }
    | { kind: 'transfer'; member: MemberView }
    | null;

export function TeamRoster({ members, canManage }: Props) {
    const t = useTranslations('employer.team');
    const createMut = useCreateMemberMutation();
    const patchMut = usePatchMemberMutation();
    const deleteMut = useDeleteMemberMutation();
    const resendMut = useResendInviteMutation();
    const transferMut = useTransferOwnerMutation();
    const pending =
        createMut.isPending ||
        patchMut.isPending ||
        deleteMut.isPending ||
        resendMut.isPending ||
        transferMut.isPending;
    const [dialog, setDialog] = useState<{ mode: 'add' | 'edit'; member: MemberView | null } | null>(
        null,
    );
    const [confirm, setConfirm] = useState<Confirm>(null);
    const [alert, setAlert] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);

    async function run(p: Promise<{ ok: boolean; message?: string }>, okMsg: string) {
        const res = await p;
        if (res.ok) {
            setAlert({ kind: 'ok', msg: okMsg });
            setDialog(null);
            setConfirm(null);
        } else {
            setAlert({ kind: 'error', msg: res.message || t('error.generic') });
        }
    }

    function submitDialog(draft: MemberDraft) {
        const email = draft.email || undefined;
        if (dialog?.mode === 'add') {
            void run(
                createMut.mutateAsync({
                    name: draft.name,
                    phone: draft.phone,
                    email,
                    roleKey: draft.roleKey,
                    languages: draft.languages,
                    sortOrder: 0,
                    invite: draft.invite,
                }),
                t('toast.added'),
            );
        } else if (dialog?.member) {
            void run(
                patchMut.mutateAsync({
                    id: dialog.member.id,
                    patch: {
                        name: draft.name,
                        phone: draft.phone,
                        email,
                        roleKey: draft.roleKey,
                        languages: draft.languages,
                    },
                }),
                t('toast.saved'),
            );
        }
    }

    return (
        <div className="bg-base-100 border-base-300 rounded-2xl border">
            {alert && (
                <div
                    role={alert.kind === 'ok' ? 'status' : 'alert'}
                    className={`alert ${alert.kind === 'ok' ? 'alert-success' : 'alert-error'} alert-soft m-4 mb-0 text-sm`}
                >
                    {alert.msg}
                </div>
            )}

            <div className="flex items-center justify-between gap-4 p-5">
                <p className="text-base-content/60 text-xs tabular-nums">
                    {t('count', { count: members.length })}
                </p>
                {canManage && (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-full font-semibold"
                        onClick={() => setDialog({ mode: 'add', member: null })}
                    >
                        <FontAwesomeIcon icon={faUserPlus} className="h-3.5 w-3.5" />
                        {t('action.add')}
                    </button>
                )}
            </div>

            {members.length === 0 ? (
                <p className="text-base-content/55 px-5 pb-8 pt-2 text-sm">{t('empty')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr className="text-base-content/55 font-mono text-[10px] uppercase tracking-wider">
                                <th>{t('col.member')}</th>
                                <th>{t('col.role')}</th>
                                <th>{t('col.status')}</th>
                                <th className="text-right">{t('col.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m) => (
                                <MemberRow
                                    key={m.id}
                                    member={m}
                                    canManage={canManage}
                                    onEdit={(mem) => setDialog({ mode: 'edit', member: mem })}
                                    onResend={(mem) =>
                                        void run(resendMut.mutateAsync(mem.id), t('toast.invited'))
                                    }
                                    onTransfer={(mem) => setConfirm({ kind: 'transfer', member: mem })}
                                    onRemove={(mem) => setConfirm({ kind: 'remove', member: mem })}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {dialog && (
                <MemberDialog
                    mode={dialog.mode}
                    initial={dialog.member}
                    busy={pending}
                    onClose={() => setDialog(null)}
                    onSubmit={submitDialog}
                />
            )}

            {confirm && (
                <dialog className="modal modal-open" aria-modal>
                    <div className="modal-box bg-base-100 border-base-300 max-w-sm rounded-2xl border">
                        <h3 className="font-display text-xl font-light">
                            {confirm.kind === 'remove'
                                ? t('confirm.remove_title')
                                : t('confirm.transfer_title')}
                        </h3>
                        <p className="text-base-content/70 mt-2 text-sm">
                            {confirm.kind === 'remove'
                                ? t('confirm.remove_body', { name: confirm.member.name })
                                : t('confirm.transfer_body', { name: confirm.member.name })}
                        </p>
                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-ghost rounded-full"
                                onClick={() => setConfirm(null)}
                                disabled={pending}
                            >
                                {t('action.cancel')}
                            </button>
                            <button
                                type="button"
                                className={`btn rounded-full font-semibold ${confirm.kind === 'remove' ? 'btn-error' : 'btn-primary'}`}
                                disabled={pending}
                                aria-busy={pending}
                                onClick={() =>
                                    confirm.kind === 'remove'
                                        ? void run(
                                              deleteMut.mutateAsync(confirm.member.id),
                                              t('toast.removed'),
                                          )
                                        : void run(
                                              transferMut.mutateAsync(confirm.member.id),
                                              t('toast.transferred'),
                                          )
                                }
                            >
                                {pending && (
                                    <span className="loading loading-spinner loading-xs" />
                                )}
                                {confirm.kind === 'remove'
                                    ? t('action.remove')
                                    : t('action.make_owner')}
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="modal-backdrop"
                        aria-label={t('action.cancel')}
                        onClick={() => setConfirm(null)}
                    />
                </dialog>
            )}
        </div>
    );
}
