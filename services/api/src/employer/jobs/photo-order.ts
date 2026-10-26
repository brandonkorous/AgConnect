// audit-required:exempt — display order only, same as before the move out of photos.ts (upload and delete are audited there).
import type { Tx } from '@agconn/db';

// One transaction in callback form: the RLS client rejects $transaction([...]), which made every reorder fail.
export async function reorderJobPhotos(db: Pick<Tx, '$transaction'>, order: string[]): Promise<void> {
  await db.$transaction(async (tx) => {
    for (const [idx, photoId] of order.entries()) {
      await tx.jobPhoto.update({ where: { id: photoId }, data: { sortOrder: idx } });
    }
  });
}
