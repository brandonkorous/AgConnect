'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faTruckField,
  faSun,
  faLeaf,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { Pill } from '@/components/worker/primitives/Pill';
import { SectionHeading } from '@/components/worker/primitives/SectionHeading';
import { useEnrollInProgramMutation } from '@/lib/api/hooks/mutations/training';
import type { ProgramCard } from '@/lib/api/hooks/training';

const ICONS: IconDefinition[] = [faShieldHalved, faTruckField, faSun, faLeaf];

type Props = { programs: ProgramCard[]; locale: string };

export function RecommendedGrid({ programs, locale }: Props) {
  const t = useTranslations('worker.training_hub.recommended');
  const tEmpty = useTranslations('worker.training_hub');
  const enrollMut = useEnrollInProgramMutation();
  const pending = enrollMut.isPending;

  if (programs.length === 0) {
    return (
      <>
        <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
        <div className="border-base-300 bg-base-100 mb-6 rounded-2xl border p-8 text-center">
          <p className="text-base-content/70 text-[14px]">
            {locale === 'es'
              ? 'No hay programas disponibles ahora.'
              : 'No programs available right now.'}
          </p>
          <Link
            href={`/${locale}/training`}
            className="btn btn-primary btn-sm mt-3 rounded-full"
          >
            {tEmpty('cta_browse')}
          </Link>
        </div>
      </>
    );
  }

  function enroll(programId: string) {
    enrollMut.mutate(programId);
  }

  return (
    <>
      <SectionHeading sub={t('sub')}>{t('title')}</SectionHeading>
      <div className="mb-6 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {programs.map((p, i) => {
          const title = locale === 'es' ? p.titleEs : p.titleEn;
          return (
            <div
              key={p.id}
              className="border-base-300 bg-base-100 rounded-2xl border p-5"
            >
              <div className="flex items-start gap-3.5">
                <div className="bg-base-200 text-primary grid h-12 w-12 shrink-0 place-items-center rounded-xl">
                  <FontAwesomeIcon icon={ICONS[i % ICONS.length] ?? faLeaf} className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/${locale}/worker/training/${p.seoSlug}`}
                      className="font-serif text-base-content text-[18px] font-normal leading-tight tracking-[-0.02em] no-underline"
                    >
                      {title}
                    </Link>
                    <Pill tone={p.funder === 'CDFA' ? 'warning' : 'primary'}>
                      {t('fund_label', { fund: p.funder })}
                    </Pill>
                  </div>
                  <div className="text-base-content/60 mt-2 flex items-center gap-3 font-mono text-[12px]">
                    <span>{p.county}</span>
                    <span>·</span>
                    <span>
                      {Math.max(0, p.capacity - p.enrolledCount)} /{p.capacity}{' '}
                      {locale === 'es' ? 'cupos' : 'spots'}
                    </span>
                  </div>
                  <div className="mt-3.5 flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => enroll(p.id)}
                      className="btn btn-primary btn-xs rounded-full px-3.5"
                    >
                      {t('enroll')}
                    </button>
                    <Link
                      href={`/${locale}/worker/training/${p.seoSlug}`}
                      className="border-base-300 rounded-full border bg-transparent px-3.5 py-1.5 text-[12px] font-semibold no-underline"
                    >
                      {t('learn_more')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
