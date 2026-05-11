'use server';

import { revalidatePath } from 'next/cache';
import { upsertFlag, deleteFlag } from '@/lib/system-api';

export async function setFlag(input: {
  key: string;
  tenantId: string | null;
  enabled: boolean;
  notes?: string | null;
}) {
  const result = await upsertFlag(input);
  if (result.ok) revalidatePath('/system/flags');
  return result;
}

export async function removeFlagOverride(id: string) {
  const result = await deleteFlag(id);
  if (result.ok) revalidatePath('/system/flags');
  return result;
}
