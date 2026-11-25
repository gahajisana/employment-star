import { useParams } from "react-router";

import { en, id, type MessageKey } from "./glossary";

export type { MessageKey };

export const LANGS = ["en", "id"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

// BCP 47 tags for Intl.NumberFormat / Intl.DateTimeFormat (Rp 8.000.000 vs Rp 8,000,000).
export const LOCALES: Record<Lang, string> = { en: "en-US", id: "id-ID" };

export const LANG_COOKIE = "lang";

const packs: Record<Lang, Partial<Record<MessageKey, string>>> = { en, id };
const reported = new Set<string>();

export function isLang(value: unknown): value is Lang {
  return LANGS.includes(value as Lang);
}

/**
 * Looks up `key` in the `lang` pack and fills `{name}` placeholders.
 * Missing in ID falls back to EN; missing everywhere returns the key.
 * Each miss is logged once in development (missing-translation log, F35).
 */
export function translate(
  lang: Lang,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let text = packs[lang][key];
  if (text === undefined) {
    if (import.meta.env.DEV && !reported.has(`${lang}:${key}`)) {
      reported.add(`${lang}:${key}`);
      console.warn(`[i18n] missing "${key}" in "${lang}"`);
    }
    text = packs[DEFAULT_LANG][key] ?? key;
  }
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Swaps the leading `/:lang` segment; keeps the rest of the path. */
export function switchLangPath(pathname: string, lang: Lang): string {
  return `/${lang}${pathname.replace(/^\/[^/]*/, "")}`;
}

/** Language for `/`: saved cookie, then Accept-Language, then default. */
export function pickLang(request: Request): Lang {
  const cookie = request.headers.get("Cookie") ?? "";
  const saved = cookie.match(/(?:^|;\s*)lang=([a-z]+)/)?.[1];
  if (isLang(saved)) return saved;

  const accept = request.headers.get("Accept-Language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.trim().slice(0, 2).toLowerCase();
    if (isLang(tag)) return tag;
  }
  return DEFAULT_LANG;
}

/** Active language from the `/:lang` URL segment. */
export function useLang(): Lang {
  const { lang } = useParams();
  return isLang(lang) ? lang : DEFAULT_LANG;
}

/** `const t = useT(); t("home")`. Keys come from the glossary (glossary.ts). */
export function useT() {
  const lang = useLang();
  return (key: MessageKey, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
}
