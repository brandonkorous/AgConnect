'use client';

import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import type { KanbanCardData, KanbanLaneKey } from './ApplicantKanban';

type Props = {
  laneKey: KanbanLaneKey;
  label: string;
  emptyCopy: string;
  cards: KanbanCardData[];
  swatch?: string;
  validTarget: boolean;
  dragInProgress: boolean;
  cardsDragDisabled: boolean;
  onCardTap: (card: KanbanCardData) => void;
};

export function KanbanLane({
  laneKey,
  label,
  emptyCopy,
  cards,
  swatch,
  validTarget,
  dragInProgress,
  cardsDragDisabled,
  onCardTap,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: laneKey,
    data: { lane: laneKey },
    disabled: !validTarget,
  });

  const highlight = dragInProgress
    ? validTarget
      ? isOver
        ? 'border-primary bg-primary/5'
        : 'border-base-300 border-dashed'
      : 'border-base-300 opacity-50'
    : 'border-base-300';

  return (
    <section
      ref={setNodeRef}
      className={['card card-bordered card-compact bg-base-100 transition-colors', highlight].join(' ')}
    >
      <div className="border-base-300 flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          {swatch && <span className={['h-2 w-2 rounded-sm', swatch].join(' ')} />}
          <span className="text-base-content/70 font-mono text-xs font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="badge badge-neutral badge-sm font-mono">{cards.length}</div>
      </div>
      <div className="card-body gap-2 min-h-24">
        {cards.length === 0 && (
          <div className="text-base-content/50 px-1 py-2 text-center text-xs">
            {emptyCopy}
          </div>
        )}
        {cards.map((c) => (
          <KanbanCard
            key={c.id}
            card={c}
            laneKey={laneKey}
            dragDisabled={cardsDragDisabled}
            onTap={() => onCardTap(c)}
          />
        ))}
      </div>
    </section>
  );
}
