'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type FallbackRender = (args: { error: Error; reset: () => void }) => ReactNode;

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | FallbackRender;
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKeys?: ReadonlyArray<unknown>;
};

type State = { error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  override componentDidUpdate(prev: ErrorBoundaryProps): void {
    if (!this.state.error) return;
    const a = prev.resetKeys ?? [];
    const b = this.props.resetKeys ?? [];
    if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
      this.setState({ error: null });
    }
  }

  reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { fallback } = this.props;
    if (typeof fallback === 'function') return fallback({ error, reset: this.reset });
    return fallback ?? <DefaultFallback error={error} reset={this.reset} />;
  }
}

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="alert alert-error">
      <div>
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm opacity-80">{error.message}</p>
      </div>
      <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
