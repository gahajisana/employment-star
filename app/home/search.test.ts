import { describe, expect, it } from "vitest";

import { isCityOf } from "../data/regions";
import { DEMO_EMPLOYERS, DEMO_JOBS } from "./demo";
import {
  filterEmployers,
  filterJobs,
  formatPosted,
  formatSalary,
  readFilters,
  salaryError,
  writeFilters,
} from "./search";

const filters = (query = "") => readFilters(new URLSearchParams(query));

describe("home query filters", () => {
  it("defaults to the full list, newest first, on page one", () => {
    expect(filters()).toEqual({
      keyword: "",
      province: "",
      city: "",
      education: "",
      jobTypes: [],
      workType: "",
      language: "",
      salaryMin: null,
      salaryMax: null,
      sort: "newest",
      page: 1,
      employerPage: 1,
    });
  });

  it("trims keywords, ignores spaces, and limits shared-link keywords to 50 characters", () => {
    expect(filters("q=++React++").keyword).toBe("React");
    expect(filters("q=+++").keyword).toBe("");
    expect(filters(`q=${"a".repeat(70)}`).keyword).toHaveLength(50);
  });

  it("only accepts cities from the selected province", () => {
    expect(filters("province=DKI+Jakarta&city=Jakarta+Selatan").city).toBe(
      "Jakarta Selatan",
    );
    expect(filters("province=DKI+Jakarta&city=Kota+Bandung").city).toBe("");
    expect(filters("city=Jakarta+Selatan").city).toBe("");
    expect(filters("province=toString&city=anything").province).toBe("");
  });

  it("validates enum values and deduplicates multiple job types", () => {
    expect(
      filters(
        "jobType=fullTime&jobType=internship&jobType=fullTime&jobType=bad&education=S1&workType=remote&language=en&sort=highestSalary",
      ),
    ).toMatchObject({
      jobTypes: ["fullTime", "internship"],
      education: "S1",
      workType: "remote",
      language: "en",
      sort: "highestSalary",
    });
    expect(
      filters("education=bad&workType=bad&language=bad&sort=bad"),
    ).toMatchObject({
      education: "",
      workType: "",
      language: "",
      sort: "newest",
    });
  });

  it("keeps zero distinct from an omitted salary and rejects invalid ranges", () => {
    expect(filters("salaryMin=0&salaryMax=5000000")).toMatchObject({
      salaryMin: 0,
      salaryMax: 5_000_000,
    });
    expect(filters("salaryMin=9000000&salaryMax=1000000")).toMatchObject({
      salaryMin: null,
      salaryMax: null,
    });
    expect(filters("salaryMin=-1&salaryMax=Infinity")).toMatchObject({
      salaryMin: null,
      salaryMax: null,
    });
    expect(filters("salaryMin=1.5&salaryMax=9007199254740992")).toMatchObject({
      salaryMin: null,
      salaryMax: null,
    });
  });

  it("falls back to page one for malformed paging", () => {
    for (const value of ["0", "-3", "1.5", "bad", "Infinity"]) {
      expect(filters(`page=${value}&employerPage=${value}`)).toMatchObject({
        page: 1,
        employerPage: 1,
      });
    }
    expect(filters("page=3&employerPage=2")).toMatchObject({
      page: 3,
      employerPage: 2,
    });
  });

  it("round-trips every filter without dropping unrelated query parameters", () => {
    const current = new URLSearchParams("utm_source=campus&q=old&jobType=bad");
    const next = filters(
      "q=React&province=DKI+Jakarta&city=Jakarta+Selatan&education=S1&jobType=fullTime&jobType=contract&workType=remote&language=en&salaryMin=0&salaryMax=12000000&sort=highestSalary&page=2&employerPage=2",
    );
    const written = writeFilters(next, current);
    expect(readFilters(written)).toEqual(next);
    expect(written.get("utm_source")).toBe("campus");
    expect(current.get("q")).toBe("old");
    expect(writeFilters(filters(), written).toString()).toBe(
      "utm_source=campus",
    );
  });
});

describe("local job and employer search", () => {
  it("searches titles, skills and company names case-insensitively", () => {
    expect(filterJobs(DEMO_JOBS, filters("q=FRONTEND"))).toHaveLength(2);
    expect(filterJobs(DEMO_JOBS, filters("q=react"))).toHaveLength(2);
    expect(filterJobs(DEMO_JOBS, filters("q=Telkom"))).toHaveLength(3);
    expect(filterEmployers(DEMO_EMPLOYERS, "  TELKOM ")).toHaveLength(1);
  });

  it("combines dimensions with AND and multiple job types with OR", () => {
    const selected = filters(
      "province=DKI+Jakarta&city=Jakarta+Selatan&education=S1&jobType=fullTime&jobType=contract&workType=remote",
    );
    const results = filterJobs(DEMO_JOBS, selected);
    expect(results).toHaveLength(0);
    const withNoDegree = filterJobs(DEMO_JOBS, { ...selected, education: "" });
    expect(withNoDegree.map((job) => job.id)).toEqual(["tokopedia-copywriter"]);
    expect(
      filterJobs(DEMO_JOBS, filters("jobType=internship&jobType=partTime")),
    ).toHaveLength(8);
  });

  it("matches overlapping salary ranges and excludes undisclosed pay", () => {
    const results = filterJobs(
      DEMO_JOBS,
      filters("salaryMin=9500000&salaryMax=10000000"),
    );
    expect(results.map((job) => job.id)).toContain("telkom-frontend");
    expect(results.map((job) => job.id)).not.toContain("bca-data");
    expect(
      results.every((job) => job.salaryMin !== null && job.salaryMax !== null),
    ).toBe(true);
  });

  it("filters job language independently from the UI language", () => {
    const results = filterJobs(
      DEMO_JOBS,
      filters("language=en&workType=remote"),
    );
    expect(results.map((job) => job.id)).toEqual([
      "ruangguru-tutor",
      "traveloka-frontend",
    ]);
  });

  it("sorts salary highest-first, puts negotiable jobs last, and leaves fixtures untouched", () => {
    const original = DEMO_JOBS.map((job) => job.id);
    const results = filterJobs(DEMO_JOBS, filters("sort=highestSalary"));
    expect(results[0].id).toBe("dana-security");
    expect(results.at(-1)?.salaryMin).toBeNull();
    expect(DEMO_JOBS.map((job) => job.id)).toEqual(original);
    expect(filterJobs(DEMO_JOBS, filters())[0].postedDaysAgo).toBe(0);
  });

  it("includes at least twenty coherent sample jobs with valid cascade locations", () => {
    expect(DEMO_JOBS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(DEMO_JOBS.map((job) => job.id)).size).toBe(DEMO_JOBS.length);
    for (const job of DEMO_JOBS) {
      expect(
        DEMO_EMPLOYERS.some((employer) => employer.id === job.employerId),
      ).toBe(true);
      expect(isCityOf(job.province, job.city)).toBe(true);
      expect(salaryError(job)).toBeUndefined();
    }
  });
});

describe("home salary and posted-date copy", () => {
  it("formats rupiah with the active language's separators", () => {
    const range = { salaryMin: 7_000_000, salaryMax: 10_000_000 };
    expect(formatSalary(range, "en")).toBe(
      "Rp 7,000,000 – Rp 10,000,000 / per month",
    );
    expect(formatSalary(range, "id")).toBe(
      "Rp 7.000.000 – Rp 10.000.000 / per bulan",
    );
  });

  it("never invents a zero salary for undisclosed pay", () => {
    const range = { salaryMin: null, salaryMax: null };
    expect(formatSalary(range, "en")).toBe("Negotiable");
    expect(formatSalary(range, "id")).toBe("Dapat dinegosiasikan");
  });

  it("handles equal and one-sided salary amounts", () => {
    expect(
      formatSalary({ salaryMin: 5_000_000, salaryMax: 5_000_000 }, "en"),
    ).toBe("Rp 5,000,000 / per month");
    expect(formatSalary({ salaryMin: 5_000_000, salaryMax: null }, "en")).toBe(
      "From Rp 5,000,000 / per month",
    );
    expect(formatSalary({ salaryMin: null, salaryMax: 5_000_000 }, "id")).toBe(
      "Hingga Rp 5.000.000 / per bulan",
    );
  });

  it("reports invalid salary pairs without treating an omitted bound as zero", () => {
    expect(salaryError({ salaryMin: 9_000_000, salaryMax: 1_000_000 })).toBe(
      "minimumSalaryCannotBeHigherThanMaximumSalary",
    );
    expect(salaryError({ salaryMin: -1, salaryMax: null })).toBe(
      "salaryValuesMustBeZeroOrMore",
    );
    expect(
      salaryError({ salaryMin: 9_000_000, salaryMax: null }),
    ).toBeUndefined();
  });

  it("localizes today, yesterday and older sample posting dates", () => {
    expect(formatPosted(0, "en")).toBe("Posted: Today");
    expect(formatPosted(1, "id")).toBe("Diposting: Kemarin");
    expect(formatPosted(3, "id")).toBe("Diposting 3 hari lalu");
  });
});
