import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

type Props = {
  tone?: 'soil' | 'bone';
  separator?: '|' | '·';
};

export function LocaleToggle({ tone = 'soil', separator = '|' }: Props) {
  const locale = useLocale();
  const activeClass = tone === 'bone' ? 'text-bone' : 'text-ink';
  const inactiveClass = tone === 'bone' ? 'text-bone/60 hover:text-bone' : 'text-soil hover:text-ink';
  const dividerClass = tone === 'bone' ? 'text-bone/40' : 'text-soil/50';

  return (
    <div className="flex items-center gap-2 font-sans text-[13px] leading-4">
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
