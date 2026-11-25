import { describe, expect, it } from "vitest";

import { validateJobIntention } from "./job-intention";

const valid = {
  expectedRole: " Frontend Developer ",
  salaryMin: 8_000_000,
  salaryMax: 12_000_000,
  province: "DKI Jakarta",
  city: "Jakarta Selatan",
  jobSeekingStatus: "lookingForAJob",
};

describe("validateJobIntention", () => {
  it("accepts a valid intention and trims text", () => {
    const result = validateJobIntention(valid);
    expect(result).toEqual({
      ok: true,
      value: { ...valid, expectedRole: "Frontend Developer" },
    });
  });

  it("allows an empty salary range", () => {
    const result = validateJobIntention({
      ...valid,
      salaryMin: null,
      salaryMax: "",
    });
    expect(result.ok && result.value.salaryMax).toBe(null);
  });

  it("rejects missing required fields", () => {
    const result = validateJobIntention({});
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      "city",
      "expectedRole",
      "jobSeekingStatus",
      "province",
    ]);
  });

  it.each([
    ["x", "useMinToMaxCharacters"],
    ["a".repeat(51), "useMinToMaxCharacters"],
    ["Dev <script>", "useOnlyLettersNumbersSpacesAnd"],
  ])("rejects role %j", (expectedRole, key) => {
    const result = validateJobIntention({ ...valid, expectedRole });
    expect(!result.ok && result.errors.expectedRole?.key).toBe(key);
  });

  it("accepts Indonesian letters and - / &", () => {
    const result = validateJobIntention({
      ...valid,
      expectedRole: "Staf Admin & Keuangan / Akuntansi",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects min salary above max", () => {
    const result = validateJobIntention({
      ...valid,
      salaryMin: 9,
      salaryMax: 1,
    });
    expect(!result.ok && result.errors.salaryMax?.key).toBe(
      "minimumSalaryCannotBeHigherThanMaximumSalary",
    );
  });

  it.each([-1, 1.5, "abc", 2_000_000_000])("rejects salary %j", (salaryMin) => {
    expect(validateJobIntention({ ...valid, salaryMin }).ok).toBe(false);
  });

  it("rejects a city outside the province and an unknown status", () => {
    const result = validateJobIntention({
      ...valid,
      city: "Kota Bandung",
      jobSeekingStatus: "hacker",
    });
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
      "city",
      "jobSeekingStatus",
    ]);
  });
});
