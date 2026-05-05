import Link from 'next/link';
import type { Route } from 'next';

export type PipelineApplicant = {
    id: string;
    firstName: string;
    lastInitial: string;
    appliedAt: string;
    jobTitle?: string;
    href?: string;
    status?: 'applied' | 'reviewed' | 'hired' | 'rejected';
    matchLabel?: string;
};

export type PipelineLane = {
    key: string;
    label: string;
    items: PipelineApplicant[];
    emptyCopy: string;
    swatch?: string;
};

type Props = {
    lanes: PipelineLane[];
    moreLabel?: string;
    onSelect?: (id: string) => void;
};

export function HiringPipelineBoard({ lanes, moreLabel, onSelect }: Props) {
    const cols = lanes.length;
    const colsClass =
        cols >= 4
            ? 'md:grid-cols-2 lg:grid-cols-4'
            : cols === 3
                ? 'md:grid-cols-3'
                : 'md:grid-cols-2';

    return (
        <div className={['grid grid-cols-1 gap-4', colsClass].join(' ')}>
            {lanes.map((lane) => (
                <section
                    key={lane.key}
                    className="card card-bordered card-compact bg-base-100"
                >
                    <div className="border-base-300 flex items-center justify-between border-b px-3 py-2.5">
                        <div className="flex items-center gap-2">
                            {lane.swatch && (
                                <span className={['h-2 w-2 rounded-sm', lane.swatch].join(' ')} />
                            )}
                            <span className="text-base-content/70 font-mono text-[11px] font-bold uppercase tracking-wider">
                                {lane.label}
                            </span>
                        </div>
                        <div className="badge badge-neutral badge-sm font-mono">
                            {lane.items.length}
                        </div>
                    </div>
                    <div className="card-body gap-2">
                        {lane.items.length === 0 && (
                            <div className="text-base-content/50 px-1 py-2 text-center text-[11px]">
                                {lane.emptyCopy}
                            </div>
                        )}
                        {lane.items.slice(0, 3).map((a) => (
                            <PipelineCard
                                key={a.id}
                                applicant={a}
                                onSelect={onSelect}
                            />
                        ))}
                        {lane.items.length > 3 && (
                            <div className="text-base-content/60 px-1 py-1 text-center font-mono text-[11px]">
                                + {lane.items.length - 3} {moreLabel ?? 'more'}
                            </div>
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
}

function PipelineCard({
    applicant,
    onSelect,
}: {
    applicant: PipelineApplicant;
    onSelect?: (id: string) => void;
}) {
    const inner = (
        <div className="bg-base-200 border-base-300 hover:border-primary/40 rounded-lg border p-2.5 transition-colors">
            <div className="flex items-center gap-2">
                <div
                    className={[
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold',
                        applicant.status === 'hired'
                            ? 'bg-primary text-primary-content'
                            : 'bg-base-content text-base-100',
                    ].join(' ')}
                >
                    {(applicant.firstName[0] ?? '').toUpperCase()}
                    {applicant.lastInitial.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold">
                        {applicant.firstName} {applicant.lastInitial}.
                    </div>
                    {applicant.jobTitle && (
                        <div className="text-base-content/60 truncate text-[11px]">
                            {applicant.jobTitle}
                        </div>
                    )}
                </div>
            </div>
            {applicant.matchLabel && (
                <div className="text-primary mt-2 font-mono text-[10px] font-bold">
                    {applicant.matchLabel}
                </div>
            )}
        </div>
    );

    if (applicant.href) {
        return (
            <Link href={applicant.href as Route} className="block">
                {inner}
            </Link>
        );
    }
    if (onSelect) {
        return (
            <button
                type="button"
                onClick={() => onSelect(applicant.id)}
                className="block w-full text-left"
            >
                {inner}
            </button>
        );
    }
    return inner;
}
