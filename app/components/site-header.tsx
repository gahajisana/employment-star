import { Link, NavLink } from "react-router";

import { type MessageKey, useLang, useT } from "../i18n";
import { LanguageSwitcher } from "../i18n/language-switcher";

// `signedIn`: only shown after login (private pages, F04).
const NAV: { path: string; key: MessageKey; signedIn?: boolean }[] = [
  { path: "", key: "home" },
  { path: "/jobs", key: "jobs" },
  { path: "/companies", key: "companies" },
  { path: "/classes", key: "careerClasses" },
  { path: "/cv-editor", key: "cvEditor" },
  { path: "/messages", key: "messages", signedIn: true },
];

const STAR_PATH =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8z";

export function Star({ className }: { className: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 text-[15px] whitespace-nowrap sm:text-[17px] font-extrabold tracking-tight ${
        inverted ? "text-white" : "text-[#1F2937]"
      }`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`h-6 w-6 sm:h-7 sm:w-7 ${inverted ? "text-white" : "text-[#E8392B]"}`}
        fill="currentColor"
      >
        <path d={STAR_PATH} />
      </svg>
      Employment Star
    </span>
  );
}

export function SiteHeader({ email }: { email: string | null }) {
  const lang = useLang();
  const t = useT();
  const base = `/${lang}`;

  return (
    <header className="sticky top-0 z-20 border-0 border-b border-solid border-[#E5E7EB] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 px-5 pt-3 sm:gap-x-6 lg:h-16 lg:flex-nowrap lg:pt-0">
        <Link to={base} className="no-underline" aria-label={t("home")}>
          <Logo />
        </Link>

        <nav
          aria-label={t("menu")}
          className="order-last -mx-5 flex w-[calc(100%+2.5rem)] gap-5 overflow-x-auto px-5 lg:order-none lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0"
        >
          {NAV.filter((n) => email || !n.signedIn).map(({ path, key }) => (
            <NavLink
              key={key}
              to={base + path}
              end={path === ""}
              className={({ isActive }) =>
                `border-0 border-b-2 border-solid py-3 text-sm whitespace-nowrap no-underline lg:py-[21px] ${
                  isActive
                    ? "border-[#1F2937] font-bold text-[#1F2937]"
                    : "border-transparent font-medium text-[#6B7280] hover:text-[#1F2937]"
                }`
              }
            >
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {email ? (
            <Link
              to={`${base}/profile`}
              aria-label={t("myProfile")}
              title={email}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F2937] text-sm font-bold text-white no-underline ring-[#E8392B] ring-offset-2 hover:ring-2"
            >
              {email[0].toUpperCase()}
            </Link>
          ) : (
            <Link
              to={`${base}/login`}
              className="rounded-full bg-[#E8392B] px-4 py-2 text-sm font-bold whitespace-nowrap sm:px-5 text-white no-underline hover:bg-[#C2281B]"
            >
              {t("logIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ email }: { email: string | null }) {
  const lang = useLang();
  const t = useT();
  return (
    <footer className="mt-24 bg-[#1F2937] text-white">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo inverted />
          <p className="m-0 text-sm leading-relaxed text-white/75">
            {t("employersAcrossIndonesiaAreHiringGraduatesAndInterns")}
          </p>
        </div>
        <nav
          aria-label={t("menu")}
          className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3"
        >
          {NAV.slice(1)
            .filter((n) => email || !n.signedIn)
            .map(({ path, key }) => (
              <Link
                key={key}
                to={`/${lang}${path}`}
                className="text-sm text-white/85 no-underline hover:text-white"
              >
                {t(key)}
              </Link>
            ))}
        </nav>
      </div>
      <div className="border-0 border-t border-solid border-white/10">
        <p className="mx-auto my-0 max-w-[1240px] px-5 py-5 text-xs text-white/60">
          © {new Date().getFullYear()} Employment Star. {t("allRightsReserved")}
        </p>
      </div>
    </footer>
  );
}
