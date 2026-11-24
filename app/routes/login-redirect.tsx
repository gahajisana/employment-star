import { redirect } from "react-router";

import { pickLang } from "../i18n";
import type { Route } from "./+types/login-redirect";

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  return redirect(`/${pickLang(request)}/login${url.search}`);
}
