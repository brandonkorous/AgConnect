#!/usr/bin/env node
// IndexNow ping for AGCONN — submits the marketing sitemap URLs to the
// IndexNow API on deploy. Powers Bing, Yandex, and downstream consumers
// (notably ChatGPT browse + Copilot, which lean on Bing's index).
//
// Required env:
//   INDEXNOW_KEY            32-char hex key
//   INDEXNOW_KEY_LOCATION   public URL of the key file, e.g. https://agconn.com/<key>.txt
//   SITE_URL                e.g. https://agconn.com
//
// The key file must be served verbatim at INDEXNOW_KEY_LOCATION and contain
// exactly INDEXNOW_KEY. See apps/web/public/indexnow-key.template.txt for
// the rotation procedure.

import process from 'node:process';

const SITE = (process.env.SITE_URL ?? 'https://agconn.com').replace(/\/$/, '');
const KEY = process.env.INDEXNOW_KEY;
const KEY_LOCATION = process.env.INDEXNOW_KEY_LOCATION;

if (!KEY || !KEY_LOCATION) {
    console.error('[indexnow] skipping — INDEXNOW_KEY or INDEXNOW_KEY_LOCATION missing');
    process.exit(0);
}

async function fetchSitemapUrls() {
    const res = await fetch(`${SITE}/sitemap.xml`);
    if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
    const xml = await res.text();
    return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
        .map((m) => m[1])
        .filter((u) => u.startsWith(SITE));
}

function chunk(arr, n) {
    const out = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
}

async function ping(host, urlList) {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
            host,
            key: KEY,
            keyLocation: KEY_LOCATION,
            urlList,
        }),
    });
    return { status: res.status, count: urlList.length };
}

async function main() {
    const host = new URL(SITE).host;
    const urls = await fetchSitemapUrls();
    if (urls.length === 0) {
        console.error('[indexnow] no URLs in sitemap');
        process.exit(0);
    }
    const batches = chunk(urls, 10_000);
    for (const batch of batches) {
        const result = await ping(host, batch);
        console.log(`[indexnow] ${host} ← ${result.count} urls (status ${result.status})`);
        if (result.status >= 400 && result.status !== 422) {
            // 422 = invalid key file; surface but don't fail deploy.
            process.exit(0);
        }
    }
}

main().catch((err) => {
    console.error('[indexnow] error', err.message);
    // Never fail deploy on IndexNow — it's a soft signal.
    process.exit(0);
});
