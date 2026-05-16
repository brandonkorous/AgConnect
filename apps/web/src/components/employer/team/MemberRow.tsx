'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEllipsisVertical,
    faPenToSquare,
    faPaperPlane,
    faKey,
    faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import type { MemberView } from '@agconn/schemas';
import { StatusBadge } from '@/components/employer/primitives/StatusBadge';
import { STATUS_BADGE, type MemberStatus } from './roles';

type Props = {
    member: MemberView;
    canManage: boolean;
    onEdit: (m: MemberView) => void;
    onResend: (m: MemberView) => void;
    onTransfer: (m: MemberView) => void;
    onRemove: (m: MemberView) => void;
};

export function MemberRow({
    member,
    canManage,
    onEdit,
    onResend,
    onTransfer,
    onRemove,
}: Props) {
    const t = useTranslations('employer.team');
    const tRoles = useTranslations('employer.roles');
    const status = member.status as MemberStatus;
    const canResend = !member.isOwner && member.status !== 'active' && Boolean(member.email);
    const canMakeOwner = canManage && !member.isOwner && member.status === 'active';

    return (
        <tr className="hover:bg-base-200/40">
            <td className="py-3">
                <div className="font-semibold">{member.name}</div>
                <div className="text-base-content/60 text-xs tabular-nums">
                    {member.email || member.phone || '—'}
                </div>
            </td>
            <td>
                {member.isOwner ? (
                    <span className="badge badge-primary badge-soft badge-sm font-mono text-[10px] font-bold uppercase tracking-wider">
                        {tRoles('owner')}
                    </span>
                ) : (
                    <span className="text-sm">{tRoles(member.roleKey)}</span>
                )}
            </td>
            <td>
                <StatusBadge status={STATUS_BADGE[status]} label={t(`status.${status}`)} />
            </td>
            <td className="text-right">
                {canManage && !member.isOwner ? (
                    <div className="dropdown dropdown-end">
                        <button
                            type="button"
                            tabIndex={0}
                            className="btn btn-ghost btn-sm btn-circle"
                            aria-label={t('action.menu')}
                        >
                            <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                        </button>
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu bg-base-100 border-base-300 rounded-box z-30 w-52 border p-2 shadow-lg"
                        >
                            <li>
                                <button type="button" onClick={() => onEdit(member)}>
                                    <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
                                    {t('action.edit')}
                                </button>
                            </li>
                            {canResend && (
                                <li>
                                    <button type="button" onClick={() => onResend(member)}>
                                        <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
                                        {member.status === 'invited'
                                            ? t('action.resend')
                                            : t('action.invite')}
                                    </button>
                                </li>
                            )}
                            {canMakeOwner && (
                                <li>
                                    <button type="button" onClick={() => onTransfer(member)}>
                                        <FontAwesomeIcon icon={faKey} className="h-3.5 w-3.5" />
                                        {t('action.make_owner')}
                                    </button>
                                </li>
                            )}
                            <li>
                                <button
                                    type="button"
                                    className="text-error"
                                    onClick={() => onRemove(member)}
                                >
                                    <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                                    {t('action.remove')}
                                </button>
                            </li>
                        </ul>
                    </div>
                ) : (
                    <span className="text-base-content/30">—</span>
                )}
            </td>
        </tr>
    );
}
