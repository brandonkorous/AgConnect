import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import { EmployerSearchBox } from '@/components/employer/EmployerSearchBox';
import { ThemeToggle } from '@/components/primitives/ThemeToggle';

type Props = {
    locale: string;
};

export function EmployerTopBar({ locale }: Props) {
    const t = useTranslations('employer.shell.topbar');

    return (
        <div className="border-base-200 bg-base-300 border-b sticky top-0 z-20 hidden h-16 items-center gap-4 px-8 md:flex">
            <EmployerSearchBox locale={locale} />

            <Link
                href={`/${locale}/employer/help` as Route}
                className="btn btn-sm btn-ghost"
            >
                <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5" />
                {t('help')}
            </Link>

            <ThemeToggle ariaLabel={t('theme_toggle_aria')} />
        </div>
    );
}
