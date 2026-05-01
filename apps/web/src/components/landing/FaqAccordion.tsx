import { useTranslations } from 'next-intl';

export type FaqEntry = { id: string; question: string; answer: string };

type Props = {
    entries?: ReadonlyArray<FaqEntry>;
    initialOpen?: ReadonlyArray<string>;
};

const FALLBACK_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export function FaqAccordion({ entries, initialOpen }: Props) {
    const t = useTranslations('landing.faq.items');

    const items: ReadonlyArray<FaqEntry> =
        entries ??
        FALLBACK_IDS.map((id) => ({
            id,
            question: t(`${id}.q`),
            answer: t(`${id}.a`),
        }));

    const openSet = new Set(initialOpen ?? (entries ? [] : [items[0]?.id].filter(Boolean) as string[]));

    return (
        <ul className="flex flex-col">
            {items.map((entry, i) => (
                <li
                    key={entry.id}
                    id={entry.id}
                    className={i === 0 ? 'border-neutral border-t scroll-mt-24' : 'scroll-mt-24'}
                >
                    <div className="collapse collapse-arrow border-base-300 rounded-none border-b">
                        <input
                            type="checkbox"
                            defaultChecked={openSet.has(entry.id)}
                            aria-label={entry.question}
                        />
                        <div className="collapse-title text-base-content font-serif text-2xl font-semibold leading-tight tracking-tight py-7 pr-12 pl-0">
                            {entry.question}
                        </div>
                        <div className="collapse-content text-base-content font-sans text-base leading-relaxed px-0">
                            <p className="pb-4">{entry.answer}</p>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
