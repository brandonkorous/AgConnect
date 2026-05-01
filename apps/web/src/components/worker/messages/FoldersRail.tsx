import { useTranslations } from 'next-intl';
import { FOLDERS, CHANNEL_DOT, type Channel } from './messagesMockData';

export function FoldersRail() {
  const t = useTranslations('worker.messages.folders');
  const tChan = useTranslations('worker.messages.channels');
  const channels: Channel[] = ['SMS', 'WhatsApp', 'In-app'];
  const chanKey: Record<Channel, string> = { SMS: 'sms', WhatsApp: 'whatsapp', 'In-app': 'in_app' };
  return (
    <div className="border-base-300 flex flex-col gap-0.5 border-r p-2.5">
      {FOLDERS.map((f, i) => (
        <a
          key={f.key}
          href="#"
          className={[
            'flex items-center justify-between rounded-lg px-2.5 py-2 text-[12.5px] no-underline',
            i === 0
              ? 'bg-base-200 text-base-content font-semibold'
              : 'text-base-content/80 font-medium',
          ].join(' ')}
        >
          <span>{t(f.key)}</span>
          <span className="text-base-content/60 font-mono text-[10.5px] font-bold">
            {f.count}
          </span>
        </a>
      ))}
      <div className="border-base-300 mt-3 border-t pt-3">
        <div className="text-base-content/60 mb-2 px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em]">
          {t('channels_label')}
        </div>
        {channels.map((c) => (
          <div
            key={c}
            className="text-base-content/80 flex items-center gap-2 px-2.5 py-1.5 text-[12px]"
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: CHANNEL_DOT[c] }}
            />
            {tChan(chanKey[c])}
          </div>
        ))}
      </div>
    </div>
  );
}
