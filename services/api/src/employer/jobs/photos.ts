// Job photo subroutes: list / upload / reorder / delete.
//
// All uploads pass through the API — the web app never touches Supabase
// directly. Multipart bodies max 10MB per file; bucket allows JPG/PNG/WEBP/HEIC.

import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { PhotoReorderBody } from '@agconn/schemas';
import { requireAuth, requireActiveEmployer, requireEmployerPermission, requireTenant, type AuthVars } from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import {
  uploadJobPhoto,
  deleteJobPhoto,
  isAllowedPhotoType,
} from '../../lib/supabase-storage.js';

const MAX_PHOTOS_PER_JOB = 6;
const MAX_BYTES = 10 * 1024 * 1024;

export const employerJobPhotosRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerJobPhotosRoutes.use('*', requireAuth('employer'));
employerJobPhotosRoutes.use('*', requireActiveEmployer);
employerJobPhotosRoutes.use('*', requireTenant);

employerJobPhotosRoutes.get('/:id/photos', requireEmployerPermission('jobs.read'), async (c) => {
  const id = c.req.param('id');
  const employerId = c.var.employerId!;
  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId, deletedAt: null },
    select: { id: true },
  });
  if (!job) return err(c, 404, 'not_found');

  const photos = await c.var.db.jobPhoto.findMany({
    where: { jobId: id },
    orderBy: { sortOrder: 'asc' },
  });
  return ok(c, { photos: photos.map(toPhotoView) });
});

employerJobPhotosRoutes.post('/:id/photos', requireEmployerPermission('jobs.write'), async (c) => {
  const id = c.req.param('id');
  const userId = c.var.userId;
  const employerId = c.var.employerId!;
  const tenantId = c.var.tenantId!;

  const job = await c.var.db.jobPosting.findFirst({
    where: { id, employerId, deletedAt: null },
    select: { id: true, tenantId: true },
  });
  if (!job) return err(c, 404, 'not_found');

  const existingCount = await c.var.db.jobPhoto.count({ where: { jobId: id } });
  if (existingCount >= MAX_PHOTOS_PER_JOB) {
    return err(c, 422, 'validation_failed', 'photo_limit_reached');
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return err(c, 400, 'invalid_body');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return err(c, 400, 'invalid_body', 'missing_file');
  if (file.size > MAX_BYTES) return err(c, 413, 'payload_too_large');
  if (!isAllowedPhotoType(file.type)) return err(c, 415, 'unsupported_media_type');

  const buf = Buffer.from(await file.arrayBuffer());
  const upload = await uploadJobPhoto({
    tenantId,
    jobId: id,
    fileName: file.name || 'photo',
    contentType: file.type,
    body: buf,
  });

  const photo = await c.var.db.jobPhoto.create({
    data: {
      tenantId,
      jobId: id,
      url: upload.publicUrl,
      storageKey: upload.storageKey,
      sortOrder: existingCount,
      uploadedById: userId,
    },
  });

  await c.var.audit.log({
    action: 'job.photo.uploaded',
    resourceId: id,
    metadata: { photoId: photo.id, bytes: file.size },
  });

  return ok(c, { photo: toPhotoView(photo) });
});

employerJobPhotosRoutes.put(
  '/:id/photos/order',
  requireEmployerPermission('jobs.write'),
  validate('json', PhotoReorderBody),
  async (c) => {
    const id = c.req.param('id');
    const employerId = c.var.employerId!;
    const body = c.var.body;

    const job = await c.var.db.jobPosting.findFirst({
      where: { id, employerId, deletedAt: null },
      select: { id: true },
    });
    if (!job) return err(c, 404, 'not_found');

    const photos = await c.var.db.jobPhoto.findMany({
      where: { jobId: id },
      select: { id: true },
    });
    const owned = new Set(photos.map((p) => p.id));
    if (body.order.length !== owned.size || body.order.some((p) => !owned.has(p))) {
      return err(c, 422, 'validation_failed', 'order_mismatch');
    }

    await c.var.db.$transaction(
      body.order.map((photoId, idx) =>
        c.var.db.jobPhoto.update({
          where: { id: photoId },
          data: { sortOrder: idx },
        }),
      ),
    );
    return ok(c, { ok: true });
  },
);

employerJobPhotosRoutes.delete('/:id/photos/:photoId', requireEmployerPermission('jobs.write'), async (c) => {
  const id = c.req.param('id');
  const photoId = c.req.param('photoId');
  const employerId = c.var.employerId!;

  const photo = await c.var.db.jobPhoto.findFirst({
    where: { id: photoId, jobId: id, job: { employerId, deletedAt: null } },
  });
  if (!photo) return err(c, 404, 'not_found');

  await c.var.db.jobPhoto.delete({ where: { id: photoId } });
  await deleteJobPhoto(photo.storageKey).catch((e) => {
    console.warn('[photos] storage delete failed (will be reaped)', e);
  });

  await c.var.audit.log({
    action: 'job.photo.deleted',
    resourceId: id,
    metadata: { photoId },
  });

  return ok(c, { ok: true });
});

function toPhotoView(p: {
  id: string;
  url: string;
  captionEn: string | null;
  captionEs: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
}) {
  return {
    id: p.id,
    url: p.url,
    captionEn: p.captionEn,
    captionEs: p.captionEs,
    width: p.width,
    height: p.height,
    sortOrder: p.sortOrder,
  };
}
