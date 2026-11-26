import { env } from "cloudflare:workers";

import { getCurrentUser } from "../../../lib/auth/session.server";
import type { Route } from "./+types/session";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request, env);

  return Response.json(
    {
      authenticated: Boolean(user),
      user: user
        ? {
            id: user.id,
            email: user.email,
            preferredLang: user.preferredLang,
          }
        : null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
