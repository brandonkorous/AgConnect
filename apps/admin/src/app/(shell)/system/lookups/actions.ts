'use server';

import { revalidatePath } from 'next/cache';
import {
  createLookupRow,
  updateLookupRow,
  deleteLookupRow,
  type LookupTable,
} from '@/lib/system-api';

export async function createRow(table: LookupTable, body: Record<string, unknown>) {
  const result = await createLookupRow(table, body);
  if (result.ok) revalidatePath(`/system/lookups`);
  return result;
}

export async function updateRow(table: LookupTable, id: string, body: Record<string, unknown>) {
  const result = await updateLookupRow(table, id, body);
  if (result.ok) revalidatePath(`/system/lookups`);
  return result;
}

export async function deleteRow(table: LookupTable, id: string) {
  const result = await deleteLookupRow(table, id);
  if (result.ok) revalidatePath(`/system/lookups`);
  return result;
}
