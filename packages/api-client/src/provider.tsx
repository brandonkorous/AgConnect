'use client';

import { createContext, useContext, useMemo } from 'react';
import { createApiClient, type ApiClient, type ApiClientOptions } from './client';

const ApiContext = createContext<ApiClient | null>(null);

export type ApiProviderProps = {
  baseUrl: string;
  getLocale: ApiClientOptions['getLocale'];
  getSession?: ApiClientOptions['getSession'];
  onUnhandledError?: ApiClientOptions['onUnhandledError'];
  children: React.ReactNode;
};

export function ApiProvider({
  baseUrl,
  getLocale,
  getSession,
  onUnhandledError,
  children,
}: ApiProviderProps) {
  const client = useMemo(
    () => createApiClient({ baseUrl, getLocale, getSession, onUnhandledError }),
    [baseUrl, getLocale, getSession, onUnhandledError],
  );
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export const useApi = (): ApiClient => {
  const c = useContext(ApiContext);
  if (!c) throw new Error('useApi called outside <ApiProvider>');
  return c;
};
