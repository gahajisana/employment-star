// Job intention (P07 / F14 / A10): the shape, the allowed values and the one
// validator used by both the form and the API, so they can never disagree.
import { isCityOf } from "../data/regions";
import type { MessageKey } from "../i18n";

/** Values are glossary keys, so the label is always `t(status)`. */
export const JOB_SEEKING_STATUSES = [
  "lookingForAJob",
  "openToOffers",
  "notLooking",
  "employed",
  "notYetEmployed",
] as const satisfies readonly MessageKey[];

export type JobSeekingStatus = (typeof JOB_SEEKING_STATUSES)[number];

export type JobIntention = {
  expectedRole: string;
  salaryMin: number | null; // Rupiah per month
  salaryMax: number | null;
  province: string;
  city: string;
  jobSeekingStatus: JobSeekingStatus;
};

export type Field = keyof JobIntention;
export type FieldError = { key: MessageKey; vars?: Record<string, number> };

export const ROLE_MIN = 2;
export const ROLE_MAX = 50;
export const SALARY_MAX = 1_000_000_000;

const ROLE_PATTERN = /^[\p{L}\p{N} \-/&]+$/u;

function salary(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= SALARY_MAX ? n : undefined;
}

/**
 * Checks untrusted input (form state or a request body).
 * Returns the cleaned value, or one error per invalid field.
 */
export function validateJobIntention(
  input: unknown,
):
  | { ok: true; value: JobIntention }
  | { ok: false; errors: Partial<Record<Field, FieldError>> } {
  const raw = (typeof input === "object" && input ? input : {}) as Record<
    string,
    unknown
  >;
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const errors: Partial<Record<Field, FieldError>> = {};
  const required: FieldError = { key: "thisFieldIsRequired" };

  const expectedRole = text(raw.expectedRole);
  if (!expectedRole) errors.expectedRole = required;
  else if (expectedRole.length < ROLE_MIN || expectedRole.length > ROLE_MAX)
    errors.expectedRole = {
      key: "useMinToMaxCharacters",
      vars: { min: ROLE_MIN, max: ROLE_MAX },
    };
  else if (!ROLE_PATTERN.test(expectedRole))
    errors.expectedRole = { key: "useOnlyLettersNumbersSpacesAnd" };

  const salaryMin = salary(raw.salaryMin);
  const salaryMax = salary(raw.salaryMax);
  if (salaryMin === undefined) errors.salaryMin = { key: "somethingWentWrong" };
  if (salaryMax === undefined) errors.salaryMax = { key: "somethingWentWrong" };
  if (salaryMin != null && salaryMax != null && salaryMin > salaryMax)
    errors.salaryMax = { key: "minimumSalaryCannotBeHigherThanMaximumSalary" };

  const province = text(raw.province);
  const city = text(raw.city);
  if (!province) errors.province = required;
  if (!city) errors.city = required;
  else if (province && !isCityOf(province, city)) errors.city = required;

  const jobSeekingStatus = text(raw.jobSeekingStatus) as JobSeekingStatus;
  if (!JOB_SEEKING_STATUSES.includes(jobSeekingStatus))
    errors.jobSeekingStatus = required;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      expectedRole,
      salaryMin: salaryMin ?? null,
      salaryMax: salaryMax ?? null,
      province,
      city,
      jobSeekingStatus,
    },
  };
}
