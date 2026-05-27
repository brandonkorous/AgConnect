import type { ApiResponse } from '@agconn/api-client';

// Converts the envelope `{ ok, data } | { ok: false, error }` into either
// the unwrapped data or a thrown ApiError. TanStack Query's error path needs
// throws, not the envelope.

export class ApiError extends Error {
  readonly code: string;
  readonly status: number | undefined;

  constructor(code: string, message: string, status?: number) {
    super(message || code);
    this.code = code;
    this.status = status;
  }
}

export function unwrap<T>(res: ApiResponse<T>): T {
  if (res.ok) return res.data;
  throw new ApiError(res.error.code ?? 'unknown', res.error.message ?? '');
}
