import { useRouteLoaderData } from "react-router";

import type { loader } from "../../routes/lang-layout";

/** Signed-in email for any page under `/:lang`, or null for guests. */
export function useSessionEmail(): string | null {
  return useRouteLoaderData<typeof loader>("routes/lang-layout")?.email ?? null;
}
