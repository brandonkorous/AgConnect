export type ToastHint = 'error' | 'warning' | 'info' | false;

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type ApiErr = {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    toast?: ToastHint;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export const isOk = <T>(r: ApiResponse<T>): r is ApiOk<T> => r.ok === true;
export const isErr = <T>(r: ApiResponse<T>): r is ApiErr => r.ok === false;
