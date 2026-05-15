'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useDraggable } from '@dnd-kit/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import type { KanbanCardData } from './ApplicantKanban';

type Props = {
  card: KanbanCardData;
  laneKey: string;
  dragDisabled: boolean;
  onTap?: () => void;
};

export function KanbanCard({ card, laneKey, dragDisabled, onTap }: Props) {
  const { attributes, listeners, setNodeRef, isDragging, setActivatorNodeRef } =
    useDraggable({
      id: card.id,
      disabled: dragDisabled,
      data: { card, fromLane: laneKey },
    });

  return (
    <div
      ref={setNodeRef}
      className={[
        'bg-base-200 border-base-300 hover:border-primary/40 rounded-lg border p-2.5 transition-colors',
        isDragging ? 'opacity-40' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2">
        <div
          className={[
            'grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold',
            card.status === 'hired'
              ? 'bg-primary text-primary-content'
              : 'bg-base-content text-base-100',
          ].join(' ')}
        >
          {(card.firstName[0] ?? '').toUpperCase()}
          {card.lastInitial.toUpperCase()}
        </div>
        <Link
          href={card.href as Route}
          className="min-w-0 flex-1"
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return;
            }
            if (onTap && typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
              e.preventDefault();
              onTap();
            }
          }}
        >
          <div className="truncate text-xs font-semibold">
            {card.firstName} {card.lastInitial}.
          </div>
          {card.jobTitle && (
            <div className="text-base-content/60 truncate text-xs">{card.jobTitle}</div>
          )}
        </Link>
        {!dragDisabled && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label="Drag"
            className="text-base-content/40 hover:text-base-content/70 cursor-grab touch-none p-1 active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <FontAwesomeIcon icon={faGripVertical} className="h-3 w-3" />
          </button>
        )}
      </div>
      {card.matchLabel && (
        <div className="text-primary mt-2 font-mono text-[10px] font-bold">
          {card.matchLabel}
        </div>
      )}
    </div>
  );
}
