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
  trainingReportQuery,
  trainingExportBody,
  trainingColumns,
  runTrainingReport,
  aggregateBy,
  aggregatedColumns,
} from './training.js';

export const adminTrainingReportRoutes = new Hono<{
  Variables: AdminOrgVars & AuditCtxVars;
}>();

adminTrainingReportRoutes.use('*', clerkAdminAuthMiddleware);
adminTrainingReportRoutes.use('*', requireAdminOrg('admin'));

adminTrainingReportRoutes.get(
  '/preview',
  validate('query', trainingReportQuery),
  async (c) => {
    const q = c.var.body;
    const rows = await runTrainingReport(c.var.db, q);

    if (q.view === 'rows') {
      const columns = trainingColumns(q.includeNames);
      const trimmed = q.includeNames
        ? rows
        : rows.map((r) => {
            const { workerId: _w, workerName: _n, ...rest } = r;
            return rest;
          });
      return ok(c, {
        rows: trimmed.slice(0, q.preview),
        totalCount: rows.length,
        columns,
      });
    }

    const by = q.view === 'by_program' ? 'program' : q.view === 'by_funder' ? 'funder' : 'org';
    const agg = aggregateBy(rows, by);
    return ok(c, {
      rows: agg.slice(0, q.preview),
      totalCount: agg.length,
      columns: aggregatedColumns(q.view),
    });
  },
);

adminTrainingReportRoutes.post(
  '/export',
  validate('json', trainingExportBody),
  async (c) => {
    const body = c.var.body;
    if (body.email) {
      return err(
        c,
        422,
        'not_supported',
        'Email delivery for training reports lands in Phase 6. Download directly for now.',
      );
    }

    const rows = await runTrainingReport(c.var.db, body);

    let outputRows: ReadonlyArray<Record<string, CsvCell>>;
    let columns: ReadonlyArray<string>;

    if (body.view === 'rows') {
      columns = trainingColumns(body.includeNames);
      outputRows = body.includeNames
        ? rows
        : rows.map((r) => {
            const { workerId: _w, workerName: _n, ...rest } = r;
            return rest;
          });
    } else {
      const by =
        body.view === 'by_program'
          ? 'program'
          : body.view === 'by_funder'
            ? 'funder'
            : 'org';
      outputRows = aggregateBy(rows, by);
      columns = aggregatedColumns(body.view);
    }

    if (outputRows.length > 100_000) {
      return err(c, 413, 'request_too_large', 'report_too_large');
    }

    const buffer =
      body.format === 'csv'
        ? toCsv(outputRows, columns, { bom: true })
        : await toXlsx(outputRows, columns, { sheetName: 'Training Report' });

    const run = await c.var.db.reportRun.create({
      data: {
        tenantId: body.tenantIds?.length === 1 ? body.tenantIds[0] : null,
        reportType: 'training',
        filters: body as object,
        rowCount: outputRows.length,
        format: body.format,
        generatedBy: c.var.userId,
      },
    });

    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'training',
        rowCount: outputRows.length,
        filterDigest: JSON.stringify({
          start: body.start,
          end: body.end,
          scope: body.scope,
          view: body.view,
          counties: body.counties ?? [],
          funders: body.funders ?? [],
          orgIds: body.orgIds ?? [],
          tenantIds: body.tenantIds ?? [],
          includeNames: body.includeNames,
          format: body.format,
        }),
      },
    });

    const filename = `training-report-${body.start}-${body.end}.${body.format}`;
    c.header('Content-Type', FORMAT_MIME[body.format]);
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('X-Row-Count', String(outputRows.length));
    c.header('X-Run-Id', run.id);
    return c.body(buffer as unknown as ArrayBuffer);
  },
);
