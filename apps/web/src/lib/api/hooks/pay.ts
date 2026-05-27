'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type Paystub = {
  id: string;
  period: string;
  payDate: string;
  employer: string;
  hours: number;
  overtimeHours: number;
  grossCents: number;
  bonusCents: number;
  taxesCents: number;
  netCents: number;
  status: 'approved' | 'paid';
};

export type PaySummary = {
  ytdGrossCents: number;
  ytdHours: number;
  weeksLogged: number;
  employerCount: number;
  avgHourlyCents: number;
  nextDeposit: {
    netCents: number;
    grossCents: number;
    hours: number;
    payDate: string;
  } | null;
};

export type MyPay = { paystubs: Paystub[]; summary: PaySummary };

const myPayOptions = queryOptions({
  queryKey: qk.myPay(),
  queryFn: async (): Promise<MyPay> => unwrap(await apiClient().get<MyPay>('/v1/me/pay')),
  staleTime: 5 * 60_000,
});

export function useMyPay() {
  return useQuery(myPayOptions);
}
export function useMyPaySuspense() {
  return useSuspenseQuery(myPayOptions);
}
