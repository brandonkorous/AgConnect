# 11 — App Shell: API Surface

This file specifies the **error envelope contract** that every Hono endpoint emits, and the **typed API client** that consumes it. The contract is the single most important deliverable in this folder — it determines how every feature handles failure.

## Error envelope

Every JSON response from the API uses a discriminated union:

```ts
// packages/api-client/src/envelope.ts
export type ApiOk<T> = { ok: true; data: T };

export type ApiErr = {
    ok: false;
    error: {
        code: string;                        // snake_case stable identifier
        message: string;                     // localized human-readable
        fields?: Record<string, string>;     // form field → localized error message
        toast?: 'error' | 'warning' | 'info' | false;  // hint for the API client
        details?: Record<string, unknown>;   // structured context (correlation id, etc.)
    };
};

export type ApiResponse<T> = ApiOk<T> | ApiErr;
```

Rules:

- **`code`** is stable. Renaming a code is a breaking API change and must update the i18n catalog and any client `switch (code)` blocks.
- **`message`** is localized server-side using the `Accept-Language` header (which the client sets from the active locale — see [04-i18n](../04-i18n/)). The server falls back to English if the locale is missing.
- **`fields`** is the only correct way to attach errors to specific form fields. Keys are dotted paths matching the request body shape (e.g., `"profile.email"`).
- **`toast`** is a **hint**, not a hard requirement. The default is `'error'` for 5xx and `false` for 4xx (the form/page is expected to render the field/page error inline). Endpoints can override (e.g., a 4xx that should still toast: `toast: 'warning'`).
- **`details`** is for the client log / Sentry breadcrumb only. Never render it.

Every successful response wraps payload in `data`:

```ts
// good
return c.json<ApiOk<Job>>({ ok: true, data: job });

// bad — bare payload
return c.json(job);
```

> **Inferred:** Wrapping success in `{ ok: true, data }` rather than returning the bare payload trades 8 bytes of JSON overhead for an enormous TypeScript win — `ApiResponse<T>` is a pure discriminated union, so `if (!res.ok)` narrows `res.error` and `res.data` correctly without runtime guards. The cost is non-negotiable in our experience.

## Standard error codes

These are the cross-cutting codes every domain inherits. Domain-specific codes (e.g., `flc_already_verified`) live in their own feature folders.

| code              | http | meaning                                                               | default toast |
| ----------------- | ---- | --------------------------------------------------------------------- | ------------- |
| `unauthenticated` | 401  | No session                                                            | `error`       |
| `forbidden`       | 403  | Authenticated but not allowed                                         | `error`       |
| `no_tenant`       | 403  | Auth resolved but no tenant — see [01-multi-tenancy](../01-multi-tenancy/) | `error`       |
| `tenant_disabled` | 403  | Tenant soft-deleted                                                   | `error`       |
| `not_found`       | 404  | Resource not found (or RLS-hidden)                                    | `false`       |
| `validation_failed` | 422 | Request body did not match the zod schema; populates `fields`        | `false`       |
| `rate_limited`    | 429  | Per-endpoint or per-IP throttled                                      | `warning`     |
| `conflict`        | 409  | Idempotency or state conflict                                         | `warning`     |
| `internal_error`  | 500  | Unhandled exception; correlation id in `details.correlationId`        | `error`       |
| `service_unavailable` | 503 | Upstream (Twilio, Stripe, Resend, Anthropic) failed                | `error`       |
| `offline`         | 0    | Client-side only: fetch threw a transport error                       | `warning`     |
| `aborted`         | 0    | Client-side only: request aborted via AbortController                 | `false`       |

`offline` and `aborted` never come from the server. The API client synthesizes them when `fetch` itself rejects.

## Hono helpers

Every router uses helpers from `packages/api-client/src/server.ts` so the envelope shape can never drift:

```ts
// packages/api-client/src/server.ts
import type { Context } from 'hono';

export const ok = <T>(c: Context, data: T, status = 200) =>
    c.json({ ok: true, data }, status);

export const err = (
    c: Context,
    status: number,
    code: string,
    message: string,
    extra?: { fields?: Record<string, string>; toast?: ApiErr['error']['toast']; details?: Record<string, unknown> },
) => c.json({ ok: false, error: { code, message, ...extra } }, status);
```

Endpoint usage:

```ts
// apps/api/src/domains/worker/routes.ts
import { ok, err } from '@agconn/api-client/server';

worker.get('/me', async (c) => {
    const profile = await c.var.db.workerProfile.findUnique({ where: { userId: c.var.userId } });
    if (!profile) return err(c, 404, 'not_found', c.var.t('shell.error.profile_not_found'));
    return ok(c, profile);
});
```

`c.var.t` is the request-scoped translator wired by the i18n middleware (see [04-i18n](../04-i18n/)).

## Validation errors

A failed zod parse on the request body is auto-converted by the `validate` middleware:

```ts
// packages/api-client/src/server.ts
import { ZodError } from 'zod';

export const validate = <S extends z.ZodTypeAny>(schema: S) =>
    createMiddleware(async (c, next) => {
        const body = await c.req.json().catch(() => ({}));
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            const fields: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                fields[issue.path.join('.')] = c.var.t(`shell.validation.${issue.code}`, { ...issue });
            }
            return err(c, 422, 'validation_failed', c.var.t('shell.error.validation_failed'), { fields });
        }
        c.set('body', parsed.data);
        return next();
    });
```

So every endpoint with a body declaration gets consistent `fields` errors for free.

## Unhandled exceptions

A top-level Hono error handler ensures **no endpoint can leak a non-envelope response**:

```ts
// apps/api/src/index.ts
api.onError((e, c) => {
    const correlationId = crypto.randomUUID();
    c.var.log.error({ err: e, correlationId }, 'unhandled exception');
    if (e instanceof HTTPException) {
        return err(c, e.status, e.code ?? 'internal_error', e.message, { details: { correlationId } });
    }
    return err(c, 500, 'internal_error', c.var.t('shell.error.internal_error'), { details: { correlationId } });
});
```

The correlation id is also written to a Sentry breadcrumb and to the audit log (see [12-audit-log/03-api.md](../12-audit-log/03-api.md) — `error.unhandled` action).

## Client API: `apiClient`

The client wraps `fetch` and returns the discriminated union. It never throws on 4xx/5xx. It does throw on transport failures, which it catches internally and converts to `{ ok: false, error: { code: 'offline' | 'aborted', ... } }`.

```ts
// packages/api-client/src/client.ts
type ApiClientOptions = {
    baseUrl: string;
    getLocale: () => 'en' | 'es';
    getSession?: () => string | null;
    onUnhandledError?: (err: ApiErr['error']) => void;  // toast hook
};

export type RequestOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
    headers?: Record<string, string>;
    handleErrorInline?: boolean;        // suppress auto-toast
    timeoutMs?: number;                 // default 15000
};

export const createApiClient = (opts: ApiClientOptions) => {
    async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort('timeout'), options.timeoutMs ?? 15_000);
        const signal = options.signal ?? ctrl.signal;

        try {
            const res = await fetch(buildUrl(opts.baseUrl, path, options.query), {
                method: options.method ?? 'GET',
                headers: {
                    'content-type': 'application/json',
                    'accept-language': opts.getLocale(),
                    ...(opts.getSession?.() ? { authorization: `Bearer ${opts.getSession()}` } : {}),
                    ...options.headers,
                },
                body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
                signal,
                credentials: 'include',
            });

            const json = await res.json().catch(() => ({}));
            const envelope = json as ApiResponse<T>;

            if (!envelope.ok && !options.handleErrorInline && envelope.error.toast !== false) {
                opts.onUnhandledError?.(envelope.error);
            }
            return envelope;
        } catch (e: unknown) {
            const code = isAbortError(e) ? 'aborted' : 'offline';
            const error: ApiErr['error'] = {
                code,
                message: code === 'offline' ? 'shell.error.offline' : 'shell.error.aborted',
                toast: code === 'offline' ? 'warning' : false,
            };
            if (!options.handleErrorInline && error.toast !== false) opts.onUnhandledError?.(error);
            return { ok: false, error };
        } finally {
            clearTimeout(timer);
        }
    }

    return {
        get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
        post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
        patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
        put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
        del: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
    };
};
```

> **Inferred:** Cookie-based session via `credentials: 'include'` is the default since Clerk uses cookie sessions for server components in Next 15. The optional `Bearer` header path covers future React Native or external API consumers.

## React integration

A single provider wires the client into React with the toast hook:

```tsx
// packages/api-client/src/provider.tsx
'use client';
import { createContext, useContext, useMemo } from 'react';
import { useToast } from '@agconn/ui';
import { useTranslations, useLocale } from 'next-intl';

const ApiContext = createContext<ReturnType<typeof createApiClient> | null>(null);

export function ApiProvider({ children, baseUrl }: { children: React.ReactNode; baseUrl: string }) {
    const toast = useToast();
    const t = useTranslations('shell');
    const locale = useLocale() as 'en' | 'es';

    const client = useMemo(
        () =>
            createApiClient({
                baseUrl,
                getLocale: () => locale,
                onUnhandledError: (e) => {
                    const variant = e.toast === false ? null : e.toast ?? 'error';
                    if (!variant) return;
                    toast({
                        variant,
                        title: t(`error.${e.code}.title`, { default: e.message }),
                        description: t(`error.${e.code}.description`, { default: '' }),
                    });
                },
            }),
        [baseUrl, locale, t, toast],
    );

    return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export const useApi = () => {
    const c = useContext(ApiContext);
    if (!c) throw new Error('useApi outside ApiProvider');
    return c;
};
```

Feature usage stays terse:

```tsx
const api = useApi();
const res = await api.post<Application>('/v1/applications', { jobId });
if (!res.ok) {
    if (res.error.code === 'rate_limited') return; // toast already showed
    if (res.error.fields) form.setErrors(res.error.fields);
    return;
}
toast({ variant: 'success', title: t('application.submitted') });
router.push(`/applications/${res.data.id}`);
```

## Server-component fetching

Server components and route handlers do not use `apiClient` — they call repos directly via Prisma. The error envelope is the boundary contract; in-process calls are typed by the repo signature. This keeps server components fast and avoids a self-loopback HTTP call.

> **Inferred:** Some teams reflexively wrap every data access in HTTP. We don't. Server components in Next 15 should call `db.workerProfile.findUnique(...)` directly. The envelope is for the network boundary only.

## Errors

| code              | http | when                                                             |
| ----------------- | ---- | ---------------------------------------------------------------- |
| `unauthenticated` | 401  | Any handler-level `requireAuth` middleware fails                 |
| `forbidden`       | 403  | Role check fails                                                 |
| `validation_failed` | 422 | `validate(schema)` middleware rejects body                     |
| `internal_error`  | 500  | Top-level `onError` handler caught an unhandled throw            |
| `service_unavailable` | 503 | Upstream wrapper (Twilio/Stripe/Resend/Anthropic) classified as 5xx |
