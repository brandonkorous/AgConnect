import { getTranslations, getLocale } from 'next-intl/server';
import {
  faLeaf,
  faClipboardCheck,
  faCalendarDays,
  faSackDollar,
  faGraduationCap,
  faComments,
} from '@fortawesome/free-solid-svg-icons';
import { DashboardErrorState } from '@/components/shell/DashboardErrorState';

export default async function WorkerNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('shell.page_error');

  return (
    <DashboardErrorState
      code="404"
      eyebrow={t('404.eyebrow')}
      title={t('404.title')}
      description={t('section.worker.404.description')}
      primaryAction={{
        href: `/${locale}/worker/dashboard`,
        label: t('section.worker.action.dashboard'),
      }}
      cardsLabel={t('section.worker.cards_label')}
      cards={[
        {
          href: `/${locale}/worker/shifts`,
          icon: faCalendarDays,
          label: t('section.worker.suggestions.shifts.label'),
          hint: t('section.worker.suggestions.shifts.hint'),
        },
        {
          href: `/${locale}/worker/jobs`,
          icon: faLeaf,
          label: t('section.worker.suggestions.jobs.label'),
          hint: t('section.worker.suggestions.jobs.hint'),
        },
        {
          href: `/${locale}/worker/applications`,
          icon: faClipboardCheck,
          label: t('section.worker.suggestions.applications.label'),
          hint: t('section.worker.suggestions.applications.hint'),
        },
        {
          href: `/${locale}/worker/pay`,
          icon: faSackDollar,
          label: t('section.worker.suggestions.pay.label'),
          hint: t('section.worker.suggestions.pay.hint'),
        },
        {
          href: `/${locale}/worker/messages`,
          icon: faComments,
          label: t('section.worker.suggestions.messages.label'),
          hint: t('section.worker.suggestions.messages.hint'),
        },
        {
          href: `/${locale}/worker/training`,
          icon: faGraduationCap,
          label: t('section.worker.suggestions.training.label'),
          hint: t('section.worker.suggestions.training.hint'),
        },
      ]}
    />
  );
}
