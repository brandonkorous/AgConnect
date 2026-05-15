'use client';

import { isOk } from '@agconn/api-client';
import { getApiClient } from '@/lib/api/client';

export type TransitionPayload =
  | { toStatus: 'reviewed'; note?: string }
  | {
      toStatus: 'hired';
      wageOffered: number;
      startDate: string;
      note?: string;
    }
  | {
      toStatus: 'rejected';
      rejectionReason?: string;
      rejectionReasonText?: string;
    };

export type TransitionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export async function transitionApplication(
  locale: string,
  applicationId: string,
  payload: TransitionPayload,
): Promise<TransitionResult> {
  const client = getApiClient(locale === 'es' ? 'es' : 'en');
  const res = await client.post(
    `/v1/employer/applications/${applicationId}/transition`,
    payload,
    { handleErrorInline: true },
  );
  if (!isOk(res)) {
    return { ok: false, code: res.error.code, message: res.error.message };
  }
  return { ok: true };
}
