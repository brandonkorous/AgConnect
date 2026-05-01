import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const SAVED = [
  { name: 'Grape harvest · Madera', hits: 12 },
  { name: 'Pays >$22 · Within 25 mi', hits: 28 },
  { name: 'Has housing · Statewide', hits: 47 },
];

export function BrowseJobsAside() {
  const t = useTranslations('worker.jobs.browse.aside');
  return (
    <div className="grid content-start gap-3.5">
      {/* SMS apply card — dark with gold accent */}
      <div className="bg-base-content text-base-100 relative overflow-hidden rounded-2xl p-[18px]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 100% at 100% 0%, rgba(217,180,65,0.22), transparent 60%)',
          }}
        />
        <div className="relative">
          <div className="text-accent font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
            {t('sms.eyebrow')}
          </div>
          <div className="font-serif mt-1.5 text-[22px] leading-[1.2] tracking-[-0.02em]">
            {t.rich('sms.body', {
              text: (chunks) => (
                <strong className="text-accent">{chunks}</strong>
              ),
              num: (chunks) => (
                <strong className="font-mono">{chunks}</strong>
              ),
            })}
          </div>
          <div className="mt-2 text-[12.5px] opacity-80">{t('sms.note')}</div>
        </div>
      </div>

      {/* Map preview card */}
      <div className="border-base-300 rounded-2xl border bg-white p-[18px]">
        <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
          {t('map.eyebrow')}
        </div>
        <div
          className="border-base-300 relative mt-3 h-[220px] overflow-hidden rounded-[10px] border"
          style={{
            background: 'linear-gradient(135deg, #f0ead8, #e5dec5)',
          }}
        >
          <svg
            viewBox="0 0 300 220"
            className="absolute inset-0"
            preserveAspectRatio="none"
          >
            <path
              d="M0 100 Q 80 70, 150 90 T 300 80"
              stroke="var(--color-primary)"
              strokeWidth="1"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M0 140 Q 80 110, 150 130 T 300 120"
              stroke="var(--color-primary)"
              strokeWidth="1"
              fill="none"
              opacity="0.2"
            />
            <path
              d="M30 0 L 30 220 M 110 0 L 110 220 M 200 0 L 200 220"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="0.5"
            />
          </svg>
          {[
            { x: 32, y: 38, n: 4, big: false },
            { x: 60, y: 70, n: 12, big: false },
            { x: 48, y: 130, n: 7, big: false },
            { x: 78, y: 165, n: 3, big: false },
            { x: 56, y: 100, n: 24, big: true },
          ].map((p, i) => (
            <div
              key={i}
              className={[
                'absolute -translate-x-1/2 -translate-y-1/2 rounded-full font-mono font-bold shadow-md',
                p.big
                  ? 'bg-base-content text-accent px-2.5 py-1.5 text-[13px]'
                  : 'bg-primary px-2 py-1 text-[11px] text-white',
              ].join(' ')}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.n}
            </div>
          ))}
          <div className="text-base-content/60 absolute bottom-2.5 left-2.5 font-mono text-[10.5px]">
            {t('map.label')}
          </div>
        </div>
        <button
          type="button"
          className="border-base-300 mt-3 w-full rounded-full border bg-transparent py-2.5 text-[12.5px] font-semibold"
        >
          {t('map.cta')}
        </button>
      </div>

      {/* Saved searches card */}
      <div className="border-base-300 rounded-2xl border bg-white p-[18px]">
        <div className="text-base-content/60 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em]">
          {t('saved.eyebrow')}
        </div>
        <div className="mt-2">
          {SAVED.map((s, i) => (
            <div
              key={i}
              className={[
                'flex items-center justify-between py-2.5',
                i < SAVED.length - 1 ? 'border-base-300 border-b' : '',
              ].join(' ')}
            >
              <div>
                <div className="text-[13px] font-semibold">{s.name}</div>
                <div className="text-base-content/60 font-mono text-[11px]">
                  {t('saved.hits', { hits: s.hits })}
                </div>
              </div>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-base-content/50 h-3.5 w-3.5"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
