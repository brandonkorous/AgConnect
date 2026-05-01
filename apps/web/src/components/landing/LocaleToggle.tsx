import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

type Props = {
    tone?: 'soil' | 'bone';
    separator?: '|' | '·';
};

export function LocaleToggle({ tone = 'soil', separator = '|' }: Props) {
    const locale = useLocale();
    const activeClass = tone === 'bone' ? 'text-neutral-content' : 'text-neutral-content';
    const inactiveClass = tone === 'bone' ? 'text-neutral-content/60 hover:text-neutral-content' : 'text-secondary hover:text-neutral-content';
    const dividerClass = tone === 'bone' ? 'text-neutral-content/40' : 'text-secondary/50';

    return (
        <div className="flex items-center gap-2 font-sans text-sm leading-4">
            <Link
                href="/"
                locale="en"
                className={`font-semibold ${locale === 'en' ? activeClass : inactiveClass}`}
                aria-current={locale === 'en' ? 'true' : undefined}
            >
                EN
            </Link>
            <span className={dividerClass} aria-hidden>
                {separator}
            </span>
            <Link
                href="/"
                locale="es"
                className={`font-semibold ${locale === 'es' ? activeClass : inactiveClass}`}
                aria-current={locale === 'es' ? 'true' : undefined}
            >
                ES
            </Link>
        </div>
    );
}
