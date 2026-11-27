import { Link, useLocation } from "react-router";

import {
  DEFAULT_LANG,
  isLang,
  type MessageKey,
  translate,
  useLang,
  useT,
} from "../i18n";
import type { Route } from "./+types/coming-soon";

const TITLES: Record<string, MessageKey> = {
  jobs: "jobs",
  companies: "companies",
  classes: "careerClasses",
  "cv-editor": "cvEditor",
  messages: "messages",
  "growth-record": "growthRecord",
  recommendations: "recommendedJobs",
  applications: "myApplications",
  "saved-jobs": "savedJobs",
  employer: "employer",
};

const titleKey = (pathname: string): MessageKey =>
  TITLES[pathname.split("/")[2] ?? ""] ?? "comingSoon";

export function meta({ params, location }: Route.MetaArgs) {
  const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
  return [
    {
      title: `${translate(lang, titleKey(location.pathname))} · Employment Star`,
    },
  ];
}

export default function ComingSoon() {
  const t = useT();
  const lang = useLang();
  const { pathname } = useLocation();

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-16">
      <section className="flex flex-col items-start gap-3 rounded-[20px] bg-white p-8">
        <h1 className="m-0 text-3xl font-extrabold tracking-tight">
          {t(titleKey(pathname))}
        </h1>
        <p className="m-0 text-[#6B7280]">{t("comingSoon")}</p>
        <Link
          to={`/${lang}`}
          className="mt-2 rounded-full bg-[#E8392B] px-5 py-2 text-sm font-bold text-white no-underline hover:bg-[#C2281B]"
        >
          {t("goToHome")}
        </Link>
      </section>
    </main>
  );
}
