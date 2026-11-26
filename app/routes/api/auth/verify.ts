import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { createDb } from "../../../db/index.server";
import { DEFAULT_LANG, isLang } from "../../../i18n";
import { verifyEmailOtp } from "../../../lib/auth/otp.server";
import {
  createUserSessionHeader,
  resolveSessionSecret,
} from "../../../lib/auth/session.server";
import { apiOk } from "../../../lib/http/api-result";
import {
  methodNotAllowedResponse,
  parseActionBody,
  respondWithApiResult,
  sanitizeRedirectTo,
  wantsJsonResponse,
} from "../../../lib/http/request.server";
import type { Route } from "./+types/verify";

export function loader() {
  return methodNotAllowedResponse();
}

export async function action({ request }: Route.ActionArgs) {
  const body = await parseActionBody(request);
  const email = body.email ?? "";
  const code = body.code ?? "";
  const lang = isLang(body.lang) ? body.lang : DEFAULT_LANG;

  const db = createDb(env.DB);
  const otpSecret = resolveSessionSecret(env);

  const result = await verifyEmailOtp({ db, otpSecret }, { email, code, lang });

  if (!result.ok) {
    return respondWithApiResult(request, result);
  }

  const sessionCookie = await createUserSessionHeader(
    request,
    env,
    result.user.id,
  );
  const destination = sanitizeRedirectTo(body.redirectTo, `/${lang}`);

  if (wantsJsonResponse(request)) {
    return Response.json(
      apiOk({
        user: {
          id: result.user.id,
          email: result.user.email,
        },
        redirectTo: destination,
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie,
        },
      },
    );
  }

  return redirect(destination, {
    headers: {
      "Set-Cookie": sessionCookie,
    },
  });
}
