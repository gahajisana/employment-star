export const API_ERROR_CODES = {
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_CODE: "INVALID_CODE",
  RATE_LIMITED: "RATE_LIMITED",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_INVALID: "OTP_INVALID",
  OTP_TOO_MANY_ATTEMPTS: "OTP_TOO_MANY_ATTEMPTS",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 405 | 429 | 500 | 502;

export type ApiSuccess<TData = Record<never, never>> = { ok: true } & TData;

export type ApiError<
  TStatus extends ApiErrorStatus = ApiErrorStatus,
  TCode extends ApiErrorCode = ApiErrorCode,
  TExtra = Record<never, never>,
> = {
  ok: false;
  status: TStatus;
  code: TCode;
} & TExtra;

export type ApiResult<
  TData = Record<never, never>,
  TStatus extends ApiErrorStatus = ApiErrorStatus,
  TCode extends ApiErrorCode = ApiErrorCode,
  TExtra = Record<never, never>,
> = ApiSuccess<TData> | ApiError<TStatus, TCode, TExtra>;

/** Builds a typed success API payload. */
export function apiOk<TData extends Record<string, unknown>>(
  data: TData,
): ApiSuccess<TData> {
  return { ok: true, ...data };
}

/** Builds a typed error API payload with HTTP status, universal error code, and optional metadata. */
export function apiError<
  TStatus extends ApiErrorStatus,
  TCode extends ApiErrorCode = ApiErrorCode,
>(status: TStatus, code: TCode): ApiError<TStatus, TCode>;
export function apiError<
  TStatus extends ApiErrorStatus,
  TCode extends ApiErrorCode,
  TExtra extends Record<string, unknown>,
>(
  status: TStatus,
  code: TCode,
  extra: TExtra,
): ApiError<TStatus, TCode, TExtra>;
export function apiError(
  status: ApiErrorStatus,
  code: ApiErrorCode,
  extra?: Record<string, unknown>,
) {
  return {
    ok: false,
    status,
    code,
    ...extra,
  };
}
