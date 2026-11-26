import { describe, expect, it } from "vitest";

import { validateBasicInfo } from "./basic-info";

const valid = {
  fullName: " Nama ",
  whatsapp: "0812-3456-7890",
  province: "DKI Jakarta",
  city: "Jakarta Selatan",
  linkedinUrl: "",
};

describe("validateBasicInfo", () => {
  it("accepts and normalizes", () => {
    expect(validateBasicInfo(valid)).toEqual({
      ok: true,
      value: { ...valid, fullName: "Nama", whatsapp: "+6281234567890" },
    });
  });

  it.each([
    ["+62812345678", true],
    ["62812345678901", true], // 12 digits after 62: the upper limit
    ["628123456789012", false], // 13 digits
    ["0812345678", true], // 9 digits after 62: the lower limit
    ["081234567", false], // 8 digits
    ["+62 0812345678", false], // stray 0 after +62 would store a wrong number
    ["0062812345678", false], // international prefix, not 08…
    ["08123", false],
    ["0812abc5678", false],
  ])("whatsapp %s valid=%s", (whatsapp, ok) => {
    expect(validateBasicInfo({ ...valid, whatsapp }).ok).toBe(ok);
  });

  it("requires name, whatsapp, province and city", () => {
    const result = validateBasicInfo({});
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      "city",
      "fullName",
      "province",
      "whatsapp",
    ]);
  });

  it.each(["linkedin.com/in/x", "ftp://x", `https://x/${"a".repeat(200)}`])(
    "rejects LinkedIn %s",
    (linkedinUrl) => {
      const result = validateBasicInfo({ ...valid, linkedinUrl });
      expect(!result.ok && result.errors.linkedinUrl?.key).toBe(
        "pleaseEnterAValidUrl",
      );
    },
  );

  it("accepts a curly apostrophe and stores a straight one", () => {
    const result = validateBasicInfo({ ...valid, fullName: "Ma’ruf Amin" });
    expect(result.ok && result.value.fullName).toBe("Ma'ruf Amin");
  });

  it("rejects a 1-character name and a city outside the province", () => {
    const result = validateBasicInfo({
      ...valid,
      fullName: "A",
      city: "Kota Bandung",
    });
    expect(!result.ok && result.errors.fullName?.key).toBe(
      "useMinToMaxCharacters",
    );
    expect(!result.ok && result.errors.city).toBeTruthy();
  });

  it.each([
    ["Muh. Gavin", true],
    ["Anne-Marie O'Brien", true],
    ["José", true],
    ["Dewi123", false],
    ["Dewi@", false],
  ])("name %s valid=%s", (fullName, ok) => {
    expect(validateBasicInfo({ ...valid, fullName }).ok).toBe(ok);
  });
});
