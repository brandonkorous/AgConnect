import { useTranslations } from 'next-intl';
import { EyebrowLabel } from '@/components/primitives/EyebrowLabel';

export function BilingualSection() {
  const t = useTranslations('landing.bilingual');

  return (
    <section id="training-orgs" className="bg-sage w-full">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-5 py-24 md:px-8 md:py-28 lg:px-20 lg:py-30">
        <div className="flex max-w-[920px] flex-col gap-4">
          <EyebrowLabel tone="soil" withRule>
            {t('eyebrow')}
          </EyebrowLabel>
          <h2 className="text-ink font-serif text-[40px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[52px] lg:text-[64px]">
            {t('headline.line1')}
            <br />
            {t('headline.line2')}
          </h2>
          <p className="text-text-deep mt-2 max-w-[680px] font-sans text-lg leading-relaxed">
            {t('body')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <SmsCard />
          <EmailCard />
          <CertCard />
        </div>
      </div>
    </section>
  );
}

function SmsCard() {
  const t = useTranslations('landing.bilingual.sms');
  return (
    <article className="border-hairline-warm bg-bone flex flex-col gap-4 border p-8">
      <p className="text-soil font-sans text-[11px] font-bold tracking-[0.18em] uppercase">
        {t('label')}
      </p>
      <div className="bg-sage border-l-moss border-l-[3px] p-4">
        <p className="text-ink font-sans text-[15px] leading-relaxed">{t('body')}</p>
      </div>
      <p className="text-soil font-mono text-[11px]">{t('meta')}</p>
    </article>
  );
}

function EmailCard() {
  const t = useTranslations('landing.bilingual.email');
  return (
    <article className="border-hairline-warm bg-bone flex flex-col gap-4 border p-8">
      <p className="text-soil font-sans text-[11px] font-bold tracking-[0.18em] uppercase">
        {t('label')}
      </p>
      <div className="bg-sage border-l-honey border-l-[3px] p-4">
        <p className="text-ink font-serif text-base font-semibold">{t('subject')}</p>
        <p className="text-ink mt-1.5 font-sans text-[15px] leading-relaxed">{t('body')}</p>
      </div>
      <p className="text-soil font-mono text-[11px]">{t('meta')}</p>
    </article>
  );
}

function CertCard() {
  const t = useTranslations('landing.bilingual.cert');
  return (
    <article className="border-hairline-warm bg-bone flex flex-col gap-4 border p-8">
      <p className="text-soil font-sans text-[11px] font-bold tracking-[0.18em] uppercase">
        {t('label')}
      </p>
      <div className="bg-sage border-moss flex flex-col gap-2 border-[1.5px] border-double p-4">
        <div className="border-moss flex items-center justify-between border-b pb-1.5">
          <span className="text-soil font-mono text-[9px] tracking-[0.06em]">{t('id')}</span>
          <span className="bg-moss inline-block size-5 rounded-full" aria-hidden />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-soil font-mono text-[9px] tracking-[0.08em]">EN</p>
            <p className="text-ink font-serif text-[13px] font-semibold">{t('en')}</p>
          </div>
          <span className="bg-moss w-px shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-soil font-mono text-[9px] tracking-[0.08em]">ES</p>
            <p className="text-ink font-serif text-[13px] font-semibold">{t('es')}</p>
          </div>
        </div>
      </div>
      <p className="text-soil font-mono text-[11px]">{t('meta')}</p>
    </article>
  );
}
