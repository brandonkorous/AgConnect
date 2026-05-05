import { getTranslations, getLocale } from 'next-intl/server';
import { ErrorState } from '@agconn/ui';

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('shell.page_error');

  return (
    <main className="bg-base-300 text-base-content min-h-screen">
      <ErrorState
        code="404"
        eyebrow={t('404.eyebrow')}
        title={t('404.title')}
        description={t('404.description')}
        suggestionsLabel={t('suggestions_label')}
        suggestions={[
          {
            href: `/${locale}/jobs`,
            label: t('section.marketing.suggestions.jobs.label'),
            hint: t('section.marketing.suggestions.jobs.hint'),
          },
          {
            href: `/${locale}/employers`,
            label: t('section.marketing.suggestions.employers.label'),
            hint: t('section.marketing.suggestions.employers.hint'),
          },
          {
            href: `/${locale}/contact`,
            label: t('section.marketing.suggestions.contact.label'),
            hint: t('section.marketing.suggestions.contact.hint'),
          },
        ]}
        primaryAction={{
          href: `/${locale}`,
          label: t('section.marketing.action.home'),
        }}
        secondaryAction={{
          href: `/${locale}/jobs`,
          label: t('section.marketing.action.jobs'),
        }}
      />
    </main>
  );
}
