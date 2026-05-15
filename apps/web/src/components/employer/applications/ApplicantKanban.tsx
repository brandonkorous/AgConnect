'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { KanbanLane } from './KanbanLane';
import { HireModal } from './HireModal';
import { RejectModal } from './RejectModal';
import { ApplicantActionSheet } from './ApplicantActionSheet';
import { transitionApplication } from './transitionApplication';

export type KanbanLaneKey = 'applied' | 'reviewed' | 'hired' | 'rejected';

export type KanbanCardData = {
  id: string;
  firstName: string;
  lastInitial: string;
  appliedAt: string;
  jobTitle?: string;
  href: string;
  status: KanbanLaneKey;
  matchLabel?: string;
};

export type KanbanLaneInput = {
  key: KanbanLaneKey;
  label: string;
  emptyCopy: string;
  cards: KanbanCardData[];
  swatch?: string;
};

type Props = {
  locale: string;
  lanes: KanbanLaneInput[];
  jobTitle: string;
};

type LaneState = Record<KanbanLaneKey, KanbanCardData[]>;

type PendingModal =
  | { kind: 'hire'; card: KanbanCardData; fromLane: KanbanLaneKey }
  | { kind: 'reject'; card: KanbanCardData; fromLane: KanbanLaneKey }
  | null;

function isValidTransition(from: KanbanLaneKey, to: KanbanLaneKey): boolean {
  if (from === to) return false;
  if (from === 'hired' || from === 'rejected') return false;
  if (to === 'applied') return false;
  if (to === 'reviewed') return from === 'applied';
  return true; // hired or rejected from applied/reviewed
}

export function ApplicantKanban({ locale, lanes, jobTitle }: Props) {
  const t = useTranslations('employer.kanban');
  const router = useRouter();

  const [state, setState] = useState<LaneState>(() => {
    const out: LaneState = { applied: [], reviewed: [], hired: [], rejected: [] };
    for (const lane of lanes) out[lane.key] = lane.cards;
    return out;
  });
  const [showRejected, setShowRejected] = useState(false);
  const [activeDrag, setActiveDrag] = useState<{ id: string; from: KanbanLaneKey } | null>(null);
  const [pending, setPending] = useState<PendingModal>(null);
  const [sheet, setSheet] = useState<{ card: KanbanCardData; fromLane: KanbanLaneKey } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function moveCard(cardId: string, from: KanbanLaneKey, to: KanbanLaneKey, newStatus: KanbanLaneKey) {
    setState((prev) => {
      const fromCards = prev[from].filter((c) => c.id !== cardId);
      const moved = prev[from].find((c) => c.id === cardId);
      if (!moved) return prev;
      const next: LaneState = {
        ...prev,
        [from]: fromCards,
        [to]: [{ ...moved, status: newStatus }, ...prev[to]],
      };
      return next;
    });
  }

  async function silentTransitionToReviewed(card: KanbanCardData, from: KanbanLaneKey) {
    moveCard(card.id, from, 'reviewed', 'reviewed');
    const res = await transitionApplication(locale, card.id, { toStatus: 'reviewed' });
    if (!res.ok) {
      moveCard(card.id, 'reviewed', from, from);
      setToast(res.message || t('transition_failed'));
    } else {
      router.refresh();
    }
  }

  function onDragStart(e: DragStartEvent) {
    const data = e.active.data.current;
    if (!data) return;
    setActiveDrag({ id: String(e.active.id), from: data.fromLane as KanbanLaneKey });
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = e;
    if (!over) return;
    const data = active.data.current;
    if (!data) return;
    const fromLane = data.fromLane as KanbanLaneKey;
    const toLane = over.id as KanbanLaneKey;
    if (!isValidTransition(fromLane, toLane)) return;
    const card = data.card as KanbanCardData;
    if (toLane === 'reviewed') {
      void silentTransitionToReviewed(card, fromLane);
    } else if (toLane === 'hired') {
      setPending({ kind: 'hire', card, fromLane });
    } else if (toLane === 'rejected') {
      setPending({ kind: 'reject', card, fromLane });
    }
  }

  function onModalSuccess() {
    if (!pending) return;
    const target: KanbanLaneKey = pending.kind === 'hire' ? 'hired' : 'rejected';
    moveCard(pending.card.id, pending.fromLane, target, target);
    setPending(null);
    router.refresh();
  }

  function onCardTap(card: KanbanCardData) {
    setSheet({ card, fromLane: card.status });
  }

  function onSheetMarkReviewed() {
    if (!sheet) return;
    const { card, fromLane } = sheet;
    setSheet(null);
    void silentTransitionToReviewed(card, fromLane);
  }

  function onSheetHire() {
    if (!sheet) return;
    setPending({ kind: 'hire', card: sheet.card, fromLane: sheet.fromLane });
    setSheet(null);
  }

  function onSheetReject() {
    if (!sheet) return;
    setPending({ kind: 'reject', card: sheet.card, fromLane: sheet.fromLane });
    setSheet(null);
  }

  const visibleLaneKeys: KanbanLaneKey[] = showRejected
    ? ['applied', 'reviewed', 'hired', 'rejected']
    : ['applied', 'reviewed', 'hired'];

  const draggingFrom = activeDrag?.from;
  const dragInProgress = activeDrag !== null;

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div
          className={[
            'grid grid-cols-1 gap-4',
            visibleLaneKeys.length >= 4
              ? 'md:grid-cols-2 lg:grid-cols-4'
              : 'md:grid-cols-3',
          ].join(' ')}
        >
          {visibleLaneKeys.map((key) => {
            const laneCfg = lanes.find((l) => l.key === key);
            return (
              <KanbanLane
                key={key}
                laneKey={key}
                label={laneCfg?.label ?? t(key)}
                emptyCopy={laneCfg?.emptyCopy ?? t('empty_stage')}
                cards={state[key]}
                swatch={laneCfg?.swatch}
                validTarget={draggingFrom ? isValidTransition(draggingFrom, key) : true}
                dragInProgress={dragInProgress}
                cardsDragDisabled={key === 'hired' || key === 'rejected'}
                onCardTap={onCardTap}
              />
            );
          })}
        </div>
      </DndContext>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowRejected((v) => !v)}
          className="text-base-content/60 hover:text-base-content text-xs underline-offset-2 hover:underline"
        >
          {showRejected
            ? t('hide_rejected')
            : t('show_rejected', { count: state.rejected.length })}
        </button>
      </div>

      {sheet && (
        <ApplicantActionSheet
          workerName={`${sheet.card.firstName} ${sheet.card.lastInitial}.`}
          detailHref={sheet.card.href}
          currentStatus={sheet.card.status}
          onClose={() => setSheet(null)}
          onMarkReviewed={onSheetMarkReviewed}
          onHire={onSheetHire}
          onReject={onSheetReject}
        />
      )}

      {pending?.kind === 'hire' && (
        <HireModal
          locale={locale}
          applicationId={pending.card.id}
          workerName={`${pending.card.firstName} ${pending.card.lastInitial}.`}
          onClose={() => setPending(null)}
          onSuccess={onModalSuccess}
        />
      )}
      {pending?.kind === 'reject' && (
        <RejectModal
          locale={locale}
          applicationId={pending.card.id}
          workerName={`${pending.card.firstName} ${pending.card.lastInitial}.`}
          jobTitle={jobTitle}
          onClose={() => setPending(null)}
          onSuccess={onModalSuccess}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transform"
        >
          <div className="alert alert-error shadow-lg">
            <span className="text-sm">{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="btn btn-ghost btn-xs"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
