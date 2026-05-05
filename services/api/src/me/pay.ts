import { Hono } from 'hono';
import { ok, err } from '@agconn/api-client/server';
import { PayrollPeriodStatus } from '@agconn/db';
import { requireAuth, requireRole, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

// Worker-facing pay history. Reads PayrollLine rows where workerUserId matches
// and the parent PayrollPeriod has been approved (i.e. paid or pending pay).
// Aggregates by employer for the summary card and returns per-period rows for
// the paystub table.

export const mePayRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
mePayRoutes.use('*', requireAuth('me'));
mePayRoutes.use('*', requireRole('worker'));

mePayRoutes.get('/', async (c) => {
  const workerId = c.var.userId;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');

  const lines = await c.var.db.payrollLine.findMany({
    where: {
      workerUserId: workerId,
      period: {
        status: {
          in: [
            PayrollPeriodStatus.approved,
            PayrollPeriodStatus.paid,
          ],
        },
      },
    },
    include: {
      period: {
        include: {
          employer: { include: { employerProfile: true } },
        },
      },
    },
    orderBy: { period: { startDate: 'desc' } },
    take: 52,
  });

  const stubs = lines.map((l) => ({
    id: l.id,
    period: `${l.period.startDate.toISOString().slice(0, 10)} – ${l.period.endDate
      .toISOString()
      .slice(0, 10)}`,
    payDate: l.period.payDate.toISOString().slice(0, 10),
    employer:
      l.period.employer?.employerProfile?.dbaName ??
      l.period.employer?.employerProfile?.legalName ??
      'AgConn employer',
    hours: Number(l.hours.toString()),
    overtimeHours: Number(l.overtimeHours.toString()),
    grossCents: l.grossCents,
    bonusCents: l.bonusCents,
    taxesCents: l.taxesCents,
    netCents: l.netCents,
    status: l.period.status,
  }));

  // Roll-ups for the dashboard / pay-page summary tiles.
  const ytdYear = new Date().getUTCFullYear();
  const ytd = stubs
    .filter((s) => Number(s.payDate.slice(0, 4)) === ytdYear)
    .reduce(
      (acc, s) => ({
        grossCents: acc.grossCents + s.grossCents,
        hours: acc.hours + s.hours + s.overtimeHours,
        weeks: acc.weeks + 1,
        employers: acc.employers.add(s.employer),
      }),
      {
        grossCents: 0,
        hours: 0,
        weeks: 0,
        employers: new Set<string>(),
      },
    );

  const next = stubs.find((s) => s.status === 'approved');

  return ok(c, {
    paystubs: stubs,
    summary: {
      ytdGrossCents: ytd.grossCents,
      ytdHours: ytd.hours,
      weeksLogged: ytd.weeks,
      employerCount: ytd.employers.size,
      avgHourlyCents:
        ytd.hours > 0 ? Math.round(ytd.grossCents / ytd.hours) : 0,
      nextDeposit: next
        ? {
            netCents: next.netCents,
            grossCents: next.grossCents,
            hours: next.hours + next.overtimeHours,
            payDate: next.payDate,
          }
        : null,
    },
  });
});
