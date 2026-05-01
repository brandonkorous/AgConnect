import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLeaf, faIdBadge, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { CropGlyph } from '@/components/jobs/CropGlyph';
import { MESSAGES } from './messagesMockData';

export function ThreadView() {
  const t = useTranslations('worker.messages.thread');
  const tQuick = useTranslations('worker.messages.quick');
  return (
    <div className="flex min-h-[640px] flex-col">
      <div className="border-base-300 flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary grid h-10 w-10 place-items-center rounded-full font-mono text-[13px] font-bold text-white">
            SV
          </div>
          <div>
            <div className="text-[14.5px] font-semibold">Sunridge Vineyards</div>
            <div className="text-base-content/60 text-[11.5px]">
              Marisol Vargas · {t('foreman')} · WhatsApp
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold"
          >
            <FontAwesomeIcon icon={faPhone} className="h-3 w-3" /> {t('call')}
          </button>
          <button
            type="button"
            className="border-base-300 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold"
          >
            <FontAwesomeIcon icon={faLeaf} className="h-3 w-3" /> {t('view_job')}
          </button>
        </div>
      </div>

      <div className="bg-base-200 border-base-300 border-b p-4">
        <div className="border-base-300 flex items-center gap-3 rounded-xl border bg-white p-3">
          <div className="bg-base-200 grid h-9 w-9 place-items-center rounded-lg">
            <CropGlyph crop="grape" size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{t('pinned.title')}</div>
            <div className="text-base-content/60 text-[11.5px]">{t('pinned.meta')}</div>
          </div>
          <Pill tone="success">{t('pinned.status')}</Pill>
        </div>
      </div>

      <div
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-5"
        style={{ background: 'oklch(95% 0.01 70 / 0.5)' }}
      >
        {MESSAGES.map((m, i) => (
          <div
            key={i}
            className={[
              'flex',
              m.from === 'me' ? 'justify-end' : 'justify-start',
            ].join(' ')}
          >
            <div className="max-w-[78%]">
              <div
                className={[
                  'px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                  m.from === 'me'
                    ? 'bg-primary text-primary-content rounded-[14px_14px_4px_14px] shadow-md'
                    : 'border-base-300 bg-base-100 text-base-content rounded-[14px_14px_14px_4px] border shadow-sm',
                ].join(' ')}
              >
                {m.body}
              </div>
              <div
                className={[
                  'text-base-content/60 mt-1 font-mono text-[10.5px]',
                  m.from === 'me' ? 'text-right' : 'text-left',
                ].join(' ')}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-base-300 border-t p-4">
        <div className="border-base-300 flex items-center gap-2.5 rounded-full border bg-white py-1 pl-3.5 pr-1">
          <input
            placeholder={t('reply_placeholder')}
            className="text-base-content flex-1 bg-transparent text-[13.5px] outline-none"
          />
          <button
            type="button"
            aria-label={t('attach')}
            className="text-base-content/60 p-1.5"
          >
            <FontAwesomeIcon icon={faIdBadge} className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="bg-primary text-primary-content inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold"
          >
            {t('send')}
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {(['got_it', 'on_my_way', 'address', 'question'] as const).map((q) => (
            <button
              key={q}
              type="button"
              className="border-base-300 text-base-content/80 rounded-full border bg-white px-3 py-1.5 text-[11.5px] font-medium"
            >
              {tQuick(q)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
