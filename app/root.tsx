import { StyleProvider } from "@ant-design/cssinjs";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { useLang, useT } from "./i18n";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={useLang()}>
      <head>
        {/* Must be the first stylesheet: fixes the cascade-layer order before
            antd (which prepends its <style> tags) or Tailwind declare layers.
            The rc attributes keep antd's client-side inserts after it. */}
        <style data-rc-order="prependQueue" data-rc-priority="-1000">
          {"@layer theme, base, antd, components, utilities;"}
        </style>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // antd styles go in `@layer antd` (ordered in app.css) so Tailwind
  // utilities win over antd's global resets such as its blue `a` colour.
  return (
    <StyleProvider layer>
      <Outlet />
    </StyleProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = useT();
  let message = t("error");
  let details = t("somethingWentWrong");
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : t("error");
    details =
      error.status === 404
        ? t("theRequestedPageCouldNotBeFound")
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
