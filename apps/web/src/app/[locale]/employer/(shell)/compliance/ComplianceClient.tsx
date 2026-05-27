'use client';

import { Suspense } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheck, faMinus, faBell } from '@fortawesome/free-solid-svg-icons';
import {
  useComplianceCategoriesSuspense,
  useComplianceActionsSuspense,
  useComplianceSummarySuspense,
  type ComplianceActionView,
} from '@/lib/api/hooks/employer-ops';
import {
  NewComplianceItemButton,
  EditComplianceItemButton,
  ComplianceActionCta,
} from '@/components/employer/compliance/ComplianceItemActions';
import { ExportComplianceCsvButton } from '@/components/employer/compliance/ExportComplianceCsvButton';
import {
  ComplianceActionRow,
  ScoreDonut,
  StatusBadge,
} from '@/components/employer/primitives';
import { SkeletonCard } from '@/components/ui/skeleton';

function ComplianceInner() {
  const locale = useLocale();
  const t = useTranslations('employer.compliance');
  const { data: cats } = useComplianceCategoriesSuspense();
  const { data: actions } = useComplianceActionsSuspense();
  const { data: summary } = useComplianceSummarySuspense();

  const overall = summary?.overall
    ?? Math.round(cats.reduce((sum, c) => sum + c.score, 0) / Math.max(1, cats.length));
  const totalItems = cats.reduce((n, c) => n + c.items.length, 0);
  const okItems = cats.reduce(
    (n, c) => n + c.items.filter((it) => it.status === 'ok').length,
    0,
  );
  const openItems = totalItems - okItems;
  const actionItemIds = new Set(actions.map((a) => a.id).filter((x): x is string => x != null));

  const subtitle = (() => {
    if (summary?.delta != null && summary.priorScore != null) {
      const sign = summary.delta > 0 ? '+' : '';
      return t('overall_delta_real', {
        sign,
        delta: summary.delta,
        prior: summary.priorScore,
      });
    }
    return t('overall_delta');
  })();

  const inspectionLine = summary?.dolLastInspectionAt
    ? t('dol_inspection_last', {
      date: new Date(summary.dolLastInspectionAt).toLocaleDateString(
        locale === 'es' ? 'es-MX' : 'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      ),
      result: t(`dol_result.${summary.dolLastInspectionResult ?? 'pending'}`),
    })
    : t('dol_inspection_none');

  return (
    <div className=" px-5 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-base-content/60 text-xs font-semibold uppercase tracking-[0.18em]">
            {t('title')}
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold leading-tight tracking-tight tabular-nums slashed-zero md:text-5xl">
            {overall >= 100 && actions.length === 0 && openItems === 0
              ? t('headline_status_ok')
              : t('headline_status_attention')}
          </h1>
          <div className="text-base-content/70 mt-2 text-sm">
            {overall < 100 && actions.length === 0 && openItems > 0
              ? t('summary_open', { open: openItems })
              : t('summary', { actions: actions.length })}
          </div>
        </div>
        <div className="flex gap-2">
          <NewComplianceItemButton />
          <ExportComplianceCsvButton />
          <a
            href={`/${locale}/employer/compliance/audit`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary rounded-full"
          >
            <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
            {t('audit_pdf')}
          </a>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <div className="card card-bordered card-compact bg-base-100">
          <div className="card-body items-center text-center">
            <ScoreDonut percent={overall} size="lg" label={t('overall_label')} />
            <div className="text-base-content/70 mt-3 text-xs">{subtitle}</div>
            <div className="text-base-content/55 mt-1 text-xs">{inspectionLine}</div>
          </div>
        </div>

        <div className="card card-bordered card-compact bg-base-100">
          <div className="card-body">
            <div className="mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faBell} className="text-warning h-4 w-4" />
              <h2 className="font-display text-xl font-semibold tracking-tight tabular-nums slashed-zero">
                {actions.length === 0 && overall < 100 && openItems > 0
                  ? t('actions_title_pending', { open: openItems })
                  : t('actions_title', { count: actions.length })}
              </h2>
            </div>
            <div className="grid gap-3">
              {actions.map((a, i) => {
                const dueSoon = (() => {
                  if (!a.dueAt) return false;
                  const due = new Date(a.dueAt).getTime();
                  const endOfToday = new Date();
                  endOfToday.setHours(23, 59, 59, 999);
                  return due <= endOfToday.getTime();
                })();
                const ctaLabel =
                  a.severity === 'urgent' || dueSoon
                    ? t('action_cta.cta_resolve')
                    : t(`severity_cta.${a.severity}`);
                const severityLabel = t(`severity.${a.severity}`);
                return (
                  <ComplianceActionRow
                    key={i}
                    severity={a.severity}
                    title={a.title}
                    body={a.detail}
                    severityLabel={severityLabel}
                    ctaSlot={
                      <ComplianceActionCta
                        action={{ ...a, cta: ctaLabel } as ComplianceActionView}
                      />
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cats.map((c) => (
          <div key={c.key} className="card card-bordered card-compact bg-base-100">
            <div className="card-body">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{t(`category.${c.key}`)}</h2>
                <div className="flex items-center gap-2">
                  <progress
                    className={[
                      'progress w-[60px]',
                      c.score >= 95 ? 'progress-success' : c.score >= 85 ? 'progress-warning' : 'progress-error',
                    ].join(' ')}
                    value={c.score}
                    max={100}
                  />
                  <span
                    className={[
                      'text-xs font-bold tabular-nums slashed-zero',
                      c.score >= 95 ? 'text-success' : c.score >= 85 ? 'text-warning' : 'text-error',
                    ].join(' ')}
                  >
                    {c.score}%
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                {c.items.map((it) => {
                  const badgeStatus = it.status === 'ok' ? 'ok' : it.status === 'warn' ? 'warn' : 'urgent';
                  const badgeLabel =
                    it.status === 'ok'
                      ? t('item_status.ok')
                      : it.status === 'warn'
                        ? t('item_status.warn')
                        : t('item_status.fail');
                  const icon = it.status === 'ok' ? faCheck : it.status === 'warn' ? faBell : faMinus;
                  const isPinned = it.id != null && actionItemIds.has(it.id);
                  return (
                    <div
                      key={it.key}
                      id={`item-${it.key}`}
                      className={[
                        'flex items-center gap-3 scroll-mt-24 rounded-2xl px-3 py-2 target:ring-2 target:ring-primary target:ring-offset-2',
                        isPinned ? 'bg-base-200/40 opacity-70' : 'bg-base-200',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'grid h-5 w-5 shrink-0 place-items-center rounded-full',
                          it.status === 'ok'
                            ? 'bg-success text-success-content'
                            : it.status === 'warn'
                              ? 'bg-warning text-warning-content'
                              : 'bg-error text-error-content',
                        ].join(' ')}
                      >
                        <FontAwesomeIcon icon={icon} className="h-2.5 w-2.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium">{it.label}</div>
                          <StatusBadge status={badgeStatus} label={badgeLabel} />
                          {isPinned && (
                            <span className="badge badge-ghost badge-xs font-mono uppercase tracking-wider">
                              {t('item_pinned_in_actions')}
                            </span>
                          )}
                        </div>
                        <div className="text-base-content/60 text-xs">{it.details}</div>
                      </div>
                      {it.id && (
                        <EditComplianceItemButton
                          itemId={it.id}
                          status={it.status}
                          details={it.details}
                          evidenceUrl={it.evidenceUrl ?? null}
                          evidence={it.evidence ?? null}
                          instructions={it.instructions ?? null}
                          dueAt={it.dueAt}
                          label={it.label}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComplianceClient() {
  return (
    <Suspense fallback={<SkeletonCard rows={6} />}>
      <ComplianceInner />
    </Suspense>
  );
}
