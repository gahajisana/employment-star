import { describe, expect, it } from "vitest";

import {
  canApply,
  type CompletenessPart,
  completeness,
  DEMO_FILLED,
  missingSections,
  RESUME_SECTIONS,
  WEIGHTS,
} from "./demo";

describe("résumé completeness", () => {
  it("weights add up to 100", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("demo profile is 58% complete", () => {
    expect(completeness(new Set(DEMO_FILLED))).toBe(58);
  });

  it("is 0 when empty and 100 when everything is filled", () => {
    expect(completeness(new Set())).toBe(0);
    expect(
      completeness(new Set(Object.keys(WEIGHTS) as CompletenessPart[])),
    ).toBe(100);
  });

  it("lists missing résumé sections in report order, never jobIntention", () => {
    expect(missingSections(new Set(DEMO_FILLED))).toEqual([
      "workHistory",
      "projectExperience",
      "internshipExperience",
      "languageProficiency",
      "certificates",
      "honoursAndAwards",
      "careerPlan",
    ]);
    expect(missingSections(new Set(["jobIntention"]))).not.toContain(
      "jobIntention",
    );
  });

  it("allows applying from exactly 70%", () => {
    expect(canApply(69)).toBe(false);
    expect(canApply(70)).toBe(true);
  });

  it("has 11 résumé sections", () => {
    expect(RESUME_SECTIONS).toHaveLength(11);
  });
});
