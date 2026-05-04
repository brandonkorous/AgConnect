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
      <div className="grid gap-2.5 md:grid-cols-3">
        {CHANNELS.map((ch) => {
          const on = Boolean(notifs[ch.key]);
          return (
            <button
              key={ch.key}
              type="button"
              aria-pressed={on}
              onClick={() => setNotif(ch.key, !on)}
              className={[
                'cursor-pointer rounded-2xl p-3.5 text-left transition',
                on
                  ? 'bg-primary/10 border-primary border'
                  : 'bg-base-100 border-base-300 hover:border-base-content/30 border',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <FontAwesomeIcon
                  icon={ch.icon}
                  className={['h-3.5 w-3.5', on ? 'text-primary' : 'text-base-content/40'].join(' ')}
                />
                <span
                  className={[
                    'relative h-4 w-7 rounded-full transition',
                    on ? 'bg-primary' : 'bg-base-300',
                  ].join(' ')}
                  aria-hidden
                >
                  <span
                    className={[
                      'absolute top-0.5 h-3 w-3 rounded-full bg-white transition',
                      on ? 'left-3.5' : 'left-0.5',
                    ].join(' ')}
                  />
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold">{t(`channel.${ch.key}.title`)}</div>
              <div className="text-base-content/60 mt-0.5 text-[11px]">{t(`channel.${ch.key}.help`)}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-base-200/40 border-base-300 mt-3.5 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs">
        <FontAwesomeIcon icon={faGlobe} className="text-primary h-3 w-3" />
        <span className="text-base-content/80">{t('translate_help')}</span>
      </div>
    </SectionCard>
  );
}
