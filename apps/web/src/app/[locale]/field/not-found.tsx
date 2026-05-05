import { getTranslations, getLocale } from 'next-intl/server';
import { ErrorState } from '@agconn/ui';

export default async function FieldNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('shell.page_error');

  return (
    <ErrorState
      code="404"
      eyebrow={t('404.eyebrow')}
      title={t('section.field.404.title')}
      description={t('section.field.404.description')}
      primaryAction={{
        href: `/${locale}/field`,
        label: t('section.field.action.home'),
      }}
      secondaryAction={{
        href: `/${locale}/worker`,
        label: t('section.field.action.full_view'),
      }}
    />
  );
}
