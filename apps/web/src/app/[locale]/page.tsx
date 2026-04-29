import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('landing.hero');

  return (
    <main className="bg-base-100 text-base-content flex min-h-screen items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <p className="label text-soil mb-8">{t('eyebrow')}</p>
        <h1 className="font-serif text-5xl leading-none text-ink italic md:text-7xl lg:text-8xl">
          {t('title.line1')}
          <br />
          {t('title.line2')}
        </h1>
        <p className="text-soil mt-10 font-sans text-base">{t('shellNotice')}</p>
      </div>
    </main>
  );
}
