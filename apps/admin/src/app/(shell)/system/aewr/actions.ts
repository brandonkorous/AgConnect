'use server';

import { revalidatePath } from 'next/cache';
import { createAewr, updateAewr, deleteAewr } from '@/lib/system-api';

export async function createRate(body: {
  stateCode: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  hourlyCents: number;
  source?: string | null;
}) {
  const result = await createAewr(body);
  if (result.ok) revalidatePath('/system/aewr');
  return result;
}

export async function updateRate(
  id: string,
  body: { effectiveTo?: string | null; hourlyCents?: number; source?: string | null },
) {
  const result = await updateAewr(id, body);
  if (result.ok) revalidatePath('/system/aewr');
  return result;
}

export async function deleteRate(id: string) {
  const result = await deleteAewr(id);
  if (result.ok) revalidatePath('/system/aewr');
  return result;
}
