import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { ImageResponse } from 'next/og.js';
import { loadFonts } from './fonts.ts';

const ALL = ['interTightBold', 'interTightSemi', 'interTightItalic', 'interSemi', 'interMed', 'dmMonoBold'];

test('loadFonts works with no network', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', () => Promise.reject(new Error('offline')));
  const fonts = await loadFonts(ALL);
  assert.equal(fonts.length, ALL.length);
  for (const f of fonts) assert.ok(f.data.byteLength > 10_000, `${f.name} ${f.weight} is empty`);
  assert.equal(fetchMock.mock.callCount(), 0);
  fetchMock.mock.restore();
});

test('parallel callers share one read per file', async () => {
  const [a, b] = await Promise.all([loadFonts(['interMed']), loadFonts(['interMed'])]);
  assert.equal(a[0].data, b[0].data);
});

test('Satori renders a PNG with every bundled font', async () => {
  const fonts = await loadFonts(ALL);
  const el = createElement('div', { style: { display: 'flex', fontFamily: 'Inter Tight' } }, 'Del campo, a tu futuro');
  const res = new ImageResponse(el, { width: 120, height: 63, fonts });
  const png = new Uint8Array(await res.arrayBuffer());
  assert.equal(res.headers.get('content-type'), 'image/png');
  assert.deepEqual([...png.slice(1, 4)], [0x50, 0x4e, 0x47]);
});
