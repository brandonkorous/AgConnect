import { useTranslations } from 'next-intl';

const ids = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

export function FaqAccordion() {
  const t = useTranslations('landing.faq.items');

  return (
    <ul className="flex flex-col">
      {ids.map((id, i) => (
        <li
          key={id}
          className={i === 0 ? 'border-ink border-t border-b' : 'border-hairline border-b'}
        >
          <details open={i === 0} className="group">
            <summary className="flex cursor-pointer items-start justify-between gap-6 py-7 list-none [&::-webkit-details-marker]:hidden">
              <span className="text-ink font-serif text-2xl font-semibold leading-tight tracking-[-0.015em]">
                {t(`${id}.q`)}
              </span>
              <span
                className="text-soil mt-1.5 flex size-6 shrink-0 items-center justify-center"
                aria-hidden
              >
                <svg width="22" height="22" viewBox="0 0 22 22" className="group-open:hidden">
                  <path d="M5 11 H17 M11 5 V17" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  className="hidden group-open:block"
                >
                  <path d="M5 9 L11 15 L17 9" stroke="#2D4030" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </summary>
            <p className="text-text-deep max-w-[640px] pb-7 font-sans text-base leading-relaxed">
              {t(`${id}.a`)}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}
