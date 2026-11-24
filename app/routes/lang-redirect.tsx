import { redirect } from "react-router";

import { pickLang } from "../i18n";
import type { Route } from "./+types/lang-redirect";

export function loader({ request }: Route.LoaderArgs) {
  return redirect(`/${pickLang(request)}`);
}
