'use client';

import { useTranslations } from 'next-intl';
import {
  faComments,
  faMobileScreen,
  faPhone,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { CheckboxCard } from '@/components/employer/primitives';
import { SectionCard } from './SectionCard';
import { COMMS_KEYS, type CommsKey, type CrewDraft } from './types';

type Props = {
  draft: CrewDraft;
  onChange: (patch: Partial<CrewDraft>) => void;
};

const ICONS: Record<CommsKey, IconDefinition> = {
  groupChat: faComments,
  smsDigest: faMobileScreen,
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
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {COMMS_KEYS.map((k) => (
          <CheckboxCard
            key={k}
            variant="toggle"
            icon={ICONS[k]}
            checked={Boolean(draft.commsChannels[k])}
            onChange={() => toggle(k)}
            title={t(`name.${k}`)}
            description={t(`help.${k}`)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
