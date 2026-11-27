import { Link, useLocation } from "react-router";

import {
  LANG_COOKIE,
  LANGS,
  switchLangPath,
  translate,
  useLang,
  useT,
} from ".";

// Each language is named in its own language (glossary rule).
const LANG_NAMES = { en: "english", id: "indonesian" } as const;

/**
 * EN / ID switch (F03). Client-side navigation to the same route under the
 * other language, so the page, query string and typed form state survive.
 */
export function LanguageSwitcher() {
  const lang = useLang();
  const t = useT();
  const { pathname, search, hash } = useLocation();

  return (
    <nav
      aria-label={t("language")}
      className="flex rounded-full border border-solid border-[#E5E7EB] p-0.5 text-sm"
    >
      {LANGS.map((code) => (
        <Link
          key={code}
          to={`${switchLangPath(pathname, code)}${search}${hash}`}
          replace
          preventScrollReset
          hrefLang={code}
          lang={code}
          aria-current={code === lang ? "true" : undefined}
          aria-label={translate(code, LANG_NAMES[code])}
          className={`rounded-full px-2.5 py-1 text-xs font-bold no-underline ${
            code === lang
              ? "bg-[#1F2937] text-white"
              : "text-[#6B7280] hover:text-[#1F2937]"
          }`}
          onClick={() => {
            document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
          }}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
