import { getTranslations, getLocale } from 'next-intl/server';
import { ErrorState } from '@agconn/ui';

export default async function AdminNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('shell.page_error');

  return (
    <ErrorState
      code="404"
      eyebrow={t('404.eyebrow')}
      title={t('section.admin.404.title')}
      description={t('section.admin.404.description')}
      primaryAction={{
        href: `/${locale}/admin`,
        label: t('section.admin.action.home'),
      }}
    />
  );
}
