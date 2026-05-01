import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { PayrollPeriodStatus } from '@agconn/db';
import {
  CreatePayrollPeriodBody,
  PatchPayrollPeriodBody,
  PatchPayrollLineBody,
} from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

export const employerPayrollRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerPayrollRoutes.use('*', requireAuth);
employerPayrollRoutes.use('*', requireRole('employer'));
employerPayrollRoutes.use('*', requireTenant);

employerPayrollRoutes.get('/periods', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;

  const periods = await c.var.db.payrollPeriod.findMany({
    where: { tenantId, employerId: userId },
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

employerPayrollRoutes.post('/periods', validate('json', CreatePayrollPeriodBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  const created = await c.var.db.payrollPeriod.create({
    data: {
      tenantId,
      employerId: userId,
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

employerPayrollRoutes.patch('/periods/:id', validate('json', PatchPayrollPeriodBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId: userId },
  });
  if (!existing) return err(c, 404, 'not_found');

  const data: Record<string, unknown> = {};
  if (body.payDate) data.payDate = new Date(body.payDate);
  if (body.status) {
    data.status = body.status;
    if (body.status === PayrollPeriodStatus.approved && !existing.approvedAt) {
      data.approvedAt = new Date();
      data.approvedById = userId;
    }
    if (body.status === PayrollPeriodStatus.paid && !existing.paidAt) {
      data.paidAt = new Date();
    }
  }

  const updated = await c.var.db.payrollPeriod.update({ where: { id }, data });

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

employerPayrollRoutes.get('/periods/:id/lines', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const period = await c.var.db.payrollPeriod.findFirst({
    where: { id, tenantId, employerId: userId },
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
  validate('json', PatchPayrollLineBody),
  async (c) => {
    const userId = c.var.userId;
    const tenantId = c.var.tenantId!;
    const id = c.req.param('id');
    const lineId = c.req.param('lineId');
    const body = c.var.body;

    const period = await c.var.db.payrollPeriod.findFirst({
      where: { id, tenantId, employerId: userId },
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

    const updated = await c.var.db.payrollLine.update({ where: { id: lineId }, data });

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
