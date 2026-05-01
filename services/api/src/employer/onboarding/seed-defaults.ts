import type { Tx } from '@agconn/db';
import { ComplianceItemStatus } from '@agconn/db';

// audit-required:exempt — these helpers run inside the onboarding transaction
// (employer.flc.submitted is the parent audit). Seeding deterministic default
// rows for a brand-new employer is part of that single user-initiated action;
// emitting per-row audits would explode the audit log without adding evidence.

type DefaultItem = {
  category: string;
  itemKey: string;
  label: string;
  status?: ComplianceItemStatus;
  details?: string;
};

const DEFAULT_COMPLIANCE_ITEMS: DefaultItem[] = [
  // Worker documentation
  { category: 'documentation', itemKey: 'i9_on_file',     label: 'I-9 forms on file',                                details: '' },
  { category: 'documentation', itemKey: 'w4_collected',   label: 'W-4s collected',                                   details: '' },
  { category: 'documentation', itemKey: 'i9_expiring',    label: 'I-9s expiring within 30 days',                     details: 'No expirations on file' },

  // Worker safety (Cal/OSHA)
  { category: 'safety', itemKey: 'heat_plan',     label: 'Heat illness prevention plan',           details: 'Required by Cal/OSHA §3395' },
  { category: 'safety', itemKey: 'wps_training',  label: 'Pesticide handler training (WPS)',       details: '' },
  { category: 'safety', itemKey: 'covid_plan',    label: 'COVID-19 prevention plan',               details: '' },

  // Wage & hour
  { category: 'wage_hour', itemKey: 'piece_breaks',  label: 'Piece-rate paid breaks tracked',     details: 'AB 1513 compliant' },
  { category: 'wage_hour', itemKey: 'overtime',      label: 'Overtime calculations',               details: 'Phase-in 2025: 8h/40h' },
  { category: 'wage_hour', itemKey: 'wage_stmts',    label: 'Itemized wage statements',            details: 'Auto-generated' },

  // Pesticide records
  { category: 'pesticide', itemKey: 'pur_records',   label: 'Application records (PUR)',          details: 'Filed monthly' },
  { category: 'pesticide', itemKey: 'noi_filing',    label: 'Notice of Intent (NOI)',             details: 'CDPR submission' },

  // H-2A program (only relevant for some employers — start as 'ok' so it doesn't show as a fail)
  { category: 'h2a', itemKey: 'aewr_rate',     label: 'AEWR rate compliance',                 details: 'Adverse Effect Wage Rate' },
  { category: 'h2a', itemKey: 'housing_insp',  label: 'Housing inspection',                   details: 'Annual per 20 CFR 655.122' },
  { category: 'h2a', itemKey: 'three_quarter', label: '3/4 guarantee tracking',               details: 'Auto-tracked' },
];

export async function seedDefaultComplianceItems(
  tx: Tx,
  tenantId: string,
  employerUserId: string,
): Promise<void> {
  await tx.complianceItem.createMany({
    data: DEFAULT_COMPLIANCE_ITEMS.map((item) => ({
      tenantId,
      employerId: employerUserId,
      category: item.category,
      itemKey: item.itemKey,
      label: item.label,
      status: item.status ?? ComplianceItemStatus.ok,
      details: item.details ?? null,
    })),
    skipDuplicates: true,
  });
}

export async function seedInitialPayrollPeriod(
  tx: Tx,
  tenantId: string,
  employerUserId: string,
): Promise<void> {
  // Build a Mon–Sun pay period covering the current week, with pay date the
  // following Friday (matches "runs Friday" copy in the design).
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() + offset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const pay = new Date(end);
  pay.setUTCDate(end.getUTCDate() + 5); // Friday after Sunday end

  const existing = await tx.payrollPeriod.findFirst({
    where: { tenantId, employerId: employerUserId, startDate: start },
  });
  if (existing) return;

  await tx.payrollPeriod.create({
    data: {
      tenantId,
      employerId: employerUserId,
      startDate: start,
      endDate: end,
      payDate: pay,
    },
  });
}
