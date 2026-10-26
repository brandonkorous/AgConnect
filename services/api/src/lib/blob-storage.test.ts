import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.AZURE_STORAGE_ACCOUNT = 'stagconntest';
process.env.AZURE_STORAGE_KEY = Buffer.alloc(64, 1).toString('base64');
const { isAllowedEvidenceType, isAllowedPhotoType, jobPhotoUrl, signCertUrl } = await import('./blob-storage.js');

test('a job photo key becomes a one-hour, read-only SAS URL on its private container', () => {
  const url = new URL(jobPhotoUrl('t1/j1/abc.jpg'));
  assert.equal(url.host, 'stagconntest.blob.core.windows.net');
  assert.equal(url.pathname, '/job-photos/t1/j1/abc.jpg');
  assert.equal(url.searchParams.get('sp'), 'r');
  const expires = Date.parse(url.searchParams.get('se')!);
  assert.ok(expires > Date.now() + 55 * 60_000 && expires < Date.now() + 65 * 60_000);
});

test('a row that still holds a full URL is passed through', () => {
  assert.equal(jobPhotoUrl('https://old.example/x.jpg'), 'https://old.example/x.jpg');
});

test('certificates sign against the certs container', async () => {
  assert.match(await signCertUrl('t1/e1/c1.pdf'), /^https:\/\/stagconntest\.blob\.core\.windows\.net\/certs\/t1\/e1\/c1\.pdf\?/);
});

test('content types are checked against the allow-lists only', () => {
  assert.equal(isAllowedPhotoType('image/JPEG'), true);
  assert.equal(isAllowedPhotoType('application/pdf'), false);
  assert.equal(isAllowedPhotoType('toString'), false);
  assert.equal(isAllowedEvidenceType('application/pdf'), true);
});
