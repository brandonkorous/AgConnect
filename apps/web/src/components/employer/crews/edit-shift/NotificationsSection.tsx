'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPhone,
  faComments,
  faClipboardCheck,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { CheckboxCard } from '@/components/employer/primitives';
import { SectionCard } from './SectionCard';
import type { ShiftDraft } from './types';

const CHANNELS: Array<{
  key: 'smsEveningBefore' | 'whatsappMorning' | 'foremanRollCall';
  icon: IconDefinition;
}> = [
  { key: 'smsEveningBefore', icon: faPhone },
  { key: 'whatsappMorning', icon: faComments },
  { key: 'foremanRollCall', icon: faClipboardCheck },
];

type Props = {
  draft: ShiftDraft;
  onChange: (patch: Partial<ShiftDraft>) => void;
};

export function NotificationsSection({ draft, onChange }: Props) {
  const t = useTranslations('employer.crews.edit_shift.notify');
  const md = draft.metadata;
  const notifs = md.notifications ?? {};

  function setNotif(key: (typeof CHANNELS)[number]['key'], on: boolean) {
    onChange({
      metadata: { ...md, notifications: { ...notifs, [key]: on } },
    });
  }

  return (
    <SectionCard id="notify" title={t('title')} sub={t('sub')}>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {CHANNELS.map((ch) => (
          <CheckboxCard
            key={ch.key}
            variant="toggle"
            icon={ch.icon}
            checked={Boolean(notifs[ch.key])}
            onChange={(v) => setNotif(ch.key, v)}
            title={t(`channel.${ch.key}.title`)}
            description={t(`channel.${ch.key}.help`)}
          />
        ))}
      </div>

      <div className="bg-base-200/40 border-base-300 mt-3.5 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs">
        <FontAwesomeIcon icon={faGlobe} className="text-primary h-3 w-3" />
        <span className="text-base-content/80">{t('translate_help')}</span>
      </div>
    </SectionCard>
  );
}
