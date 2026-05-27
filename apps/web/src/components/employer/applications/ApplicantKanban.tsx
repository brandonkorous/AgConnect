'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
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
  const queryClient = useQueryClient();

  const [state, setState] = useState<LaneState>(() => {
    const out: LaneState = { applied: [], reviewed: [], hired: [], rejected: [] };
    for (const lane of lanes) out[lane.key] = lane.cards;
    return out;
  });
  const [showRejected, setShowRejected] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<KanbanLaneKey | null>(null);
  const [pending, setPending] = useState<PendingModal>(null);
  const [sheet, setSheet] = useState<{ card: KanbanCardData; fromLane: KanbanLaneKey } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findCard(id: string): { card: KanbanCardData; lane: KanbanLaneKey } | null {
    for (const lane of ['applied', 'reviewed', 'hired', 'rejected'] as KanbanLaneKey[]) {
      const card = state[lane].find((c) => c.id === id);
      if (card) return { card, lane };
    }
    return null;
  }

  function moveCard(
    cardId: string,
    from: KanbanLaneKey,
    to: KanbanLaneKey,
    newStatus: KanbanLaneKey,
  ) {
    setState((prev) => {
      const moved = prev[from].find((c) => c.id === cardId);
      if (!moved) return prev;
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.id !== cardId),
        [to]: [{ ...moved, status: newStatus }, ...prev[to]],
      };
    });
  }

  async function silentTransitionToReviewed(card: KanbanCardData, from: KanbanLaneKey) {
    moveCard(card.id, from, 'reviewed', 'reviewed');
    const res = await transitionApplication(locale, card.id, { toStatus: 'reviewed' });
    if (!res.ok) {
      moveCard(card.id, 'reviewed', from, from);
      setToast(res.message || t('transition_failed'));
    } else {
      void queryClient.invalidateQueries({ queryKey: ['employer'] });
    }
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    setDraggingFrom((e.active.data.current?.laneKey as KanbanLaneKey) ?? null);
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    setDraggingFrom(null);
    const { active, over } = e;
    if (!over) return;
    const fromLane = active.data.current?.laneKey as KanbanLaneKey | undefined;
    const toLane = over.data.current?.laneKey as KanbanLaneKey | undefined;
    if (!fromLane || !toLane) return;
    if (!isValidTransition(fromLane, toLane)) return;
    const found = findCard(String(active.id));
    if (!found) return;
    const card = found.card;
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
    void queryClient.invalidateQueries({ queryKey: ['employer'] });
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

  const dragInProgress = activeId !== null;
  const activeCard = activeId ? findCard(activeId)?.card : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
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

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="bg-base-100 border-primary rotate-2 cursor-grabbing rounded-lg border-2 p-2.5 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="bg-base-content text-base-100 grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold">
                  {(activeCard.firstName[0] ?? '').toUpperCase()}
                  {activeCard.lastInitial.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">
                    {activeCard.firstName} {activeCard.lastInitial}.
                  </div>
                  {activeCard.jobTitle && (
                    <div className="text-base-content/60 truncate text-xs">
                      {activeCard.jobTitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowRejected((v) => !v)}
          aria-pressed={showRejected}
          className="btn btn-ghost btn-sm border-base-300 text-base-content/80 border"
        >
          <FontAwesomeIcon
            icon={showRejected ? faEyeSlash : faEye}
            aria-hidden
            className="mr-2 h-3.5 w-3.5"
          />
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
