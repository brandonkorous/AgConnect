import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { FORMAT_MIME, toCsv, toXlsx } from '@agconn/reporting';
import { ParticipantPepperMissingError } from '@agconn/reporting';
import { enqueueGrantReportEmail } from '@agconn/email';
import { adminMiddleware, type AdminVars } from '../../middleware/adminContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  signGrantReportUrl,
  uploadGrantReport,
} from '../../lib/supabase-storage.js';
import { placementColumns, runPlacementReport } from './placement.js';
import {
  placementExportBody,
  placementReportQuery,
  reportRunsQuery,
} from './schemas.js';

export const adminReportsRoutes = new Hono<{ Variables: AdminVars & AuditCtxVars }>();

adminReportsRoutes.use('*', adminMiddleware('admin'));

adminReportsRoutes.get(
  '/placement/preview',
  validate('query', placementReportQuery),
  async (c) => {
    const q = c.var.body;
    try {
      const rows = await runPlacementReport(c.var.db, q);
      const columns = placementColumns(q.includeNames);
      return ok(c, {
        rows: rows.slice(0, q.preview),
        totalCount: rows.length,
        columns,
      });
    } catch (e) {
      if (e instanceof ParticipantPepperMissingError) {
        return err(c, 500, 'internal_server_error', 'Participant ID pepper not configured');
      }
      throw e;
    }
  },
);

adminReportsRoutes.post(
  '/placement/export',
  validate('json', placementExportBody),
  async (c) => {
    const body = c.var.body;
    let rows;
    try {
      rows = await runPlacementReport(c.var.db, body);
    } catch (e) {
      if (e instanceof ParticipantPepperMissingError) {
        return err(c, 500, 'internal_server_error', 'Participant ID pepper not configured');
      }
      throw e;
    }

    if (rows.length > 100_000) {
      return err(c, 413, 'request_too_large', 'report_too_large');
    }

    const columns = placementColumns(body.includeNames);
    const buffer =
      body.format === 'csv'
        ? toCsv(rows, columns, { bom: true })
        : await toXlsx(rows, columns, { sheetName: 'Placement Report' });

    const run = await c.var.db.reportRun.create({
      data: {
        tenantId: body.tenantIds?.length === 1 ? body.tenantIds[0] : null,
        reportType: 'placement',
        filters: body as object,
        rowCount: rows.length,
        format: body.format,
        generatedBy: c.var.userId,
      },
    });

    let blobPath: string | null = null;
    try {
      blobPath = await uploadGrantReport({
        runId: run.id,
        reportType: 'placement',
        format: body.format,
        contentType: FORMAT_MIME[body.format],
        body: buffer,
      });
      await c.var.db.reportRun.update({
        where: { id: run.id },
        data: { blobPath },
      });
    } catch (e) {
      console.error('[reports] archive upload failed', {
        runId: run.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    await c.var.audit.log({
      action: 'admin.data.exported',
      metadata: {
        exportType: 'placement',
        rowCount: rows.length,
        filterDigest: JSON.stringify({
          start: body.start,
          end: body.end,
          counties: body.counties ?? [],
          funders: body.funders ?? [],
          tenantIds: body.tenantIds ?? [],
          includeNames: body.includeNames,
          format: body.format,
          emailDelivery: body.email ? 'true' : 'false',
        }),
      },
    });

    if (body.email) {
      if (!blobPath) {
        return err(c, 500, 'internal_server_error', 'archive_failed');
      }
      const downloadUrl = await signGrantReportUrl(blobPath, 24 * 60 * 60);
      await enqueueGrantReportEmail({
        template: 'grant.report_ready',
        reportRunId: run.id,
        to: body.email,
        locale: 'en',
        vars: {
          reportName: 'Placement Report',
          dateRange: `${body.start} to ${body.end}`,
          rowCount: rows.length,
          downloadUrl,
        },
        idempotencyKey: `grant-report-${run.id}-${body.email}`,
      });
      return ok(c, { status: 'queued', runId: run.id, rowCount: rows.length });
    }

    const filename = `placement-report-${body.start}-${body.end}.${body.format}`;
    c.header('Content-Type', FORMAT_MIME[body.format]);
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('X-Row-Count', String(rows.length));
    c.header('X-Run-Id', run.id);
    return c.body(buffer as unknown as ArrayBuffer);
  },
);

adminReportsRoutes.get('/runs', validate('query', reportRunsQuery), async (c) => {
  const q = c.var.body;
  const where: Record<string, unknown> = {};
  if (q.reportType) where.reportType = q.reportType;
  if (q.from || q.to) {
    where.generatedAt = {
      ...(q.from ? { gte: new Date(q.from) } : {}),
      ...(q.to ? { lte: new Date(q.to) } : {}),
    };
  }

  const runs = await c.var.db.reportRun.findMany({
    where,
    orderBy: { generatedAt: 'desc' },
    take: q.limit,
  });

  return ok(c, {
    runs: runs.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      reportType: r.reportType,
      filters: r.filters,
      rowCount: r.rowCount,
      format: r.format,
      generatedBy: r.generatedBy,
      generatedAt: r.generatedAt.toISOString(),
      hasArchive: r.blobPath !== null,
    })),
  });
});

adminReportsRoutes.get('/runs/:id/download', async (c) => {
  const id = c.req.param('id');
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return err(c, 422, 'validation_failed', 'Invalid run id');
  }

  const run = await c.var.db.reportRun.findUnique({ where: { id } });
  if (!run) return err(c, 404, 'not_found');
  if (!run.blobPath) {
    return err(c, 410, 'gone', 'archive_unavailable');
  }

  const url = await signGrantReportUrl(run.blobPath, 5 * 60);

  await c.var.audit.log({
    action: 'admin.data.exported',
    metadata: {
      exportType: 're_download',
      rowCount: run.rowCount,
      filterDigest: JSON.stringify({ runId: run.id, reportType: run.reportType }),
    },
  });

  return ok(c, { url, expiresIn: 300 });
});
