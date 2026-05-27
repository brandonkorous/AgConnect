'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type Thread = {
  id: string;
  title: string;
  channel: 'sms' | 'whatsapp' | 'app';
  unreadCount: number;
  lastMessageAt: string | null;
  employer: string;
  lastMessage: {
    body: string;
    senderUserId: string;
    direction: 'inbound' | 'outbound';
    createdAt: string;
  } | null;
};

export type ThreadList = { threads: Thread[]; totalUnread: number };

export type ThreadDetail = {
  conversation: {
    id: string;
    title: string;
    channel: 'sms' | 'whatsapp' | 'app';
    employer: string;
    pinnedShiftId: string | null;
  };
  messages: {
    id: string;
    body: string;
    senderUserId: string;
    direction: 'inbound' | 'outbound';
    channel: 'sms' | 'whatsapp' | 'app';
    isMe: boolean;
    createdAt: string;
  }[];
};

const myMessageThreadsOptions = queryOptions({
  queryKey: qk.myMessageThreads(),
  queryFn: async (): Promise<ThreadList> =>
    unwrap(await apiClient().get<ThreadList>('/v1/me/messages')),
  staleTime: 60_000,
});

function myMessageThreadOptions(id: string) {
  return queryOptions({
    queryKey: [...qk.myMessageThreads(), id] as const,
    queryFn: async (): Promise<ThreadDetail> =>
      unwrap(
        await apiClient().get<ThreadDetail>(`/v1/me/messages/${encodeURIComponent(id)}`),
      ),
    staleTime: 30_000,
  });
}

export function useMyMessageThreads() {
  return useQuery(myMessageThreadsOptions);
}
export function useMyMessageThreadsSuspense() {
  return useSuspenseQuery(myMessageThreadsOptions);
}

export function useMyMessageThread(id: string) {
  return useQuery({ ...myMessageThreadOptions(id), enabled: Boolean(id) });
}
export function useMyMessageThreadSuspense(id: string) {
  return useSuspenseQuery(myMessageThreadOptions(id));
}
