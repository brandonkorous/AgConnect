import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

const CHANNEL_DOT: Record<string, string> = {
  sms: 'oklch(50% 0.09 120)',
  whatsapp: '#22c55e',
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
  const folders: { key: FolderKey; label: string }[] = [
    { key: 'all', label: t('all') },
    { key: 'employers', label: t('employers') },
    { key: 'foremen', label: t('foremen') },
    { key: 'agconn', label: t('agconn') },
  ];
  const channels: { key: 'sms' | 'whatsapp' | 'app'; label: string }[] = [
    { key: 'sms', label: tChan('sms') },
    { key: 'whatsapp', label: tChan('whatsapp') },
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
    <div className="border-base-300 flex flex-col gap-0.5 border-r p-2.5">
      {folders.map((f) => {
        const active = f.key === folder;
        return (
          <Link
            key={f.key}
            href={buildHref({ folder: f.key }) as Route}
            className={[
              'flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] no-underline',
              active
                ? 'bg-base-200 text-base-content font-semibold'
                : 'text-base-content/80 font-medium',
            ].join(' ')}
          >
            <span>{f.label}</span>
            <span className="text-base-content/60 font-mono text-[10.5px] font-bold">
              {counts[f.key] ?? 0}
            </span>
          </Link>
        );
      })}
      <div className="border-base-300 mt-3 border-t pt-3">
        <div className="text-base-content/60 mb-2 px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em]">
          {t('channels_label')}
        </div>
        {channels.map((c) => {
          const active = c.key === channel;
          return (
            <Link
              key={c.key}
              href={buildHref({ channel: active ? null : c.key }) as Route}
              className={[
                'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] no-underline',
                active ? 'bg-base-200 font-semibold text-base-content' : 'text-base-content/80',
              ].join(' ')}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: CHANNEL_DOT[c.key] }}
              />
              {c.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
