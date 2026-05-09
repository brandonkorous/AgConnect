import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { Context } from 'hono';
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status';
import { z } from 'zod';

import type { ApiErr, ToastHint } from './envelope.js';
import {
  defaultMessageForCode,
  defaultToastForCode,
  type ErrorCode,
} from './errors.js';

export type ErrExtra = {
  fields?: Record<string, string>;
  toast?: ToastHint;
  details?: Record<string, unknown>;
};

export const ok = <T>(c: Context, data: T, status: ContentfulStatusCode = 200) =>
  c.json({ ok: true as const, data }, status);

export const err = (
  c: Context,
  status: ContentfulStatusCode,
  code: ErrorCode,
  message?: string,
  extra?: ErrExtra,
) => {
  const body: ApiErr = {
    ok: false,
    error: {
      code,
      message: message ?? defaultMessageForCode(code, 'An error occurred'),
      ...(extra?.fields ? { fields: extra.fields } : {}),
      ...(extra?.toast !== undefined
        ? { toast: extra.toast }
        : { toast: defaultToastForCode(code) }),
      ...(extra?.details ? { details: extra.details } : {}),
    },
  };
  return c.json(body, status);
};

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: 'validation_failed',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_failed',
  428: 'confirmation_required',
  429: 'rate_limited',
  500: 'internal_error',
  503: 'service_unavailable',
};

const mapHttpStatusToCode = (status: number): ErrorCode =>
  STATUS_TO_CODE[status] ?? 'internal_error';

const isContentfulStatus = (status: StatusCode): status is ContentfulStatusCode =>
  status !== 101 && status !== 204 && status !== 205 && status !== 304;

type ZodIssueLike = {
  path: ReadonlyArray<PropertyKey>;
  message: string;
};

const zodIssuesToFields = (issues: ReadonlyArray<ZodIssueLike>): Record<string, string> => {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
};

type ValidateTarget = 'json' | 'query' | 'param' | 'header' | 'cookie' | 'form';

type ParseSource<T extends ValidateTarget> = T extends 'json'
  ? Promise<unknown>
  : Record<string, string | string[]>;

const readSource = async <T extends ValidateTarget>(
  c: Context,
  target: T,
): Promise<ParseSource<T>> => {
  switch (target) {
    case 'json':
      return c.req.json().catch(() => ({})) as ParseSource<T>;
    case 'query': {
      // Hono's c.req.query() returns string-only values (last write wins for
      // repeats). For schemas that declare arrays, fold repeated keys into
      // arrays so consumers don't have to choose between scalar and array
      // shapes per parameter.
      const flat = c.req.query();
      const merged: Record<string, string | string[]> = { ...flat };
      for (const k of Object.keys(flat)) {
        const all = c.req.queries(k);
        if (all && all.length > 1) merged[k] = all;
      }
      return merged as ParseSource<T>;
    }
    case 'param':
      return c.req.param() as ParseSource<T>;
    case 'header':
      return c.req.header() as ParseSource<T>;
    case 'cookie':
      return ({} as Record<string, string>) as ParseSource<T>;
    case 'form':
      return ((await c.req.parseBody()) as Record<string, string>) as ParseSource<T>;
    default:
      return {} as ParseSource<T>;
  }
};

export type ValidatedVar<T> = { body: T };

export const validate = <Schema extends z.ZodTypeAny>(
  target: ValidateTarget,
  schema: Schema,
) =>
  createMiddleware<{ Variables: { body: z.output<Schema> } }>(async (c, next) => {
    const raw = await readSource(c, target);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const fields = zodIssuesToFields(parsed.error.issues as ReadonlyArray<ZodIssueLike>);
      return err(c, 422, 'validation_failed', defaultMessageForCode('validation_failed'), {
        fields,
      });
    }
    c.set('body', parsed.data);
    return next();
  });

export type OnErrorOptions = {
  log?: (info: { err: unknown; correlationId: string; status: number }) => void;
  onUnhandled?: (info: { err: unknown; correlationId: string }) => void | Promise<void>;
};

export const onErrorEnvelope = (opts: OnErrorOptions = {}) =>
  async (e: Error, c: Context) => {
    const existing = (c.var as { correlationId?: string }).correlationId;
    const correlationId = existing ?? crypto.randomUUID();

    if (e instanceof HTTPException) {
      const status = e.status;
      const contentful: ContentfulStatusCode = isContentfulStatus(status) ? status : 500;
      const code = mapHttpStatusToCode(contentful);
      opts.log?.({ err: e, correlationId, status: contentful });
      return err(c, contentful, code, e.message || defaultMessageForCode(code), {
        details: { correlationId },
      });
    }

    opts.log?.({ err: e, correlationId, status: 500 });
    if (opts.onUnhandled) {
      try {
        await opts.onUnhandled({ err: e, correlationId });
      } catch {
        // swallow — onUnhandled side-effect must never break the response
      }
    }
    return err(c, 500, 'internal_error', defaultMessageForCode('internal_error'), {
      details: { correlationId },
    });
  };
