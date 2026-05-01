import { getTranslations } from 'next-intl/server';
import { PageError } from '@agconn/ui';

export default async function NotFound() {
  const t = await getTranslations('shell.page_error');
  return (
    <PageError
      variant="404"
      title={t('404.title')}
      description={t('404.description')}
      goHomeLabel={t('go_home')}
    />
  );
}
