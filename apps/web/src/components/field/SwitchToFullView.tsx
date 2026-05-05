import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

type Props = {
    locale: string;
};

export function SwitchToFullView({ locale }: Props) {
    const t = useTranslations('worker.field.exit');
    return (
        <div className="border-base-300/60 mx-auto mt-10 flex max-w-md flex-col items-center gap-1 border-t px-4 pb-6 pt-6 text-center">
            <Link
                href={`/${locale}/worker/dashboard` as Route}
                className="text-base-content/70 hover:text-base-content active:text-primary inline-flex h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
            >
                <FontAwesomeIcon
                    icon={faArrowUpRightFromSquare}
                    className="h-3.5 w-3.5"
                    aria-hidden
                />
                {t('switch_to_full')}
            </Link>
            <p className="text-base-content/45 text-xs">{t('switch_to_full_hint')}</p>
        </div>
    );
}
