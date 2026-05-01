import 'server-only';
import { getServerApiClient } from './server-client';

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

export async function fetchWallet(): Promise<WalletItem[]> {
  const api = await getServerApiClient();
  const res = await api.get<{ items: WalletItem[] }>('/v1/wallet', {
    handleErrorInline: true,
  });
  if (!res.ok) return [];
  return res.data.items;
}

export type CertDetail = {
  certificateId: string | null;
  programTitleEn: string;
  programTitleEs: string;
  org: { name: string; email: string | null };
  funder: string;
  completedAt: string | null;
  signedUrl: string | null;
};

export async function fetchCert(enrollmentId: string): Promise<CertDetail | null> {
  const api = await getServerApiClient();
  const res = await api.get<CertDetail>(
    `/v1/wallet/cert/${encodeURIComponent(enrollmentId)}`,
    { handleErrorInline: true },
  );
  if (!res.ok) return null;
  return res.data;
}
