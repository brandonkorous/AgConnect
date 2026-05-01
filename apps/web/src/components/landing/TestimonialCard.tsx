import { useTranslations } from 'next-intl';

type Props = { id: '1' | '2' | '3' };

export function TestimonialCard({ id }: Props) {
    const t = useTranslations(`landing.testimonials.${id}`);
    const surface = t('surface');

    const isMoss = surface === 'moss';
    const isSage = surface === 'sage';

    const containerClass = isMoss
        ? 'bg-primary text-primary-content'
        : isSage
            ? 'bg-base-300'
            : 'bg-base-100 border-base-100';
    const bodyClass = isMoss ? 'text-primary-content' : 'text-base-content';
    const dividerClass = isMoss ? 'border-secondary' : 'border-base-300';
    const nameClass = isMoss ? 'text-primary-content' : 'text-base-content';
    const roleClass = isMoss ? 'text-accent' : 'text-secondary';
    const initialBg = isMoss
        ? 'bg-accent text-accent-content'
        : isSage
            ? 'bg-secondary text-secondary-content'
            : 'bg-primary text-primary-content';
    const name = t('name');
    const initial = name.trim().charAt(0);

    return (
        <article className={`card h-full ${containerClass}`}>
            <div className="card-body p-10 gap-6">
                <p
                    className={`card-title font-serif text-xl font-medium leading-snug tracking-tight ${bodyClass}`}
                >
                    {t('quote')}
                </p>

                <div className={`mt-auto flex items-center gap-3.5 border-t pt-4 ${dividerClass}`}>
                    <span className={`avatar placeholder`}>
                        <span
                            className={`flex size-12 shrink-0 items-center justify-center rounded-full font-serif text-xl font-semibold ${initialBg}`}
                        >
                            {initial}
                        </span>
                    </span>
                    <div className="flex flex-col gap-0.5">
                        <p className={`font-sans text-base font-semibold ${nameClass}`}>{name}</p>
                        <p className={`font-sans text-sm ${roleClass}`}>{t('role')}</p>
                    </div>
                </div>
            </div>
        </article>
    );
}
