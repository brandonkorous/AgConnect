import { z } from 'zod';

export const PayrollPeriodStatusEnum = z.enum(['draft', 'approved', 'paid']);
export type PayrollPeriodStatus = z.infer<typeof PayrollPeriodStatusEnum>;

export const CreatePayrollPeriodBody = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
    payDate: z.string().date(),
  })
  .strict()
  .refine((b) => b.startDate <= b.endDate, {
    message: 'date_order',
    path: ['endDate'],
  })
  .refine((b) => b.payDate >= b.endDate, {
    message: 'pay_date_before_end',
    path: ['payDate'],
  });
export type CreatePayrollPeriodBody = z.infer<typeof CreatePayrollPeriodBody>;

export const PatchPayrollPeriodBody = z
  .object({
    status: PayrollPeriodStatusEnum.optional(),
    payDate: z.string().date().optional(),
  })
  .strict();
export type PatchPayrollPeriodBody = z.infer<typeof PatchPayrollPeriodBody>;

export const PatchPayrollLineBody = z
  .object({
    hours: z.number().nonnegative().max(200).optional(),
    overtimeHours: z.number().nonnegative().max(80).optional(),
    bonusCents: z.number().int().nonnegative().optional(),
    taxesCents: z.number().int().nonnegative().optional(),
    netCents: z.number().int().nonnegative().optional(),
    grossCents: z.number().int().nonnegative().optional(),
    notes: z.string().max(500).nullable().optional(),
    approved: z.boolean().optional(),
  })
  .strict();
export type PatchPayrollLineBody = z.infer<typeof PatchPayrollLineBody>;

export const PayrollPeriodSchema = z.object({
  id: z.string().uuid(),
  employerId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  payDate: z.string(),
  status: PayrollPeriodStatusEnum,
  approvedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  totals: z.object({
    workers: z.number().int().nonnegative(),
    hours: z.number().nonnegative(),
    grossCents: z.number().int(),
    bonusCents: z.number().int(),
    taxesCents: z.number().int(),
    netCents: z.number().int(),
  }),
});
export type PayrollPeriodView = z.infer<typeof PayrollPeriodSchema>;

export const PayrollLineSchema = z.object({
  id: z.string().uuid(),
  periodId: z.string().uuid(),
  workerUserId: z.string(),
  workerName: z.string(),
  workerInitials: z.string(),
  role: z.string().nullable(),
  hours: z.number(),
  overtimeHours: z.number(),
  grossCents: z.number().int(),
  bonusCents: z.number().int(),
  taxesCents: z.number().int(),
  netCents: z.number().int(),
  notes: z.string().nullable(),
  approvedAt: z.string().nullable(),
});
export type PayrollLineView = z.infer<typeof PayrollLineSchema>;
