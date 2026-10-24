// Any /api path without its own route answers 404 JSON, so stray POSTs (scanner
// server-action probes) never fall through to the prerendered not-found page.
export const dynamic = 'force-dynamic';

function notFound(): Response {
    return Response.json({ ok: false, error: { code: 'not_found' } }, { status: 404 });
}

export const GET = notFound;
export const HEAD = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const OPTIONS = notFound;
