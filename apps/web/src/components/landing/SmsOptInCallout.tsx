import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentSms } from '@fortawesome/free-solid-svg-icons';
import {
  inboundOptInKeyword,
  inboundPhoneDisplay,
  inboundPhoneTel,
} from '@agconn/sms/inbound-number';

// Mobile-originated SMS opt-in callout. Used in three surfaces per the
// design principle that workers should never need to sign up:
//   (a) MarketingFooter — every page, full-width strip
//   (b) /sms-consent legal page — primary callout above the section list
//   (c) Worker landing page hero — primary CTA pair (text or web)
//
// Bilingual copy is inline (no i18n key lookup) so that variant prop
// usage and locale switching stay entirely in this file. The published
// keyword and number come from packages/sms/src/inbound-number.ts; that
// helper is the single swap point for future per-region phone numbers.

type Variant = 'footer' | 'page' | 'hero';

const COPY = {
  en: {
    eyebrow: 'No signup required',
    headline: 'Text JOBS to get started',
    body: "We'll text back to confirm. From then on you'll get bilingual job alerts in your area. Reply STOP any time.",
    bodyShort: "Reply YES when we ask, then you're in. STOP cancels any time.",
    buttonText: 'Text JOBS now',
    altWebText: 'Or sign up at agconn.com',
  },
  es: {
    eyebrow: 'Sin registro requerido',
    headline: 'Envía TRABAJO para empezar',
    body: 'Te respondemos para confirmar. Después recibirás avisos bilingües de trabajos en tu zona. Responde STOP cuando quieras.',
    bodyShort: 'Responde SI cuando preguntemos. STOP cancela cuando quieras.',
    buttonText: 'Enviar TRABAJO ahora',
    altWebText: 'O regístrate en agconn.com',
  },
} as const;

export function SmsOptInCallout({
  locale,
  variant = 'footer',
}: {
  locale: 'en' | 'es';
  variant?: Variant;
}) {
  const copy = COPY[locale];
  const keyword = inboundOptInKeyword(locale);
  const phoneDisplay = inboundPhoneDisplay();
  const smsHref = `sms:${inboundPhoneTel()}?body=${encodeURIComponent(keyword)}`;

  if (variant === 'footer') {
    return (
      <div className="border-secondary/30 bg-neutral text-neutral-content border-y">
        <div className="container mx-auto flex flex-col items-start gap-4 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:px-20">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon
              icon={faCommentSms}
              className="text-accent mt-0.5 h-5 w-5 shrink-0"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-accent eyebrow">{copy.eyebrow}</p>
              <p className="font-serif text-lg leading-tight">
                {copy.headline}{' '}
                <span className="text-accent font-mono tabular-nums">
                  {phoneDisplay}
                </span>
              </p>
              <p className="text-neutral-content/70 max-w-xl text-sm">
                {copy.bodyShort}
              </p>
            </div>
          </div>
          <a
            href={smsHref}
            className="btn btn-accent btn-sm self-start md:self-auto"
          >
            {copy.buttonText}
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className="bg-base-100 border-base-300 rounded-2xl border p-5 md:p-6">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon
            icon={faCommentSms}
            className="text-primary mt-1 h-6 w-6 shrink-0"
            aria-hidden
          />
          <div className="space-y-2">
            <p className="text-primary eyebrow">{copy.eyebrow}</p>
            <p className="font-serif text-2xl leading-tight">
              {copy.headline}{' '}
              <span className="text-primary font-mono tabular-nums">
                {phoneDisplay}
              </span>
            </p>
            <p className="text-base-content/70 text-sm">{copy.body}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href={smsHref} className="btn btn-primary">
                {copy.buttonText}
              </a>
              <a
                href={`/${locale}/sign-up`}
                className="btn btn-ghost"
              >
                {copy.altWebText}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // page variant — used inside /sms-consent legal page chrome
  return (
    <div className="bg-primary/5 border-primary/30 rounded-2xl border p-5 md:p-6">
      <div className="flex items-start gap-3">
        <FontAwesomeIcon
          icon={faCommentSms}
          className="text-primary mt-1 h-5 w-5 shrink-0"
          aria-hidden
        />
        <div className="space-y-2">
          <p className="text-primary eyebrow">{copy.eyebrow}</p>
          <p className="font-serif text-xl leading-tight">
            {copy.headline}{' '}
            <span className="text-primary font-mono tabular-nums">
              {phoneDisplay}
            </span>
          </p>
          <p className="text-base-content/70 text-sm">{copy.body}</p>
          <a href={smsHref} className="btn btn-primary btn-sm mt-2">
            {copy.buttonText}
          </a>
        </div>
      </div>
    </div>
  );
}
