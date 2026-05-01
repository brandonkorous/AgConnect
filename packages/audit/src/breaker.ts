import type { AuditEventRow } from './types';

export type BreakerState = 'closed' | 'open' | 'half_open';

export type BreakerConfig = {
  failureThreshold: number;
  failureWindowMs: number;
  openDurationMs: number;
  queueMax: number;
};

export const defaultBreakerConfig: BreakerConfig = {
  failureThreshold: 5,
  failureWindowMs: 30_000,
  openDurationMs: 60_000,
  queueMax: 1_000,
};

export type BreakerEvent =
  | { kind: 'transition'; from: BreakerState; to: BreakerState }
  | { kind: 'queued'; queueLength: number }
  | { kind: 'dropped'; row: AuditEventRow }
  | { kind: 'recovered'; drainedCount: number; openedDurationMs: number; droppedCount: number };

export type BreakerHooks = {
  onEvent?: (e: BreakerEvent) => void;
};

export type WriteFn = (row: AuditEventRow) => Promise<void>;

export class AuditBreaker {
  private state: BreakerState = 'closed';
  private consecutiveFailures = 0;
  private firstFailureAt = 0;
  private openedAt = 0;
  private droppedSinceOpen = 0;
  private readonly queue: AuditEventRow[] = [];

  constructor(
    private readonly write: WriteFn,
    private readonly cfg: BreakerConfig = defaultBreakerConfig,
    private readonly hooks: BreakerHooks = {},
  ) {}

  getState(): BreakerState {
    return this.state;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async submit(row: AuditEventRow): Promise<{ enqueued: boolean }> {
    const now = Date.now();

    if (this.state === 'open') {
      if (now - this.openedAt < this.cfg.openDurationMs) {
        this.enqueue(row);
        return { enqueued: true };
      }
      this.transition('half_open');
    }

    try {
      await this.write(row);
      this.consecutiveFailures = 0;
      if (this.state === 'half_open') {
        const drained = await this.drain();
        const openedDurationMs = now - this.openedAt;
        const droppedCount = this.droppedSinceOpen;
        this.openedAt = 0;
        this.droppedSinceOpen = 0;
        this.transition('closed');
        this.hooks.onEvent?.({
          kind: 'recovered',
          drainedCount: drained,
          openedDurationMs,
          droppedCount,
        });
      }
      return { enqueued: false };
    } catch (e) {
      this.recordFailure(now);
      if (this.state === 'open') {
        this.enqueue(row);
        return { enqueued: true };
      }
      throw e;
    }
  }

  private enqueue(row: AuditEventRow): void {
    if (this.queue.length >= this.cfg.queueMax) {
      this.droppedSinceOpen += 1;
      this.hooks.onEvent?.({ kind: 'dropped', row });
      return;
    }
    this.queue.push(row);
    this.hooks.onEvent?.({ kind: 'queued', queueLength: this.queue.length });
  }

  private recordFailure(now: number): void {
    if (
      this.consecutiveFailures === 0 ||
      now - this.firstFailureAt > this.cfg.failureWindowMs
    ) {
      this.firstFailureAt = now;
      this.consecutiveFailures = 1;
    } else {
      this.consecutiveFailures += 1;
    }

    if (this.consecutiveFailures >= this.cfg.failureThreshold && this.state !== 'open') {
      this.openedAt = now;
      this.droppedSinceOpen = 0;
      this.transition('open');
    } else if (this.state === 'half_open') {
      this.openedAt = now;
      this.transition('open');
    }
  }

  private transition(to: BreakerState): void {
    if (this.state === to) return;
    const from = this.state;
    this.state = to;
    this.hooks.onEvent?.({ kind: 'transition', from, to });
  }

  private async drain(): Promise<number> {
    let drained = 0;
    while (this.queue.length > 0) {
      const row = this.queue.shift()!;
      try {
        await this.write(row);
        drained += 1;
      } catch (e) {
        this.queue.unshift(row);
        throw e;
      }
    }
    return drained;
  }
}
