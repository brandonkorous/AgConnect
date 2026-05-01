import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

interface Section {
    id: string;
    title: string;
    body: string;
}

interface Props {
    locale: 'en' | 'es';
    eyebrow: string;
    headline: string;
    intro: string;
    sections: Section[];
    lastUpdatedLabel: string;
    lastUpdatedDate: string;
    placeholderNotice: string;
    contactNote: string;
    sectionsLabel: string;
    seeContactsLabel: string;
}

export function LegalPageLayout({
    locale,
    eyebrow,
    headline,
    intro,
    sections,
    lastUpdatedLabel,
    lastUpdatedDate,
    placeholderNotice,
    contactNote,
    sectionsLabel,
    seeContactsLabel,
}: Props) {
    return (
        <section className="bg-base-100 w-full">
            <div className="container mx-auto px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-32">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] lg:gap-20">
                    <aside className="flex flex-col gap-6 lg:sticky lg:top-12 lg:self-start">
                        <EyebrowLabel tone="soil" withRule>
                            {eyebrow}
                        </EyebrowLabel>
                        <h1 className="text-base-content font-serif text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-[56px]">
                            {headline}
                        </h1>
                        <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                            {intro}
                        </p>
                        <p className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                            {lastUpdatedLabel} · {lastUpdatedDate}
                        </p>

                        <nav aria-label="Section navigation" className="border-secondary/20 mt-2 hidden border-t pt-6 lg:flex lg:flex-col lg:gap-2">
                            <p className="text-secondary font-mono text-xs uppercase tracking-[0.18em]">
                                {sectionsLabel}
                            </p>
                            <ul className="flex flex-col gap-1">
                                {sections.map((s, i) => (
                                    <li key={s.id}>
                                        <a
                                            href={`#${s.id}`}
                                            className="text-secondary hover:text-primary font-sans text-sm transition-colors"
                                        >
                                            {String(i + 1).padStart(2, '0')} · {s.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    <div className="flex flex-col gap-12">
                        <div className="border-accent/40 bg-accent/5 border-l-4 px-6 py-4">
                            <p className="text-base-content font-sans text-sm leading-relaxed">
                                {placeholderNotice}
                            </p>
                        </div>

                        {sections.map((s, i) => (
                            <article key={s.id} id={s.id} className="flex flex-col gap-3 scroll-mt-24">
                                <span className="text-secondary font-mono text-xs font-bold uppercase tracking-[0.22em]">
                                    {String(i + 1).padStart(2, '0')} · {s.title}
                                </span>
                                <p className="text-base-content max-w-prose font-sans text-base leading-relaxed">
                                    {s.body}
                                </p>
                            </article>
                        ))}

                        <div className="border-secondary/15 mt-4 flex flex-col gap-4 border-t pt-8">
                            <p className="text-base-content font-sans text-sm leading-relaxed">
                                {contactNote}
                            </p>
                            <Link
                                href={`/${locale}/contact`}
                                className="text-primary inline-flex items-center gap-2 self-start font-sans text-sm font-semibold hover:underline"
                            >
                                <span>{seeContactsLabel}</span>
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
