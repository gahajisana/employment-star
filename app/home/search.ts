import { REGIONS, isCityOf } from "../data/regions";
import { LOCALES, translate, type Lang, type MessageKey } from "../i18n";
import {
  EDUCATION_LEVELS,
  JOB_TYPES,
  WORK_TYPES,
  type DemoEmployer,
  type DemoJob,
  type EducationLevel,
  type JobType,
  type WorkType,
} from "./demo";

export const KEYWORD_MAX = 50;
export const JOB_PAGE_SIZE = 10;
export const EMPLOYER_PAGE_SIZE = 4;

export interface SalaryRange {
  salaryMin: number | null;
  salaryMax: number | null;
}

export interface HomeFilters extends SalaryRange {
  keyword: string;
  province: string;
  city: string;
  education: EducationLevel | "";
  jobTypes: JobType[];
  workType: WorkType | "";
  language: Lang | "";
  sort: "newest" | "highestSalary";
  page: number;
  employerPage: number;
}

function option<T extends string>(
  value: string | null,
  choices: readonly T[],
): T | "" {
  return choices.includes(value as T) ? (value as T) : "";
}

function amount(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function page(value: string | null): number {
  return Math.max(1, amount(value) ?? 1);
}

export function salaryError(range: SalaryRange): MessageKey | undefined {
  const values = [range.salaryMin, range.salaryMax];
  if (
    values.some(
      (value) => value !== null && (!Number.isFinite(value) || value < 0),
    )
  ) {
    return "salaryValuesMustBeZeroOrMore";
  }
  if (
    range.salaryMin !== null &&
    range.salaryMax !== null &&
    range.salaryMin > range.salaryMax
  ) {
    return "minimumSalaryCannotBeHigherThanMaximumSalary";
  }
  return undefined;
}

/** Invalid/stale URL values fall back to the unfiltered defaults. */
export function readFilters(params: URLSearchParams): HomeFilters {
  const rawProvince = params.get("province") ?? "";
  const province = Object.hasOwn(REGIONS, rawProvince) ? rawProvince : "";
  const rawCity = params.get("city") ?? "";
  const city = province && isCityOf(province, rawCity) ? rawCity : "";
  const range = {
    salaryMin: amount(params.get("salaryMin")),
    salaryMax: amount(params.get("salaryMax")),
  };

  return {
    keyword: (params.get("q") ?? "").trim().slice(0, KEYWORD_MAX),
    province,
    city,
    ...(salaryError(range) ? { salaryMin: null, salaryMax: null } : range),
    education: option(params.get("education"), EDUCATION_LEVELS),
    jobTypes: [...new Set(params.getAll("jobType"))].filter(
      (value): value is JobType => JOB_TYPES.includes(value as JobType),
    ),
    workType: option(params.get("workType"), WORK_TYPES),
    language: option(params.get("language"), ["en", "id"] as const),
    sort: params.get("sort") === "highestSalary" ? "highestSalary" : "newest",
    page: page(params.get("page")),
    employerPage: page(params.get("employerPage")),
  };
}

const FILTER_PARAMS = [
  "q",
  "province",
  "city",
  "salaryMin",
  "salaryMax",
  "education",
  "jobType",
  "workType",
  "language",
  "sort",
  "page",
  "employerPage",
] as const;

/** Keep unrelated query parameters, including shared-link campaign tags. */
export function writeFilters(
  filters: HomeFilters,
  current = new URLSearchParams(),
): URLSearchParams {
  const params = new URLSearchParams(current);
  FILTER_PARAMS.forEach((key) => params.delete(key));
  const put = (key: string, value: string | number | null) => {
    if (value !== "" && value !== null) params.set(key, String(value));
  };

  put("q", filters.keyword.trim().slice(0, KEYWORD_MAX));
  put("province", filters.province);
  put("city", filters.city);
  put("salaryMin", filters.salaryMin);
  put("salaryMax", filters.salaryMax);
  put("education", filters.education);
  filters.jobTypes.forEach((value) => params.append("jobType", value));
  put("workType", filters.workType);
  put("language", filters.language);
  if (filters.sort !== "newest") put("sort", filters.sort);
  if (filters.page > 1) put("page", filters.page);
  if (filters.employerPage > 1) put("employerPage", filters.employerPage);
  return params;
}

export function filterJobs(
  jobs: readonly DemoJob[],
  filters: HomeFilters,
): DemoJob[] {
  const keyword = filters.keyword.toLowerCase();
  const hasSalary = filters.salaryMin !== null || filters.salaryMax !== null;

  return jobs
    .filter((job) => {
      const searchable = [job.title, job.companyName, ...job.skills]
        .join(" ")
        .toLowerCase();
      if (keyword && !searchable.includes(keyword)) return false;
      if (filters.province && job.province !== filters.province) return false;
      if (filters.city && job.city !== filters.city) return false;
      if (filters.education && job.education !== filters.education)
        return false;
      if (filters.jobTypes.length && !filters.jobTypes.includes(job.jobType))
        return false;
      if (filters.workType && job.workType !== filters.workType) return false;
      if (filters.language && !job.languages.includes(filters.language))
        return false;

      if (hasSalary) {
        const min = job.salaryMin ?? job.salaryMax;
        const max = job.salaryMax ?? job.salaryMin;
        // Undisclosed salaries cannot be assumed to match a numeric range.
        if (min === null || max === null) return false;
        if (filters.salaryMin !== null && max < filters.salaryMin) return false;
        if (filters.salaryMax !== null && min > filters.salaryMax) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "highestSalary") {
        const difference =
          (b.salaryMax ?? b.salaryMin ?? -1) -
          (a.salaryMax ?? a.salaryMin ?? -1);
        if (difference) return difference;
      }
      return a.postedDaysAgo - b.postedDaysAgo || a.id.localeCompare(b.id);
    });
}

export function filterEmployers(
  employers: readonly DemoEmployer[],
  keyword: string,
): DemoEmployer[] {
  const search = keyword.trim().toLowerCase();
  return employers.filter((employer) =>
    employer.name.toLowerCase().includes(search),
  );
}

export function formatSalary(range: SalaryRange, lang: Lang): string {
  const { salaryMin: min, salaryMax: max } = range;
  if (min === null && max === null) return translate(lang, "negotiable");

  const currency = (value: number) =>
    `Rp ${new Intl.NumberFormat(LOCALES[lang]).format(value)}`;
  let text: string;
  if (min !== null && max !== null) {
    text = min === max ? currency(min) : `${currency(min)} – ${currency(max)}`;
  } else if (min !== null) {
    text = translate(lang, "fromAmount", { amount: currency(min) });
  } else {
    text = translate(lang, "upToAmount", { amount: currency(max!) });
  }
  return `${text} / ${translate(lang, "perMonth").toLowerCase()}`;
}

export function formatPosted(days: number, lang: Lang): string {
  if (days === 0)
    return `${translate(lang, "posted")}: ${translate(lang, "today")}`;
  if (days === 1)
    return `${translate(lang, "posted")}: ${translate(lang, "yesterday")}`;
  return translate(lang, "postedCountDaysAgo", { count: days });
}
