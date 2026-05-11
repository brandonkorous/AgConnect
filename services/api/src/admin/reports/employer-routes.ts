import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { FORMAT_MIME, toCsv, toXlsx, type CsvCell } from '@agconn/reporting';
import {
  clerkAdminAuthMiddleware,
  requireAdminOrg,
  type AdminOrgVars,
} from '../../middleware/adminClerkAuth.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  employerActivityQuery,
  employerActivityExportBody,
  EMPLOYER_COLUMNS,
  runEmployerActivityReport,
  aggregateEmployersBy,
  aggregatedEmployerColumns,
} from './employer.js';

export const adminEmployerReportRoutes = new Hono<{
  Variables: AdminOrgVars & AuditCtxVars;
}>();

adminEmployerReportRoutes.use('*', clerkAdminAuthMiddleware);
adminEmployerReportRoutes.use('*', requireAdminOrg('admin'));

adminEmployerReportRoutes.get(
  '/preview',
  validate('query', employerActivityQuery),
  async (c) => {
    const q = c.var.body;
    const rows = await runEmployerActivityReport(c.var.db, q);

    if (q.view === 'rows') {
      return ok(c, {
        rows: rows.slice(0, q.preview),
        totalCount: rows.length,
        columns: EMPLOYER_COLUMNS,
      });
    }

    const by = q.view === 'by_county' ? 'county' : 'license_type';
    const agg = aggregateEmployersBy(rows, by);
    return ok(c, {
      rows: agg.slice(0, q.preview),
      totalCount: agg.length,
      columns: aggregatedEmployerColumns(q.view),
    });
  },
);

adminEmployerReportRoutes.post(
  '/export',
  validate('json', employerActivityExportBody),
  async (c) => {
    const body = c.var.body;
    if (body.email) {
      return err(
        c,
        422,
        'not_supported',
        'Email delivery for employer activity reports lands in Phase 6. Download directly for now.',
      );
    }

    const rows = await runEmployerActivityReport(c.var.db, body);

    let outputRows: ReadonlyArray<Record<string, CsvCell>>;
    let columns: ReadonlyArray<string>;

    if (body.view === 'rows') {
      outputRows = rows;
      columns = EMPLOYER_COLUMNS;
    } else {
      const by = body.view === 'by_county' ? 'county' : 'license_type';
      outputRows = aggregateEmployersBy(rows, by);
      columns = aggregatedEmployerColumns(body.view);
    }

    const buffer =
      body.format === 'csv'
        ? toCsv(outputRows, columns, { bom: true })
        : await toXlsx(outputRows, columns, { sheetName: 'Employer Activity' });

    const run = await c.var.db.reportRun.create({
      data: {
        tenantId: body.tenantIds?.length === 1 ? body.tenantIds[0] : null,
        reportType: 'employer',
        filters: body as object,
        rowCount: outputRows.length,
        format: body.format,
        generatedBy: c.var.userId,
      },
    });

    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'employer',
        rowCount: outputRows.length,
        filterDigest: JSON.stringify({
          start: body.start,
          end: body.end,
          view: body.view,
          counties: body.counties ?? [],
          licenseTypes: body.licenseTypes ?? [],
          tenantIds: body.tenantIds ?? [],
          format: body.format,
        }),
      },
    });

    const filename = `employer-activity-${body.start}-${body.end}.${body.format}`;
    c.header('Content-Type', FORMAT_MIME[body.format]);
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('X-Row-Count', String(outputRows.length));
    c.header('X-Run-Id', run.id);
    return c.body(buffer as unknown as ArrayBuffer);
  },
);
