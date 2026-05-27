'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';

export type WalletItem =
  | {
      source: 'enrollment';
      id: string;
      certificateId: string | null;
      programTitleEn: string;
      programTitleEs: string;
      funder: string;
      orgName: string;
      completedAt: string;
      certUrl: string | null;
      issuedAt: string;
      expiresAt: string | null;
    }
  | {
      source: 'manual';
      id: string;
      name: string;
      issuer: string | null;
      issuedAt: string | null;
      expiresAt: string | null;
    };

export type CertDetail = {
  certificateId: string | null;
  programTitleEn: string;
  programTitleEs: string;
  org: { name: string; email: string | null };
  funder: string;
  completedAt: string | null;
  signedUrl: string | null;
};

const walletOptions = queryOptions({
  queryKey: ['wallet'] as const,
  queryFn: async (): Promise<WalletItem[]> => {
    const data = unwrap(
      await apiClient().get<{ items: WalletItem[] }>('/v1/wallet'),
    );
    return data.items;
  },
  staleTime: 5 * 60_000,
});

export function useWallet() {
  return useQuery(walletOptions);
}
export function useWalletSuspense() {
  return useSuspenseQuery(walletOptions);
}

function certOptions(enrollmentId: string) {
  return queryOptions({
    queryKey: ['wallet', 'cert', enrollmentId] as const,
    queryFn: async (): Promise<CertDetail | null> => {
      const res = await apiClient().get<CertDetail>(
        `/v1/wallet/cert/${encodeURIComponent(enrollmentId)}`,
        { handleErrorInline: true },
      );
      if (!res.ok) return null;
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCertSuspense(enrollmentId: string) {
  return useSuspenseQuery(certOptions(enrollmentId));
}
