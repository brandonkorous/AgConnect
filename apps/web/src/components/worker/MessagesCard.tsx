import { useTranslations } from 'next-intl';
import { MESSAGES } from './workerMockData';

export function MessagesCard() {
    const t = useTranslations('worker.dashboard.messages');

    return (
        <section className="bg-base-100 border-base-300 rounded-2xl border">
            <header className="border-base-300 flex items-center justify-between border-b px-4 py-3.5">
                <h3 className="font-serif text-lg font-medium tracking-tight">{t('title')}</h3>
                <span className="badge badge-accent px-2 py-1 font-mono text-[10px] font-bold tracking-wider">
                    {t('new_count', { count: 3 })}
                </span>
            </header>
            <ul>
                {MESSAGES.map((msg, i) => (
                    <li
                        key={msg.id}
                        className={[
                            'flex gap-2.5 px-4 py-3',
                            i < MESSAGES.length - 1 ? 'border-base-300 border-b' : '',
                        ].join(' ')}
                    >
                        <div className="bg-base-200 text-base-content/70 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold">
                            {msg.from[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                                <div className="text-sm font-semibold">{msg.from}</div>
                                <div className="text-base-content/60 font-mono text-[10px]">
                                    {t(`channels.${msg.channel}`)} · {msg.time}
                                </div>
                            </div>
                            <p className="text-base-content/70 mt-0.5 text-sm leading-snug">
                                {msg.body}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
