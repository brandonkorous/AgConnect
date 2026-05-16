import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { PayrollPeriodStatus, ShiftAssignmentStatus } from '@agconn/db';
import {
  CreatePayrollPeriodBody,
  PatchPayrollPeriodBody,
  PatchPayrollLineBody,
} from '@agconn/schemas';
import {
  requireAuth,
  requireActiveEmployer,
  requireEmployerPermission,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  calcWorker,
  CA_STATE_MIN_WAGE_CENTS_2026,
  DEFAULT_CONTRACT_HOURLY_CENTS,
  DEFAULT_TAX_RATE,
  type CalcAssignment,
  type CalcContext,
} from './calc.js';

export const employerPayrollRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerPayrollRoutes.use('*', requireAuth('crews'));
employerPayrollRoutes.use('*', requireActiveEmployer);
employerPayrollRoutes.use('*', requireTenant);

employerPayrollRoutes.get('/periods', requireEmployerPermission('payroll.read'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;

  const periods = await c.var.db.payrollPeriod.findMany({
    where: { tenantId, employerId },
    orderBy: { startDate: 'desc' },
    take: 24,
    include: { lines: { select: { hours: true, grossCents: true, bonusCents: true, taxesCents: true, netCents: true, workerUserId: true } } },
  });

  return ok(c, {
    periods: periods.map((p) => ({
      id: p.id,
      employerId: p.employerId,
      startDate: p.startDate.toISOString().slice(0, 10),
      endDate: p.endDate.toISOString().slice(0, 10),
      payDate: p.payDate.toISOString().slice(0, 10),
      status: p.status,
      approvedAt: p.approvedAt?.toISOString() ?? null,
      paidAt: p.paidAt?.toISOString() ?? null,
      totals: aggregateTotals(p.lines),
    })),
  });
});

employerPayrollRoutes.post('/periods', requireEmployerPermission('payroll.manage'), validate('json', CreatePayrollPeriodBody), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const created = await c.var.db.payrollPeriod.create({
    data: {
      tenantId,
      employerId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      payDate: new Date(body.payDate),
    },
  });

  await c.var.audit.log({
    action: 'employer.payroll.period.created',
    resourceId: created.id,
    metadata: {
      periodId: created.id,
      startDate: body.startDate,
      endDate: body.endDate,
    },
  });

  return ok(c, {
    period: {
      id: created.id,
      employerId: created.employerId,
      startDate: created.startDate.toISOString().slice(0, 10),
      endDate: created.endDate.toISOString().slice(0, 10),
      payDate: created.payDate.toISOString().slice(0, 10),
      status: created.status,
      approvedAt: null,
      paidAt: null,
      totals: zeroTotals(),
    },
  });
});

employerPayrollRoutes.patch('/periods/:id', requireEmployerPermission('payroll.manage'), validate('json', PatchPayrollPeriodBody), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId },
  });
  if (!existing) return err(c, 404, 'not_found');

  const data: Record<string, unknown> = {};
  if (body.payDate) data.payDate = new Date(body.payDate);
  if (body.status) {
    data.status = body.status;
    if (body.status === PayrollPeriodStatus.approved && !existing.approvedAt) {
      data.approvedAt = new Date();
      data.approvedById = c.var.userId;
    }
    if (body.status === PayrollPeriodStatus.paid && !existing.paidAt) {
      data.paidAt = new Date();
    }
  }

  const updateResult = await c.var.db.payrollPeriod.updateMany({
    where: { id, tenantId, employerId },
    data,
  });
  if (updateResult.count !== 1) return err(c, 404, 'not_found');
  const updated = await c.var.db.payrollPeriod.findUniqueOrThrow({ where: { id } });

  if (body.status && body.status !== existing.status) {
    await c.var.audit.log({
      action: 'employer.payroll.period.status_changed',
      resourceId: id,
      metadata: { periodId: id, fromStatus: existing.status, toStatus: body.status },
    });
  }

  return ok(c, {
    period: {
      id: updated.id,
      employerId: updated.employerId,
      startDate: updated.startDate.toISOString().slice(0, 10),
      endDate: updated.endDate.toISOString().slice(0, 10),
      payDate: updated.payDate.toISOString().slice(0, 10),
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
      paidAt: updated.paidAt?.toISOString() ?? null,
    },
  });
});

employerPayrollRoutes.get('/periods/:id/lines', requireEmployerPermission('payroll.read'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const period = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId },
  });
  if (!period) return err(c, 404, 'not_found');

  const lines = await c.var.db.payrollLine.findMany({
    where: { tenantId, periodId: id },
    include: { worker: { include: { workerProfile: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return ok(c, {
    lines: lines.map((l) => {
      const wp = l.worker.workerProfile;
      const firstName = wp?.firstName ?? '';
      const lastName = wp?.lastName ?? '';
      return {
        id: l.id,
        periodId: l.periodId,
        workerUserId: l.workerUserId,
        workerName: `${firstName} ${lastName}`.trim(),
        workerInitials: `${(firstName[0] ?? '').toUpperCase()}${(lastName[0] ?? '').toUpperCase()}`,
        role: l.role,
        hours: Number(l.hours.toString()),
        overtimeHours: Number(l.overtimeHours.toString()),
        nonProductiveHours: Number(l.nonProductiveHours.toString()),
        restPeriodHours: Number(l.restPeriodHours.toString()),
        regularPayCents: l.regularPayCents,
        overtimePayCents: l.overtimePayCents,
        pieceRatePayCents: l.pieceRatePayCents,
        nonProductivePayCents: l.nonProductivePayCents,
        restPeriodPayCents: l.restPeriodPayCents,
        aewrTopUpCents: l.aewrTopUpCents,
        appliedFloorCents: l.appliedFloorCents,
        isH2a: l.isH2a,
        grossCents: l.grossCents,
        bonusCents: l.bonusCents,
        taxesCents: l.taxesCents,
        netCents: l.netCents,
        notes: l.notes,
        approvedAt: l.approvedAt?.toISOString() ?? null,
      };
    }),
  });
});

employerPayrollRoutes.patch(
  '/periods/:id/lines/:lineId',
  requireEmployerPermission('payroll.manage'),
  validate('json', PatchPayrollLineBody),
  async (c) => {
    const employerId = c.var.employerId!;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const lineId = c.req.param('lineId');
    const body = c.var.body;

    const period = await c.var.db.payrollPeriod.findFirst({
      where: { id, tenantId, employerId },
    });
    if (!period) return err(c, 404, 'not_found');
    if (period.status !== PayrollPeriodStatus.draft) return err(c, 422, 'period_locked');

    const line = await c.var.db.payrollLine.findFirst({ where: { id: lineId, periodId: id } });
    if (!line) return err(c, 404, 'not_found');

    const data: Record<string, unknown> = {};
    if (body.hours !== undefined) data.hours = body.hours;
    if (body.overtimeHours !== undefined) data.overtimeHours = body.overtimeHours;
    if (body.bonusCents !== undefined) data.bonusCents = body.bonusCents;
    if (body.taxesCents !== undefined) data.taxesCents = body.taxesCents;
    if (body.netCents !== undefined) data.netCents = body.netCents;
    if (body.grossCents !== undefined) data.grossCents = body.grossCents;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.approved) data.approvedAt = new Date();

    const updateResult = await c.var.db.payrollLine.updateMany({
      where: { id: lineId, tenantId, periodId: id },
      data,
    });
    if (updateResult.count !== 1) return err(c, 404, 'not_found');
    const updated = await c.var.db.payrollLine.findUniqueOrThrow({ where: { id: lineId } });

    await c.var.audit.log({
      action: 'employer.payroll.line.updated',
      resourceId: lineId,
      metadata: { lineId, periodId: id, fields: Object.keys(body) },
    });

    return ok(c, {
      line: {
        id: updated.id,
        periodId: updated.periodId,
        workerUserId: updated.workerUserId,
        hours: Number(updated.hours.toString()),
        overtimeHours: Number(updated.overtimeHours.toString()),
        grossCents: updated.grossCents,
        bonusCents: updated.bonusCents,
        netCents: updated.netCents,
        approvedAt: updated.approvedAt?.toISOString() ?? null,
      },
    });
  },
);

// H-2A payroll context: surfaces participation flag + active AEWR row for
// the employer's state. Used by the payroll page H-2A callout to render
// real numbers instead of placeholder text.
employerPayrollRoutes.get('/h2a-context', requireEmployerPermission('payroll.read'), async (c) => {
  const employerId = c.var.employerId!;
  const employer = await c.var.db.employerProfile.findUnique({
    where: { id: employerId },
    select: { participatesInH2a: true, stateCode: true },
  });
  const stateCode = employer?.stateCode ?? 'CA';
  const today = new Date();
  const aewr = await c.var.db.aewrRate.findFirst({
    where: {
      stateCode,
      effectiveFrom: { lte: today },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });
  return ok(c, {
    participatesInH2a: Boolean(employer?.participatesInH2a),
    aewrHourlyCents: aewr?.hourlyCents ?? null,
    stateCode,
    effectiveFrom: aewr?.effectiveFrom?.toISOString().slice(0, 10) ?? null,
    source: aewr?.source ?? null,
  });
});

// Wage statement (CA Labor Code §226-aligned). Returns a single line's
// full breakdown plus the period and employer details needed to print the
// itemized statement.
employerPayrollRoutes.get('/periods/:id/lines/:lineId/wage-statement', requireEmployerPermission('payroll.read'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const lineId = c.req.param('lineId');

  const period = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId },
  });
  if (!period) return err(c, 404, 'not_found');

  const line = await c.var.db.payrollLine.findFirst({
    where: { id: lineId, periodId: id, tenantId },
    include: { worker: { include: { workerProfile: true } } },
  });
  if (!line) return err(c, 404, 'not_found');

  const employer = await c.var.db.employerProfile.findUnique({
    where: { id: employerId },
    select: {
      legalName: true,
      dbaName: true,
      streetAddress: true,
      city: true,
      stateCode: true,
      postalCode: true,
      flcLicenseNum: true,
    },
  });

  const wp = line.worker.workerProfile;
  return ok(c, {
    line: {
      id: line.id,
      hours: Number(line.hours.toString()),
      overtimeHours: Number(line.overtimeHours.toString()),
      nonProductiveHours: Number(line.nonProductiveHours.toString()),
      restPeriodHours: Number(line.restPeriodHours.toString()),
      regularPayCents: line.regularPayCents,
      overtimePayCents: line.overtimePayCents,
      pieceRatePayCents: line.pieceRatePayCents,
      nonProductivePayCents: line.nonProductivePayCents,
      restPeriodPayCents: line.restPeriodPayCents,
      aewrTopUpCents: line.aewrTopUpCents,
      appliedFloorCents: line.appliedFloorCents,
      isH2a: line.isH2a,
      grossCents: line.grossCents,
      bonusCents: line.bonusCents,
      taxesCents: line.taxesCents,
      netCents: line.netCents,
    },
    period: {
      id: period.id,
      startDate: period.startDate.toISOString().slice(0, 10),
      endDate: period.endDate.toISOString().slice(0, 10),
      payDate: period.payDate.toISOString().slice(0, 10),
      status: period.status,
    },
    worker: {
      id: line.workerUserId,
      firstName: wp?.firstName ?? '',
      lastName: wp?.lastName ?? '',
    },
    employer: {
      legalName: employer?.legalName ?? '',
      dbaName: employer?.dbaName ?? null,
      streetAddress: employer?.streetAddress ?? null,
      city: employer?.city ?? null,
      stateCode: employer?.stateCode ?? null,
      postalCode: employer?.postalCode ?? null,
      flcLicenseNum: employer?.flcLicenseNum ?? null,
    },
  });
});

// Generates one payroll line per worker who had completed shift assignments
// inside the period window. Hours rolled up from shift_assignments.hoursWorked
// (or estimated from the shift duration when null), OT computed >40h/week,
// gross from a default rate (or piece-rate when present), bonus from piece
// totals, taxes a flat 14.2% (federal+CA approximate), net = gross + bonus
// - taxes. Existing lines for the same (period, worker) are upserted.
employerPayrollRoutes.post('/periods/:id/generate-lines', requireEmployerPermission('payroll.manage'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const period = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId },
  });
  if (!period) return err(c, 404, 'not_found');
  if (period.status !== PayrollPeriodStatus.draft) return err(c, 422, 'period_locked');

  const [assignments, employerProfile, aewrRow] = await Promise.all([
    c.var.db.shiftAssignment.findMany({
      where: {
        tenantId,
        shift: {
          employerId,
          shiftDate: { gte: period.startDate, lte: period.endDate },
        },
        status: { in: [ShiftAssignmentStatus.completed, ShiftAssignmentStatus.confirmed] },
      },
      include: {
        shift: {
          select: { startTime: true, endTime: true, shiftDate: true, shiftType: true, crew: true },
        },
        worker: { include: { workerProfile: true } },
      },
    }),
    c.var.db.employerProfile.findUnique({
      where: { id: employerId },
      select: { participatesInH2a: true, stateCode: true },
    }),
    c.var.db.aewrRate.findFirst({
      where: {
        stateCode: 'CA',
        effectiveFrom: { lte: period.endDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    }),
  ]);

  const isH2a = Boolean(employerProfile?.participatesInH2a);
  const stateCode = employerProfile?.stateCode ?? 'CA';

  const byWorker = new Map<
    string,
    { rows: CalcAssignment[]; firstName: string; lastName: string; contractCents: number }
  >();

  for (const a of assignments) {
    let hrs = a.hoursWorked ? Number(a.hoursWorked.toString()) : 0;
    if (hrs === 0) {
      const [sh = 0, sm = 0] = a.shift.startTime.split(':').map(Number);
      const eh = a.shift.endTime ? Number(a.shift.endTime.split(':')[0] ?? 0) : sh + 8;
      const em = a.shift.endTime ? Number(a.shift.endTime.split(':')[1] ?? 0) : 0;
      hrs = Math.max(0, eh + em / 60 - (sh + sm / 60));
    }

    const crewBase = a.shift.crew?.baseWageCents ?? null;
    const acc = byWorker.get(a.workerUserId) ?? {
      rows: [],
      firstName: a.worker.workerProfile?.firstName ?? '',
      lastName: a.worker.workerProfile?.lastName ?? '',
      contractCents: crewBase ?? DEFAULT_CONTRACT_HOURLY_CENTS,
    };
    if (crewBase && crewBase > acc.contractCents) acc.contractCents = crewBase;

    acc.rows.push({
      workerId: a.workerUserId,
      shiftDate: a.shift.shiftDate,
      shiftType: a.shift.shiftType,
      hoursWorked: hrs,
      piecesCount: a.piecesCount ?? 0,
      pieceRateCents: a.pieceRateCents ?? 0,
      hourlyRateCents: acc.contractCents,
    });
    byWorker.set(a.workerUserId, acc);
  }

  let writes = 0;

  for (const [workerUserId, agg] of byWorker.entries()) {
    const ctx: CalcContext = {
      isH2a,
      stateCode,
      aewrHourlyCents: aewrRow?.hourlyCents ?? null,
      stateMinWageCents: CA_STATE_MIN_WAGE_CENTS_2026,
      contractHourlyCents: agg.contractCents,
      taxRate: DEFAULT_TAX_RATE,
    };
    const result = calcWorker(workerUserId, agg.rows, ctx);
    const role = `${agg.firstName} ${agg.lastName}`.trim() || null;

    const lineData = {
      role,
      hours: result.hours,
      overtimeHours: result.overtimeHours,
      nonProductiveHours: result.nonProductiveHours,
      restPeriodHours: result.restPeriodHours,
      regularPayCents: result.regularPayCents,
      overtimePayCents: result.overtimePayCents,
      pieceRatePayCents: result.pieceRatePayCents,
      nonProductivePayCents: result.nonProductivePayCents,
      restPeriodPayCents: result.restPeriodPayCents,
      aewrTopUpCents: result.aewrTopUpCents,
      appliedFloorCents: result.appliedFloorCents,
      isH2a: result.isH2a,
      grossCents: result.grossCents,
      bonusCents: result.bonusCents,
      taxesCents: result.taxesCents,
      netCents: result.netCents,
    };

    await c.var.db.payrollLine.upsert({
      where: { periodId_workerUserId: { periodId: id, workerUserId } },
      create: {
        tenantId,
        periodId: id,
        workerUserId,
        ...lineData,
      },
      update: lineData,
    });
    writes += 1;
  }

  await c.var.audit.log({
    action: 'employer.payroll.line.updated',
    resourceId: id,
    metadata: { lineId: id, periodId: id, fields: ['generated', `count=${writes}`] },
  });

  return ok(c, { generated: writes });
});

employerPayrollRoutes.post('/periods/:id/approve', requireEmployerPermission('payroll.manage'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId },
  });
  if (!existing) return err(c, 404, 'not_found');
  if (existing.status !== PayrollPeriodStatus.draft) return err(c, 422, 'period_locked');

  const updated = await c.var.db.payrollPeriod.update({
    where: { id },
    data: {
      status: PayrollPeriodStatus.approved,
      approvedAt: new Date(),
      approvedById: c.var.userId,
    },
  });

  await c.var.audit.log({
    action: 'employer.payroll.period.status_changed',
    resourceId: id,
    metadata: { periodId: id, fromStatus: existing.status, toStatus: 'approved' },
  });

  return ok(c, {
    period: {
      id: updated.id,
      employerId: updated.employerId,
      startDate: updated.startDate.toISOString().slice(0, 10),
      endDate: updated.endDate.toISOString().slice(0, 10),
      payDate: updated.payDate.toISOString().slice(0, 10),
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
      paidAt: updated.paidAt?.toISOString() ?? null,
    },
  });
});

// audit-required:exempt — CSV view of already-audited payroll lines.
employerPayrollRoutes.get('/periods/:id/export', requireEmployerPermission('payroll.read'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const formRaw = (c.req.query('form') ?? '941').toLowerCase();
  const form = formRaw === 'de9' || formRaw === 'de-9' ? 'de9' : '941';

  const period = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId },
  });
  if (!period) return new Response('not_found', { status: 404 });

  const lines = await c.var.db.payrollLine.findMany({
    where: { tenantId, periodId: id },
    include: { worker: { include: { workerProfile: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const periodLabel = `${period.startDate.toISOString().slice(0, 10)}_${period.endDate.toISOString().slice(0, 10)}`;
  const header = form === '941'
    ? ['form', 'period_start', 'period_end', 'worker_id', 'first_name', 'last_name', 'gross_cents', 'taxes_cents', 'net_cents']
    : ['form', 'period_start', 'period_end', 'worker_id', 'first_name', 'last_name', 'hours', 'gross_cents', 'taxes_cents'];
  const rows: string[][] = [header];
  for (const l of lines) {
    const wp = l.worker.workerProfile;
    const base = [
      form === '941' ? '941' : 'DE-9',
      period.startDate.toISOString().slice(0, 10),
      period.endDate.toISOString().slice(0, 10),
      l.workerUserId,
      wp?.firstName ?? '',
      wp?.lastName ?? '',
    ];
    if (form === '941') {
      rows.push([...base, String(l.grossCents), String(l.taxesCents), String(l.netCents)]);
    } else {
      rows.push([...base, Number(l.hours.toString()).toFixed(2), String(l.grossCents), String(l.taxesCents)]);
    }
  }

  const filename = `agconn-${form}-${periodLabel}.csv`;
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
});

// audit-required:exempt — CSV view of already-audited payroll lines.
employerPayrollRoutes.get('/periods/:id/lines.csv', requireEmployerPermission('payroll.read'), async (c) => {
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const period = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId },
  });
  if (!period) return new Response('not_found', { status: 404 });

  const lines = await c.var.db.payrollLine.findMany({
    where: { tenantId, periodId: id },
    include: { worker: { include: { workerProfile: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const rows: string[][] = [
    [
      'worker_id',
      'first_name',
      'last_name',
      'role',
      'hours',
      'overtime_hours',
      'gross_cents',
      'bonus_cents',
      'taxes_cents',
      'net_cents',
      'approved_at',
    ],
  ];
  for (const l of lines) {
    const wp = l.worker.workerProfile;
    rows.push([
      l.workerUserId,
      wp?.firstName ?? '',
      wp?.lastName ?? '',
      l.role ?? '',
      Number(l.hours.toString()).toFixed(2),
      Number(l.overtimeHours.toString()).toFixed(2),
      String(l.grossCents),
      String(l.bonusCents),
      String(l.taxesCents),
      String(l.netCents),
      l.approvedAt ? l.approvedAt.toISOString() : '',
    ]);
  }

  const filename = `agconn-payroll-${period.startDate.toISOString().slice(0, 10)}.csv`;
  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
});

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '');
          return /[,"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\r\n');
}

function zeroTotals() {
  return { workers: 0, hours: 0, grossCents: 0, bonusCents: 0, taxesCents: 0, netCents: 0 };
}

function aggregateTotals(lines: { hours: { toString(): string }; grossCents: number; bonusCents: number; taxesCents: number; netCents: number; workerUserId: string }[]) {
  const workers = new Set(lines.map((l) => l.workerUserId)).size;
  let hours = 0;
  let grossCents = 0;
  let bonusCents = 0;
  let taxesCents = 0;
  let netCents = 0;
  for (const l of lines) {
    hours += Number(l.hours.toString());
    grossCents += l.grossCents;
    bonusCents += l.bonusCents;
    taxesCents += l.taxesCents;
    netCents += l.netCents;
  }
  return { workers, hours, grossCents, bonusCents, taxesCents, netCents };
}
