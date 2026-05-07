import 'server-only';
import { getServerApiClient } from './server-client';

export type SavedSearch = {
  id: string;
  name: string | null;
  filters: {
    county?: string[];
    skills?: string[];
    wageMin?: number;
    wageMax?: number;
    startBefore?: string;
    startAfter?: string;
    housing?: boolean;
    transport?: boolean;
    noExperience?: boolean;
  };
  alertChannel: 'sms' | 'email' | 'both' | 'none';
  alertActive: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const api = await getServerApiClient();
  const res = await api.get<{ savedSearches: SavedSearch[] }>('/v1/saved-searches', {
    handleErrorInline: true,
  });
  if (!res.ok) return [];
  return res.data.savedSearches;
}
