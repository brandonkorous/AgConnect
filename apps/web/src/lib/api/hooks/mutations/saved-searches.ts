'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../client';
import { qk } from '../../query-keys';
import type { SavedSearch } from '../saved-searches';

export type SavedSearchInput = {
  name?: string | null;
  filters: SavedSearch['filters'];
  alertChannel: SavedSearch['alertChannel'];
  alertActive: boolean;
};

export type SavedSearchResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export function useCreateSavedSearchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SavedSearchInput): Promise<SavedSearchResult<SavedSearch>> => {
      const res = await apiClient().post<SavedSearch>('/v1/saved-searches', input, {
        handleErrorInline: true,
      });
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: res.data };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.savedSearches() });
    },
  });
}

export function usePatchSavedSearchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Partial<SavedSearchInput>;
    }): Promise<SavedSearchResult<SavedSearch>> => {
      const res = await apiClient().patch<SavedSearch>(
        `/v1/saved-searches/${encodeURIComponent(input.id)}`,
        input.patch,
        { handleErrorInline: true },
      );
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: res.data };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.savedSearches() });
    },
  });
}

export function useDeleteSavedSearchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<SavedSearchResult<null>> => {
      const res = await apiClient().del(`/v1/saved-searches/${encodeURIComponent(id)}`, {
        handleErrorInline: true,
      });
      if (!res.ok) return { ok: false, code: res.error.code, message: res.error.message };
      return { ok: true, data: null };
    },
    onSuccess: (r) => {
      if (r.ok) void qc.invalidateQueries({ queryKey: qk.savedSearches() });
    },
  });
}
