import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { type DocGroup, type DocStatus } from './documentsMockData';

const STATUS_TONE: Record<DocStatus, 'success' | 'primary' | 'warning' | 'danger'> = {
  Verified: 'success',
  Current: 'primary',
  'Expiring soon': 'warning',
  Missing: 'danger',
};

const STATUS_KEY: Record<DocStatus, string> = {
  Verified: 'verified',
  Current: 'current',
  'Expiring soon': 'expiring',
  Missing: 'missing',
};

type Props = { group: DocGroup };

export function DocumentGroup({ group }: Props) {
  const t = useTranslations('worker.documents.group');
  const tStatus = useTranslations('worker.documents.status');
  const tActions = useTranslations('worker.documents.actions');
  return (
    <div className="mb-5">
      <SectionHeading sub={t('on_file', { n: group.items.length })}>
        {t(`title.${group.key}`)}
      </SectionHeading>
      <div className="grid gap-3.5 lg:grid-cols-3">
        {group.items.map((it) => (
          <div
            key={it.name}
            className="border-base-300 bg-base-100 rounded-2xl border p-[18px]"
          >
            <div className="flex items-start gap-3">
              <div className="bg-base-200 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl">
                <FontAwesomeIcon icon={it.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{it.name}</div>
                <div className="text-base-content/60 mt-1 text-[11.5px]">
                  {it.meta}
                </div>
              </div>
            </div>
            <div className="border-base-300 mt-3.5 flex items-center justify-between border-t pt-3.5">
              <Pill tone={STATUS_TONE[it.status]}>{tStatus(STATUS_KEY[it.status])}</Pill>
              <div className="text-base-content/70 flex gap-3 text-[12px]">
                <a href="#" className="text-base-content/80 no-underline">
                  {tActions('view')}
                </a>
                <a href="#" className="text-base-content/80 no-underline">
                  {tActions('share')}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
