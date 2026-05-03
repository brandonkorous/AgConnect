import { z } from 'zod';

const usStateRegex = /^[A-Z]{2}$/;
const usZipRegex = /^[0-9]{5}(-[0-9]{4})?$/;

export const AddressInputSchema = z
  .object({
    streetAddress: z.string().trim().min(3).max(160),
    city: z.string().trim().min(2).max(80),
    stateCode: z.string().regex(usStateRegex, 'state_code_format'),
    postalCode: z.string().regex(usZipRegex, 'postal_code_format'),
    addressLat: z.number().gte(-90).lte(90),
    addressLng: z.number().gte(-180).lte(180),
    mapboxId: z.string().min(1).max(200).optional(),
  })
  .strict();
export type AddressInput = z.infer<typeof AddressInputSchema>;

export const AddressOutputSchema = z.object({
  streetAddress: z.string().nullable(),
  city: z.string().nullable(),
  stateCode: z.string().nullable(),
  postalCode: z.string().nullable(),
  addressLat: z.number().nullable(),
  addressLng: z.number().nullable(),
  mapboxId: z.string().nullable(),
});
export type AddressOutput = z.infer<typeof AddressOutputSchema>;
