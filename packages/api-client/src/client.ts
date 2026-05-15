import type { ApiErr, ApiResponse } from './envelope.js';

export type ApiClientOptions = {
  baseUrl: string;
  getLocale: () => 'en' | 'es';
  getSession?: () => string | null | Promise<string | null>;
  onUnhandledError?: (err: ApiErr['error']) => void;
};

type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | QueryPrimitive[] | undefined;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  handleErrorInline?: boolean;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

const isAbortError = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { name?: string }).name === 'AbortError';

const buildUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, QueryValue>,
): string => {
  const trimmed = baseUrl.replace(/\/$/, '');
  const url = `${trimmed}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) params.append(k, String(item));
    } else {
      params.append(k, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
};

export type ApiClient = {
  request: <T>(path: string, options?: RequestOptions) => Promise<ApiResponse<T>>;
  get: <T>(path: string, options?: RequestOptions) => Promise<ApiResponse<T>>;
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<ApiResponse<T>>;
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<ApiResponse<T>>;
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => Promise<ApiResponse<T>>;
  del: <T>(path: string, options?: RequestOptions) => Promise<ApiResponse<T>>;
};

export const createApiClient = (opts: ApiClientOptions): ApiClient => {
  async function request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const internalCtrl = new AbortController();
    const timer = setTimeout(
      () => internalCtrl.abort(new DOMException('timeout', 'AbortError')),
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    let signal: AbortSignal = internalCtrl.signal;
    if (options.signal) {
      const linker = new AbortController();
      const onAbort = () => linker.abort((options.signal as AbortSignal).reason);
      const onInternal = () => linker.abort(internalCtrl.signal.reason);
      options.signal.addEventListener('abort', onAbort, { once: true });
      internalCtrl.signal.addEventListener('abort', onInternal, { once: true });
      signal = linker.signal;
    }

    try {
      const session = await opts.getSession?.();
      const isFormData =
        typeof FormData !== 'undefined' && options.body instanceof FormData;
      const baseHeaders: Record<string, string> = {
        'accept-language': opts.getLocale(),
        ...(session ? { authorization: `Bearer ${session}` } : {}),
        ...options.headers,
      };
      // For multipart uploads, let the browser set Content-Type with the boundary.
      if (!isFormData) baseHeaders['content-type'] = 'application/json';
      const res = await fetch(buildUrl(opts.baseUrl, path, options.query), {
        method: options.method ?? 'GET',
        headers: baseHeaders,
        body:
          options.body === undefined
            ? undefined
            : isFormData
              ? (options.body as FormData)
              : JSON.stringify(options.body),
        signal,
        credentials: 'include',
      });

      const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;
      if (json && typeof json === 'object' && 'ok' in json) {
        if (json.ok === false && !options.handleErrorInline && json.error.toast !== false) {
          opts.onUnhandledError?.(json.error);
        }
        return json;
      }

      const fallback: ApiResponse<T> = {
        ok: false,
        error: {
          code: 'internal_error',
          message: `Unexpected response shape (HTTP ${res.status})`,
          toast: 'error',
        },
      };
      if (!options.handleErrorInline) opts.onUnhandledError?.(fallback.error);
      return fallback;
    } catch (e: unknown) {
      const code = isAbortError(e) ? 'aborted' : 'offline';
      const env: ApiResponse<T> = {
        ok: false,
        error: {
          code,
          message: code === 'offline' ? "You're offline." : '',
          toast: code === 'offline' ? 'warning' : false,
        },
      };
      if (!options.handleErrorInline && env.error.toast !== false) {
        opts.onUnhandledError?.(env.error);
      }
      return env;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    request,
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    del: (path, options) => request(path, { ...options, method: 'DELETE' }),
  };
};
