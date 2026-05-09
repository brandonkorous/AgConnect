import { z } from 'zod';
import { FunderEnum } from './training.js';

export const WalletItemSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('enrollment'),
    id: z.string().uuid(),
    certificateId: z.string().nullable(),
    programTitleEn: z.string(),
    programTitleEs: z.string(),
    funder: FunderEnum,
    orgName: z.string(),
    completedAt: z.string(),
    certUrl: z.string().nullable(),
    issuedAt: z.string(),
    expiresAt: z.string().nullable(),
  }),
  z.object({
    source: z.literal('manual'),
    id: z.string(),
    name: z.string(),
    issuer: z.string().nullable(),
    issuedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
  }),
]);
export type WalletItem = z.infer<typeof WalletItemSchema>;

export const WalletResponse = z.object({
  items: z.array(WalletItemSchema),
});

export const ShareResponse = z.object({
  shareUrl: z.string(),
  shareTextEn: z.string(),
  shareTextEs: z.string(),
});
