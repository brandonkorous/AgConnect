import { useTranslations } from 'next-intl';
import { faqIds, defaultOpenFaqs } from '@/data/faqs';

export function FaqAccordion() {
  const t = useTranslations('faq');

  return (
    <ul className="flex flex-col">
      {faqIds.map((id) => (
        <li key={id} className="border-soil/20 group border-t last:border-b">
          <details open={defaultOpenFaqs.includes(id)} className="open:pb-6">
            <summary className="flex cursor-pointer items-start justify-between gap-6 py-5 font-serif text-xl font-medium leading-snug tracking-tight text-ink list-none [&::-webkit-details-marker]:hidden">
              <span>{t(`${id}.q`)}</span>
              <span
                className="text-soil mt-1 flex h-6 w-6 shrink-0 items-center justify-center font-mono text-2xl leading-none transition-transform group-has-[details[open]]:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="text-ink/85 max-w-[640px] font-sans text-base leading-relaxed">
              {t(`${id}.a`)}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}
