import { env } from "cloudflare:workers";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import idID from "antd/locale/id_ID";
import { data, Outlet } from "react-router";

import { SiteFooter, SiteHeader } from "../components/site-header";
import { isLang, useLang } from "../i18n";
import { getCurrentUser } from "../lib/auth/session.server";
import { useSessionEmail } from "../lib/auth/use-session-email";
import type { Route } from "./+types/lang-layout";

const antdLocales = { en: enUS, id: idID };

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!isLang(params.lang)) throw data(null, { status: 404 });
  const user = await getCurrentUser(request, env);
  return { email: user?.email ?? null };
}

export default function LangLayout() {
  const lang = useLang();
  const email = useSessionEmail();
  return (
    <ConfigProvider
      locale={antdLocales[lang]}
      theme={{
        token: {
          colorPrimary: "#E8392B",
          borderRadius: 12,
          fontFamily:
            "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
        },
      }}
    >
      <div className="flex min-h-screen flex-col bg-[#F4F5F7] text-[#1F2937]">
        <SiteHeader email={email} />
        <div className="flex-1">
          <Outlet />
        </div>
        <SiteFooter email={email} />
      </div>
    </ConfigProvider>
  );
}
