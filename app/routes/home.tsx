import { HomePage } from "../home/home-page";
import { DEFAULT_LANG, isLang, translate } from "../i18n";
import type { Route } from "./+types/home";

export function meta({ params }: Route.MetaArgs) {
  const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
  return [
    { title: `${translate(lang, "home")} | Employment Star` },
    {
      name: "description",
      content: translate(lang, "findTheJobThatFitsYourNextStep"),
    },
  ];
}

export default function Home() {
  return <HomePage />;
}
