// Pure helpers that turn the EN-ID glossary CSV into language packs.
// Used by scripts/glossary.mjs (writes glossary.ts) and by the sync test.
// Not imported by the app, so it never ships to the browser.

/** Minimal RFC 4180 parser: quoted fields, "" escapes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') field += text[i++];
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

/** "Your résumé is {percent}% complete" -> "yourResumeIsPercentComplete"; "1–3 years" -> "1_3Years". */
export function toKey(english: string): string {
  const words = english
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  return words
    .map((w, i) => {
      if (i === 0) return w.toLowerCase();
      const word = w[0].toUpperCase() + w.slice(1).toLowerCase();
      // Keep number ranges readable: 1–3 must not become 13.
      return /\d$/.test(words[i - 1]) && /^\d/.test(w) ? `_${word}` : word;
    })
    .join("");
}

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");

/**
 * Columns: No., English, Bahasa Indonesia, Area / note; extra columns ignored.
 * Returns the packs plus every problem found, so one run lists them all.
 */
export function buildPacks(csvText: string) {
  const [, ...rows] = parseCsv(csvText);
  const en: Record<string, string> = {};
  const id: Record<string, string> = {};
  const errors: string[] = [];
  for (const [no = "", english = "", indonesian = ""] of rows) {
    const enText = english.trim();
    const idText = indonesian.trim();
    if (!no.trim() && !enText && !idText) continue;
    const key = toKey(enText);
    if (!enText || !idText)
      errors.push(`row ${no}: English and Indonesian must both be filled`);
    else if (key in en)
      errors.push(`row ${no}: "${enText}" gives duplicate key "${key}"`);
    else if (placeholders(enText) !== placeholders(idText))
      errors.push(
        `row ${no}: placeholders differ in "${enText}" / "${idText}"`,
      );
    else {
      en[key] = enText;
      id[key] = idText;
    }
  }
  return { en, id, errors };
}
