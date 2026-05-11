import 'server-only';
import { adminFetch } from './api-server';

export type TranslationStatus = 'draft' | 'needs_review' | 'reviewed' | 'published';

export type TranslationCell = {
  id: string;
  value: string;
  status: TranslationStatus;
  updatedAt: string;
};

export type TranslationPair = {
  namespace: string;
  key: string;
  tenantId: string | null;
  en: TranslationCell | null;
  es: TranslationCell | null;
};

export type ListResponse = {
  pairs: TranslationPair[];
  nextCursor: string | null;
};

export type NamespaceSummary = { namespace: string; pairs: number };

export type ListQuery = {
  scope?: 'platform' | 'tenant';
  tenantId?: string;
  namespace?: string;
  search?: string;
  status?: TranslationStatus;
  missingOnly?: boolean;
  limit?: number;
  cursor?: string;
};

export const fetchTranslations = (q: ListQuery, tenantId: string | null) =>
  adminFetch<ListResponse>('/admin/v1/translations', {
    query: {
      scope: q.scope ?? (tenantId ? 'tenant' : 'platform'),
      tenantId: q.tenantId,
      namespace: q.namespace,
      search: q.search,
      status: q.status,
      missingOnly: q.missingOnly ? 'true' : undefined,
      limit: q.limit,
      cursor: q.cursor,
    },
    tenantId,
  });

export const fetchNamespaces = (scope: 'platform' | 'tenant', tenantId: string | null) =>
  adminFetch<{ namespaces: NamespaceSummary[] }>(
    `/admin/v1/translations/namespaces?scope=${scope}`,
    { tenantId },
  );
