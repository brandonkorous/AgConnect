'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faMobileScreen,
  faGlobe,
  faPhone,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { SectionCard } from './SectionCard';
import { COMMS_KEYS, type CommsKey, type CrewDraft } from './types';

type Props = {
  draft: CrewDraft;
  onChange: (patch: Partial<CrewDraft>) => void;
};

const ICONS: Record<CommsKey, IconDefinition> = {
  groupChat: faComments,
  smsDigest: faMobileScreen,
  whatsappForeman: faGlobe,
  voiceBroadcast: faPhone,
};

export function CommsSection({ draft, onChange }: Props) {
  const t = useTranslations('employer.crews.edit_crew.comms');

  function toggle(k: CommsKey) {
    const next = { ...draft.commsChannels, [k]: !draft.commsChannels[k] };
    onChange({ commsChannels: next });
  }

  return (
    <SectionCard id="comms" title={t('title')} sub={t('sub')}>
      <div className="grid gap-2.5 md:grid-cols-2">
        {COMMS_KEYS.map((k) => {
          const on = !!draft.commsChannels[k];
          return (
            <label
              key={k}
              className={[
                'cursor-pointer rounded-2xl p-3.5 transition',
                on
                  ? 'border-primary bg-primary/10 border-2'
                  : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40 border bg-base-100',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon
                  icon={ICONS[k]}
                  className={['h-4 w-4', on ? 'text-primary' : 'text-base-content/50'].join(' ')}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">{t(`name.${k}`)}</div>
                  <div className="text-base-content/60 mt-0.5 text-[11px]">{t(`help.${k}`)}</div>
                </div>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(k)}
                  className="toggle toggle-primary toggle-sm"
                />
              </div>
            </label>
          );
        })}
      </div>
    </SectionCard>
  );
}
