import { env } from "cloudflare:workers";
import { redirect } from "react-router";

import { destroyUserSessionHeader } from "../../../lib/auth/session.server";
import { apiOk } from "../../../lib/http/api-result";
import {
  methodNotAllowedResponse,
  parseActionBody,
  sanitizeRedirectTo,
  wantsJsonResponse,
} from "../../../lib/http/request.server";
import type { Route } from "./+types/logout";

export function loader() {
  return methodNotAllowedResponse();
}

export async function action({ request }: Route.ActionArgs) {
  const body = await parseActionBody(request);
  const clearedCookie = await destroyUserSessionHeader(request, env);

  if (wantsJsonResponse(request)) {
    return Response.json(apiOk({}), {
      status: 200,
      headers: {
        "Set-Cookie": clearedCookie,
      },
    });
  }

  const destination = sanitizeRedirectTo(body.redirectTo, "/login");
  return redirect(destination, {
    headers: {
      "Set-Cookie": clearedCookie,
    },
  });
}
