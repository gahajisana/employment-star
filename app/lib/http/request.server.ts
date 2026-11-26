import { data } from "react-router";

import { API_ERROR_CODES, apiError } from "./api-result";

/** Parses either JSON or FormData request payloads into a flat string record. */
export async function parseActionBody(
  request: Request,
): Promise<Record<string, string>> {
  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return {};
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return {};
    }
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "string") {
        result[key] = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        result[key] = String(value);
      }
    }
    return result;
  }

  const formData = await request.formData();
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

/** Returns true when caller explicitly asks for JSON rather than React Router navigation. */
export function wantsJsonResponse(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return (
    accept.includes("application/json") &&
    !accept.includes("text/html") &&
    !request.url.endsWith(".data")
  );
}

/** Ensures redirect targets stay within the same origin. */
export function sanitizeRedirectTo(
  value: string | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

/** Standard 405 response for mutation-only resource routes. */
export function methodNotAllowedResponse(): Response {
  return Response.json(apiError(405, API_ERROR_CODES.METHOD_NOT_ALLOWED), {
    status: 405,
  });
}

/** Formats an ApiResult as Response.json for JSON API clients or React Router data() for fetchers. */
export function respondWithApiResult<
  TResult extends { ok: true } | { ok: false; status: number },
>(request: Request, result: TResult) {
  const status = result.ok ? 200 : result.status;
  if (wantsJsonResponse(request)) {
    return Response.json(result, { status });
  }
  return data(result, { status });
}
