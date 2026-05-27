'use client';

import { useQuery, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { unwrap } from '../unwrap';
import { qk } from '../query-keys';

export type ShiftRow = {
  id: string;
  status: 'assigned' | 'confirmed' | 'declined' | 'no_show' | 'attended';
  hoursWorked: number | null;
  arrivedAt: string | null;
  shift: {
    id: string;
    date: string;
    startTime: string;
    endTime: string | null;
    locationLabel: string;
    locationLat: number | null;
    locationLng: number | null;
    status: string;
    notes: string | null;
    employer: string;
    crewName: string | null;
    foremanPhone: string | null;
    jobTitleEn: string | null;
    jobTitleEs: string | null;
  };
};

async function fetchMyShifts(range?: { from?: string; to?: string }): Promise<ShiftRow[]> {
  const data = unwrap(
    await apiClient().get<{ shifts: ShiftRow[] }>('/v1/me/shifts', {
      query: { from: range?.from, to: range?.to },
    }),
  );
  return data.shifts;
}

const myShiftsOptions = queryOptions({
  queryKey: qk.myShifts(),
  queryFn: () => fetchMyShifts(),
  staleTime: 2 * 60_000,
});

function myShiftsRangeOptions(range: { from?: string; to?: string }) {
  return queryOptions({
    queryKey: [...qk.myShifts(), range.from ?? null, range.to ?? null] as const,
    queryFn: () => fetchMyShifts(range),
    staleTime: 2 * 60_000,
  });
}

export function useMyShifts() {
  return useQuery(myShiftsOptions);
}
export function useMyShiftsSuspense() {
  return useSuspenseQuery(myShiftsOptions);
}
export function useMyShiftsRangeSuspense(range: { from?: string; to?: string }) {
  return useSuspenseQuery(myShiftsRangeOptions(range));
}
