import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

type Status = 'confirmed' | 'already' | 'expired' | 'invalid';

const VALID: Status[] = ['confirmed', 'already', 'expired', 'invalid'];

function parseStatus(raw: string | string[] | undefined): Status {
    if (typeof raw !== 'string') return 'invalid';
    return (VALID as string[]).includes(raw) ? (raw as Status) : 'invalid';
}

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ status?: string | string[] }>;
};

export default async function ConfirmPage({ params, searchParams }: Props) {
    const [{ locale }, sp] = await Promise.all([params, searchParams]);
    const status = parseStatus(sp?.status);
    const t = await getTranslations({ locale, namespace: 'landing.confirm' });

    const tone = status === 'confirmed' || status === 'already' ? 'success' : 'error';
    const eyebrow = t(`${status}.eyebrow`);
    const headline = t(`${status}.headline`);
    const body = t(`${status}.body`);

    return (
        <main className="bg-base-100 min-h-screen">
            <section className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-5 py-24 md:px-8 md:py-28">
                <EyebrowLabel tone={tone === 'success' ? 'honey' : 'soil'}>{eyebrow}</EyebrowLabel>

                <h1 className="text-base-content font-serif text-5xl font-light italic leading-tight tracking-tight md:text-6xl">
                    {headline}
                </h1>

                <p className="text-secondary font-sans text-base leading-relaxed md:text-lg">{body}</p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link href={`/${locale}`} className="btn btn-primary">
                        <span>{t('cta_home')}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                    </Link>
                </div>
            </section>
        </main>
    );
}

export const dynamic = 'force-dynamic';
