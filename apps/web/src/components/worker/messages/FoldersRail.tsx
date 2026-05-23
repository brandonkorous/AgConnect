import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faComments,
    faBuilding,
    faShieldHalved,
    faLeaf,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

const CHANNEL_DOT: Record<string, string> = {
    sms: 'oklch(50% 0.09 120)',
    app: 'oklch(83% 0.13 88)',
};

type FolderKey = 'all' | 'employers' | 'foremen' | 'agconn';

type Props = {
    counts: Record<string, number>;
    locale: string;
    folder: FolderKey;
    channel: string | undefined;
};

export function FoldersRail({ counts, locale: _locale, folder, channel }: Props) {
    const t = useTranslations('worker.messages.folders');
    const tChan = useTranslations('worker.messages.channels');
    const folders: { key: FolderKey; label: string; icon: IconDefinition }[] = [
        { key: 'all', label: t('all'), icon: faComments },
        { key: 'employers', label: t('employers'), icon: faBuilding },
        { key: 'foremen', label: t('foremen'), icon: faShieldHalved },
        { key: 'agconn', label: t('agconn'), icon: faLeaf },
    ];
    const channels: { key: 'sms' | 'app'; label: string }[] = [
        { key: 'sms', label: tChan('sms') },
        { key: 'app', label: tChan('in_app') },
    ];

    function buildHref(opts: { folder?: FolderKey | null; channel?: string | null }): string {
        const params = new URLSearchParams();
        const nextFolder = opts.folder === undefined ? folder : opts.folder ?? null;
        const nextChannel = opts.channel === undefined ? channel ?? null : opts.channel;
        if (nextFolder && nextFolder !== 'all') params.set('folder', nextFolder);
        if (nextChannel) params.set('channel', nextChannel);
        const qs = params.toString();
        return qs ? `?${qs}` : '?';
    }

    return (
        <div className="bg-base-200 border-base-300 border-r p-3 grow-0">
            <ul className="menu w-full p-0">
                {folders.map((f) => {
                    const active = f.key === folder;
                    const count = counts[f.key] ?? 0;
                    return (
                        <li key={f.key}>
                            <Link
                                href={buildHref({ folder: f.key }) as Route}
                                className={active ? 'menu-active' : ''}
                            >
                                <FontAwesomeIcon icon={f.icon} className="w-3.5" />
                                <span className="flex-1">{f.label}</span>
                                {count > 0 && (
                                    <span className="badge badge-sm badge-neutral">{count}</span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <div className="border-base-300 mt-4 border-t pt-3">
                <div className="text-base-content/60 mb-2 px-2 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {t('channels_label')}
                </div>
                <ul className="menu w-full p-0">
                    {channels.map((c) => {
                        const active = c.key === channel;
                        return (
                            <li key={c.key}>
                                <Link
                                    href={buildHref({ channel: active ? null : c.key }) as Route}
                                    className={active ? 'menu-active' : ''}
                                >
                                    <span
                                        className="inline-block h-1.5 w-1.5 rounded-full"
                                        style={{ background: CHANNEL_DOT[c.key] }}
                                    />
                                    <span className="flex-1">{c.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
