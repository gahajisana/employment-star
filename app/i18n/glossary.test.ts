import { describe, expect, it } from "vitest";

import csv from "../../docs/Glossary - Sheet1.csv?raw";
import { en, id } from "./glossary";
import { buildPacks, parseCsv, toKey } from "./glossary-build";

describe("toKey", () => {
  it("camel-cases the English term without accents or symbols", () => {
    expect(toKey("Home")).toBe("home");
    expect(toKey("Your résumé is {percent}% complete")).toBe(
      "yourResumeIsPercentComplete",
    );
  });

  it("keeps number ranges apart", () => {
    expect(toKey("1–3 years")).toBe("1_3Years");
  });
});

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas and CRLF", () => {
    expect(parseCsv('a,"b, ""c"""\r\nd,e')).toEqual([
      ["a", 'b, "c"'],
      ["d", "e"],
    ]);
  });
});

describe("buildPacks", () => {
  const header = "No.,English,Bahasa Indonesia,Area / note\n";

  it("reports empty cells, duplicate keys and placeholder mismatches", () => {
    const { errors } = buildPacks(
      header +
        "1,Save,,Button\n" +
        "2,Home,Beranda,Navigation\n" +
        "3,home,Beranda,Navigation\n" +
        "4,{n} jobs,{m} lowongan,Message\n",
    );
    expect(errors).toHaveLength(3);
  });

  it("skips blank rows", () => {
    const { en: packEn, errors } = buildPacks(
      header + "1,Home,Beranda,Nav\n,,,,\n",
    );
    expect(errors).toEqual([]);
    expect(packEn).toEqual({ home: "Home" });
  });
});

describe("glossary.ts", () => {
  it("matches docs/Glossary - Sheet1.csv (run `npm run glossary` if not)", () => {
    const built = buildPacks(csv);
    expect(built.errors).toEqual([]);
    expect(en).toEqual(built.en);
    expect(id).toEqual(built.id);
  });
});
