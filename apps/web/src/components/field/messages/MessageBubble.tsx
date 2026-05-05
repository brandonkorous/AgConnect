import { useFormatter } from 'next-intl';

type Props = {
    body: string;
    isMe: boolean;
    createdAt: string;
};

export function MessageBubble({ body, isMe, createdAt }: Props) {
    const formatter = useFormatter();
    return (
        <div className={['flex', isMe ? 'justify-end' : 'justify-start'].join(' ')}>
            <div
                className={[
                    'max-w-[80%] rounded-2xl px-3.5 py-2.5',
                    isMe
                        ? 'bg-primary text-primary-content rounded-br-sm'
                        : 'bg-base-100 text-base-content border-base-300 rounded-bl-sm border',
                ].join(' ')}
            >
                <p className="whitespace-pre-line text-base leading-relaxed">{body}</p>
                <p
                    className={[
                        'mt-1 text-right tabular-nums slashed-zero text-[10px]',
                        isMe ? 'text-primary-content/70' : 'text-base-content/55',
                    ].join(' ')}
                >
                    {formatter.dateTime(new Date(createdAt), {
                        hour: 'numeric',
                        minute: '2-digit',
                    })}
                </p>
            </div>
        </div>
    );
}
