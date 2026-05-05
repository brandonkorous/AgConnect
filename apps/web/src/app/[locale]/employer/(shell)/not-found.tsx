import { getTranslations, getLocale } from 'next-intl/server';
import {
  faBriefcase,
  faUsers,
  faMagnifyingGlass,
  faCalendarDays,
  faShieldHalved,
  faChartColumn,
} from '@fortawesome/free-solid-svg-icons';
import { DashboardErrorState } from '@/components/shell/DashboardErrorState';

export default async function EmployerShellNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('shell.page_error');

  return (
    <DashboardErrorState
      code="404"
      eyebrow={t('404.eyebrow')}
      title={t('404.title')}
      description={t('section.employer.404.description')}
      primaryAction={{
        href: `/${locale}/employer/dashboard`,
        label: t('section.employer.action.dashboard'),
      }}
      cardsLabel={t('section.employer.cards_label')}
      cards={[
        {
          href: `/${locale}/employer/jobs`,
          icon: faBriefcase,
          label: t('section.employer.suggestions.jobs.label'),
          hint: t('section.employer.suggestions.jobs.hint'),
        },
        {
          href: `/${locale}/employer/inbox`,
          icon: faUsers,
          label: t('section.employer.suggestions.inbox.label'),
          hint: t('section.employer.suggestions.inbox.hint'),
        },
        {
          href: `/${locale}/employer/workers`,
          icon: faMagnifyingGlass,
          label: t('section.employer.suggestions.workers.label'),
          hint: t('section.employer.suggestions.workers.hint'),
        },
        {
          href: `/${locale}/employer/crews`,
          icon: faCalendarDays,
          label: t('section.employer.suggestions.crews.label'),
          hint: t('section.employer.suggestions.crews.hint'),
        },
        {
          href: `/${locale}/employer/compliance`,
          icon: faShieldHalved,
          label: t('section.employer.suggestions.compliance.label'),
          hint: t('section.employer.suggestions.compliance.hint'),
        },
        {
          href: `/${locale}/employer/reports`,
          icon: faChartColumn,
          label: t('section.employer.suggestions.reports.label'),
          hint: t('section.employer.suggestions.reports.hint'),
        },
      ]}
    />
  );
}
