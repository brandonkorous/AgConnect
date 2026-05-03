// Screening-question subroutes. List + bulk-replace (PUT) is the natural shape
// for a small ordered list edited inline on the form. Per-question PATCH/DELETE
// would force the UI to track per-row state for no UX win.

import { Hono } from 'hono';
import { z } from 'zod';
import { ok, err, validate } from '@agconn/api-client/server';
import { ScreeningQuestionInput } from '@agconn/schemas';
import { JobEditEventKind } from '@agconn/db';
import { requireAuth, requireRole, requireTenant, type AuthVars } from '../../middleware/authContext';
import type { AuditCtxVars } from '../../middleware/audit';

const ReplaceBody = z
  .object({
    questions: z.array(ScreeningQuestionInput).max(10),
  })
  .strict();

export const employerJobScreeningRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerJobScreeningRoutes.use('*', requireAuth);
employerJobScreeningRoutes.use('*', requireRole('employer'));
employerJobScreeningRoutes.use('*', requireTenant);

employerJobScreeningRoutes.get('/:id/screening-questions', async (c) => {
  const id = c.req.param('id');
  const userId = c.var.userId;
  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!job) return err(c, 404, 'not_found');

  const rows = await c.var.db.jobScreeningQuestion.findMany({
    where: { jobId: id },
    orderBy: { sortOrder: 'asc' },
  });
  return ok(c, { questions: rows.map(toView) });
});

employerJobScreeningRoutes.put(
  '/:id/screening-questions',
  validate('json', ReplaceBody),
  async (c) => {
    const id = c.req.param('id');
    const userId = c.var.userId;
    const tenantId = c.var.tenantId!;
    const body = c.var.body;

    const job = await c.var.db.jobPosting.findFirst({
      where: { id, employerId: userId, deletedAt: null },
      select: { id: true },
    });
    if (!job) return err(c, 404, 'not_found');

    const result = await c.var.db.$transaction(async (tx) => {
      // Replace strategy: delete-not-in + upsert. Cleaner than tracking diffs
      // and cheap at our cardinality (<=10 questions per job).
      const keepIds = body.questions
        .map((q) => q.id)
        .filter((x): x is string => typeof x === 'string');
      await tx.jobScreeningQuestion.deleteMany({
        where: { jobId: id, id: { notIn: keepIds.length ? keepIds : ['00000000-0000-0000-0000-000000000000'] } },
      });
      const written = await Promise.all(
        body.questions.map((q, idx) => {
          if (q.id) {
            return tx.jobScreeningQuestion.update({
              where: { id: q.id },
              data: {
                sortOrder: idx,
                questionEn: q.questionEn,
                questionEs: q.questionEs,
                answerType: q.answerType,
                required: q.required,
              },
            });
          }
          return tx.jobScreeningQuestion.create({
            data: {
              tenantId,
              jobId: id,
              sortOrder: idx,
              questionEn: q.questionEn,
              questionEs: q.questionEs,
              answerType: q.answerType,
              required: q.required,
            },
          });
        }),
      );

      await tx.jobEditEvent.create({
        data: {
          tenantId,
          jobId: id,
          actorUserId: userId,
          kind: JobEditEventKind.screening_changed,
          before: {},
          after: { count: written.length },
        },
      });

      return written;
    });

    await c.var.audit.log({
      action: 'job.screening.replaced',
      resourceId: id,
      metadata: { count: result.length },
    });

    return ok(c, { questions: result.map(toView) });
  },
);

function toView(q: {
  id: string;
  sortOrder: number;
  questionEn: string;
  questionEs: string;
  answerType: 'yes_no' | 'text';
  required: boolean;
}) {
  return {
    id: q.id,
    sortOrder: q.sortOrder,
    questionEn: q.questionEn,
    questionEs: q.questionEs,
    answerType: q.answerType,
    required: q.required,
  };
}
