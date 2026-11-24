import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import idID from "antd/locale/id_ID";
import { data, Outlet } from "react-router";

import { isLang, useLang } from "../i18n";
import { LanguageSwitcher } from "../i18n/language-switcher";
import type { Route } from "./+types/lang-layout";

const antdLocales = { en: enUS, id: idID };

export function loader({ params }: Route.LoaderArgs) {
  if (!isLang(params.lang)) throw data(null, { status: 404 });
  return null;
}

export default function LangLayout() {
  const lang = useLang();
  return (
    <ConfigProvider locale={antdLocales[lang]}>
      <header className="flex justify-end p-4">
        <LanguageSwitcher />
      </header>
      <Outlet />
    </ConfigProvider>
  );
}
