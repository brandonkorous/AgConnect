import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

export function VerificationCard() {
  const t = useTranslations('landing.verification.card');

  return (
    <div className="border-ink/10 bg-bone relative w-full max-w-[560px] border p-8 shadow-[0_24px_48px_rgba(31,27,20,0.06)]">
      <div className="bg-moss absolute -top-3 left-8 flex items-center gap-1.5 px-3 py-1.5">
        <FontAwesomeIcon icon={faCircleCheck} className="text-honey h-3.5 w-3.5" />
        <span className="text-bone font-sans text-[10px] font-semibold tracking-[0.12em] uppercase">
          {t('verified_badge')}
        </span>
      </div>

      <div className="flex items-start gap-5 pt-3">
        <div className="bg-moss text-bone flex h-16 w-16 shrink-0 items-center justify-center font-serif text-3xl font-semibold italic">
          D
        </div>
        <div className="flex flex-col">
          <h3 className="text-ink font-serif text-2xl font-medium tracking-tight">{t('name')}</h3>
          <p className="text-soil mt-1 font-sans text-sm">{t('type')}</p>
          <p className="text-soil mt-3 font-mono text-[11px] tracking-[0.04em]">{t('since')}</p>
        </div>
      </div>

      <ul className="border-soil/15 mt-6 flex flex-col gap-3 border-t pt-6">
        <li className="flex items-center justify-between">
          <span className="text-soil font-sans text-[11px] font-semibold tracking-[0.18em] uppercase">
            DIR LICENSE
          </span>
          <span className="text-ink font-mono text-sm">FLC-***-2186</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-soil font-sans text-[11px] font-semibold tracking-[0.18em] uppercase">
            STATUS
          </span>
          <span className="text-moss font-sans text-sm font-semibold">ACTIVE</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-soil font-sans text-[11px] font-semibold tracking-[0.18em] uppercase">
            COUNTY
          </span>
          <span className="text-ink font-sans text-sm">Madera</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-soil font-sans text-[11px] font-semibold tracking-[0.18em] uppercase">
            POSTINGS · YTD
          </span>
          <span className="text-ink font-mono text-sm">14</span>
        </li>
      </ul>
    </div>
  );
}
