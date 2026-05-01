import { useTranslations } from 'next-intl';

const ids = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export function FaqAccordion() {
    const t = useTranslations('landing.faq.items');

    return (
        <ul className="flex flex-col">
            {ids.map((id, i) => (
                <li
                    key={id}
                    className={i === 0 ? 'border-neutral border-t' : ''}
                >
                    <div className="collapse collapse-arrow border-base-300 rounded-none border-b">
                        <input type="checkbox" defaultChecked={i === 0} aria-label={t(`${id}.q`)} />
                        <div className="collapse-title text-base-content font-serif text-2xl font-semibold leading-tight tracking-tight py-7 pr-12 pl-0">
                            {t(`${id}.q`)}
                        </div>
                        <div className="collapse-content text-base-content font-sans text-base leading-relaxed px-0">
                            <p className=" pb-4">{t(`${id}.a`)}</p>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
