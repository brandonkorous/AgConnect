'use client';

import { Component, type ReactNode } from 'react';

type Props = {
  fallback: ReactNode;
  onError?: (error: unknown) => void;
  children: ReactNode;
};

type State = { hasError: boolean };

export class CardErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    this.props.onError?.(error);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[CardErrorBoundary]', error);
    }
  }

  override render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
