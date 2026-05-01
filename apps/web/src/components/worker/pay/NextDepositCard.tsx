import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

export function NextDepositCard() {
  const t = useTranslations('worker.pay.deposit');
  const rows = [
    { label: t('gross'), value: '$1,124.50' },
    { label: t('hours'), value: '49.5h' },
    { label: t('tax'), value: '−$142.34' },
    { label: t('method'), value: 'Direct ••3471' },
  ];
  return (
    <div className="bg-primary text-primary-content relative overflow-hidden rounded-2xl p-[22px]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(245,158,11,0.28), transparent 60%)',
        }}
      />
      <div className="relative">
        <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] opacity-75">
          {t('eyebrow')}
        </div>
        <div className="font-serif mt-3 text-[56px] leading-none tracking-[-0.03em]">
          $982<span className="text-[28px] opacity-60">.16</span>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-white/20 pt-3.5 text-[12.5px]">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="opacity-70">{r.label}</div>
              <div className="mt-0.5 font-mono font-bold">{r.value}</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-[13px] font-semibold"
        >
          <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
          {t('download')}
        </button>
      </div>
    </div>
  );
}
