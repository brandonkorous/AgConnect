import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faPlus } from '@fortawesome/free-solid-svg-icons';
import { EmployerSearchBox } from '@/components/employer/EmployerSearchBox';
import { ThemeToggle } from '@/components/primitives/ThemeToggle';

type Props = {
    locale: string;
    canPublish: boolean;
};

export function EmployerTopBar({ locale, canPublish }: Props) {
    const t = useTranslations('employer.shell.topbar');

    return (
        <div className="border-base-200 bg-base-300 border-b sticky top-0 z-20 flex h-16 items-center gap-4 px-8">
            <EmployerSearchBox locale={locale} />

            <Link
                href={`/${locale}/employer/help` as Route}
                className="btn btn-sm border-base-300 border"
            >
                <FontAwesomeIcon icon={faComments} className="h-3.5 w-3.5" />
                {t('help')}
            </Link>

            {canPublish && (
                <Link
                    href={`/${locale}/employer/jobs/new`}
                    className="btn btn-primary btn-sm"
                >
                    <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
                    {t('post_job')}
                </Link>
            )}
            <ThemeToggle ariaLabel={t('theme_label')} />
        </div>
    );
}
