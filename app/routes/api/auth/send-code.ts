import { env } from "cloudflare:workers";

import { createDb } from "../../../db/index.server";
import { requestEmailOtp } from "../../../lib/auth/otp.server";
import { resolveSessionSecret } from "../../../lib/auth/session.server";
import { createEmailProvider } from "../../../lib/email/index.server";
import {
  methodNotAllowedResponse,
  parseActionBody,
  respondWithApiResult,
} from "../../../lib/http/request.server";
import type { Route } from "./+types/send-code";

export function loader() {
  return methodNotAllowedResponse();
}

export async function action({ request }: Route.ActionArgs) {
  const body = await parseActionBody(request);
  const email = body.email ?? "";
  const lang = body.lang;

  const db = createDb(env.DB);
  const otpSecret = resolveSessionSecret(env);
  const emailProvider = createEmailProvider(env);

  const result = await requestEmailOtp(
    { db, emailProvider, otpSecret },
    { email, lang },
  );

  return respondWithApiResult(request, result);
}
