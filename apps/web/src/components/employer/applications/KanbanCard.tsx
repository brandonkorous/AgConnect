'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanCardData, KanbanLaneKey } from './ApplicantKanban';

type Props = {
  card: KanbanCardData;
  laneKey: KanbanLaneKey;
  dragDisabled: boolean;
  onTap?: () => void;
};

export function KanbanCard({ card, laneKey, dragDisabled, onTap }: Props) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: 'card', laneKey },
      disabled: dragDisabled,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function onClick() {
    if (isDragging) return;
    if (
      onTap &&
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches
    ) {
      onTap();
      return;
    }
    router.push(card.href as Route);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`${card.firstName} ${card.lastInitial}.`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        'bg-base-200 border-base-300 hover:border-primary/40 focus-visible:border-primary rounded-lg border p-2.5 transition-colors focus-visible:outline-none',
        dragDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
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
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold">
            {card.firstName} {card.lastInitial}.
          </div>
          {card.jobTitle && (
            <div className="text-base-content/60 truncate text-xs">{card.jobTitle}</div>
          )}
        </div>
      </div>
      {card.matchLabel && (
        <div className="text-primary mt-2 font-mono text-[10px] font-bold">
          {card.matchLabel}
        </div>
      )}
    </div>
  );
}
