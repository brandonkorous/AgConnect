import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export type AudienceCardProps = {
    surface: 'moss' | 'bone' | 'sage';
    eyebrow: string;
    headline: string;
    bullets: [string, string, string, string];
    ctaText: string;
    ctaHref: string;
};

export function AudienceCard(props: AudienceCardProps) {
    const { surface } = props;
    const isMoss = surface === 'moss';
    const isBone = surface === 'bone';
    const isSage = surface === 'sage';

    const containerClass = isMoss
        ? 'bg-primary text-primary-content'
        : isBone
            ? 'card-bordered bg-base-100 border-primary border-2'
            : 'bg-base-300';
    const eyebrowTone = isMoss ? 'text-accent' : 'text-secondary';
    const headlineTone = isMoss ? 'text-primary-content' : 'text-base-content';
    const bulletTextTone = isMoss ? 'text-primary-content' : 'text-base-content';
    const checkTone = isMoss ? 'text-accent' : 'text-primary';
    const ctaTone = isMoss ? 'text-accent' : 'text-primary';
    const dividerClass = isMoss ? 'border-secondary' : isSage ? 'border-secondary/30' : 'border-secondary/20';

    return (
        <article className={`card ${containerClass}`}>
            <div className="card-body p-10 gap-6">
                <span className={`label ${eyebrowTone}`}>{props.eyebrow}</span>

                <h3
                    className={`card-title font-serif text-3xl font-semibold tracking-tight md:text-4xl ${headlineTone}`}
                >
                    {props.headline}
                </h3>

                <ul className="flex flex-col gap-3.5 pt-2">
                    {props.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <FontAwesomeIcon
                                icon={faCircleCheck}
                                className={`mt-1 text-xl shrink-0 ${checkTone}`}
                            />
                            <span className={`font-sans text-base leading-relaxed ${bulletTextTone}`}>
                                {bullet}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className={`card-actions mt-auto border-t pt-4 ${dividerClass}`}>
                    <a
                        href={props.ctaHref}
                        className={`link link-hover inline-flex items-center gap-2 font-sans text-base font-semibold ${ctaTone}`}
                    >
                        <span>{props.ctaText}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                    </a>
                </div>
            </div>
        </article>
    );
}
