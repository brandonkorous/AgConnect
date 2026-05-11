'use server';

import { revalidatePath } from 'next/cache';
import { replayJob } from '@/lib/system-api';

export async function replay(id: string) {
  const result = await replayJob(id);
  if (result.ok) revalidatePath('/system/jobs');
  return result;
}
