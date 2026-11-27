import type { ReactNode } from "react";
import { Form, Link } from "react-router";

import { Star } from "../components/site-header";
import {
  DEMO_COURSES,
  DEMO_EMPLOYERS,
  DEMO_JOBS,
  JOB_TYPES,
  type DemoJob,
} from "../data/home-demo";
import { REGIONS } from "../data/regions";
import {
  DEFAULT_LANG,
  isLang,
  LOCALES,
  type MessageKey,
  translate,
  useLang,
  useT,
} from "../i18n";
import { useSessionEmail } from "../lib/auth/use-session-email";
import {
  APPLY_THRESHOLD,
  canApply,
  completeness,
  DEMO_FILLED,
  DEMO_INTENTION,
  RESUME_SECTIONS,
  WEIGHTS,
} from "../profile/demo";
import type { Route } from "./+types/home";

export function meta({ params }: Route.MetaArgs) {
  const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
  return [
    { title: "Employment Star" },
    {
      name: "description",
      content: translate(
        lang,
        "employersAcrossIndonesiaAreHiringGraduatesAndInterns",
      ),
    },
  ];
}

const WORK_TYPES = ["remote", "onSite"] as const;
const SALARY_STEPS = [5_000_000, 10_000_000, 15_000_000];
const LANGUAGES = { en: "english", id: "indonesian" } as const;

const container = "mx-auto w-full max-w-[1240px] px-5";
const card = "rounded-[20px] bg-white";
const chip =
  "cursor-pointer appearance-none rounded-full border border-solid border-[#D9DCE1] bg-white py-2 pr-8 pl-4 text-sm font-semibold text-[#374151] outline-none hover:border-[#1F2937] focus-visible:border-[#1F2937]";
const option = "text-[#1F2937]";
const darkButton =
  "rounded-full bg-[#1F2937] px-5 py-2.5 text-center text-sm font-bold text-white no-underline hover:bg-black";

const monogram = (name: string) => name.replace(/^PT\s+/, "")[0];

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`pointer-events-none ${className}`}
    >
      <path d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" />
    </svg>
  );
}

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" />
    </svg>
  );
}

function Verified({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 24 24"
      className="h-4 w-4 flex-none text-[#15803D]"
      fill="currentColor"
    >
      <path d="M12 1.5l2.6 2 3.3-.2.9 3.2 2.7 1.9-1.2 3.1 1.2 3.1-2.7 1.9-.9 3.2-3.3-.2-2.6 2-2.6-2-3.3.2-.9-3.2-2.7-1.9L3.4 12 2.2 8.9l2.7-1.9.9-3.2 3.3.2zm-1.2 13.6l5.5-5.5-1.4-1.4-4.1 4.1-2-2-1.4 1.4z" />
    </svg>
  );
}

function SectionHeading({ title, to }: { title: string; to?: string }) {
  const t = useT();
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="m-0 text-2xl leading-tight font-extrabold tracking-tight md:text-[28px]">
        {title}
      </h2>
      {to && (
        <Link
          to={to}
          className="flex-none rounded-full border border-solid border-[#D1D5DB] px-4 py-2 text-sm font-bold text-[#1F2937] no-underline hover:border-[#1F2937]"
        >
          {t("viewAll")}
        </Link>
      )}
    </div>
  );
}

function useFormat() {
  const t = useT();
  const lang = useLang();
  const money = new Intl.NumberFormat(LOCALES[lang], {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return {
    money,
    salary: (job: DemoJob) =>
      job.salaryMin === null || job.salaryMax === null
        ? t("negotiable")
        : `${money.format(job.salaryMin)} – ${money.format(job.salaryMax)}`,
    posted: (days: number) =>
      days === 0
        ? t("today")
        : days === 1
          ? t("yesterday")
          : `${days} ${t("daysAgo")}`,
  };
}

/** Red band with the job search; guests can search too (F02). */
function Hero({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const t = useT();
  const lang = useLang();
  const { money } = useFormat();
  const filterChips = [
    {
      name: "province",
      label: "location",
      options: Object.keys(REGIONS).map((p) => ({ value: p, text: p })),
    },
    {
      name: "type",
      label: "jobType",
      options: JOB_TYPES.map((k) => ({ value: k, text: t(k) })),
    },
    {
      name: "work",
      label: "workType",
      options: WORK_TYPES.map((k) => ({ value: k, text: t(k) })),
    },
    {
      name: "salary",
      label: "salary",
      options: SALARY_STEPS.map((min) => ({
        value: String(min),
        text: `≥ ${money.format(min)}`,
      })),
    },
  ] satisfies {
    name: string;
    label: MessageKey;
    options: { value: string; text: string }[];
  }[];

  return (
    <section className="relative overflow-hidden bg-[#EEF2F7] text-[#1F2937]">
      {/* Faint dot grid so the light hero has texture without colour. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #C7D0DC 1px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className={`${container} relative grid gap-12 py-14 md:py-20 ${aside ? "xl:grid-cols-[1fr_420px] xl:items-center" : ""}`}
      >
        <div className="max-w-[720px]">
          <h1 className="m-0 text-[clamp(30px,3.6vw,44px)] leading-[1.15] font-extrabold tracking-tight text-balance">
            {title}
          </h1>
          <p className="m-0 mt-3 max-w-[52ch] text-base text-[#4B5563] md:text-lg">
            {subtitle}
          </p>

          <Form method="get" action={`/${lang}/jobs`} className="mt-8">
            <div className="flex items-center gap-2 rounded-full border border-solid border-[#D9DCE1] bg-white p-1.5 shadow-[0_10px_30px_-14px_rgba(31,41,55,0.3)] focus-within:border-[#1F2937] sm:p-2">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 pl-3 text-[#9CA3AF] sm:pl-4">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="h-5 w-5 flex-none"
                  fill="currentColor"
                >
                  <path d="M8.5 3a5.5 5.5 0 014.38 8.82l3.65 3.65a1 1 0 01-1.41 1.41l-3.65-3.65A5.5 5.5 0 118.5 3zm0 2a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
                </svg>
                <input
                  name="q"
                  type="search"
                  maxLength={50}
                  aria-label={t("searchJobsOrCompanies")}
                  placeholder={t("searchJobsOrCompanies")}
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent text-base text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
                />
              </label>
              <button
                type="submit"
                className="h-11 flex-none cursor-pointer rounded-full border-0 bg-[#E8392B] px-5 text-base sm:h-12 sm:px-7 font-bold text-white hover:bg-[#C2281B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
              >
                {t("search")}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {filterChips.map(({ name, label, options }) => (
                <span key={name} className="relative">
                  <select
                    name={name}
                    aria-label={t(label)}
                    defaultValue=""
                    className={chip}
                  >
                    <option value="" className={option}>
                      {t(label)}
                    </option>
                    {options.map(({ value, text }) => (
                      <option key={value} value={value} className={option}>
                        {text}
                      </option>
                    ))}
                  </select>
                  <Chevron className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                </span>
              ))}
            </div>
          </Form>
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}

function JobList({
  jobs,
  reason,
}: {
  jobs: DemoJob[];
  reason?: (job: DemoJob, index: number) => MessageKey;
}) {
  const t = useT();
  const lang = useLang();
  const { salary, posted } = useFormat();
  return (
    <ul className={`m-0 list-none overflow-hidden p-0 ${card}`}>
      {jobs.map((job, i) => (
        <li
          key={job.id}
          className="border-0 border-b border-solid border-[#F1F2F4] last:border-b-0"
        >
          <Link
            to={`/${lang}/jobs/${job.id}`}
            className="group grid grid-cols-[48px_1fr] items-center gap-x-4 gap-y-3 px-5 py-5 text-[#1F2937] no-underline hover:bg-[#FFF6F5] md:grid-cols-[48px_1fr_auto] md:px-7"
          >
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F5F7] text-lg font-extrabold text-[#6B7280] group-hover:bg-[#1F2937] group-hover:text-white"
            >
              {monogram(job.company)}
            </span>
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[17px] font-extrabold group-hover:underline">
                {job.title}
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6B7280]">
                <span className="font-semibold text-[#374151]">
                  {job.company}
                </span>
                <span>{job.city}</span>
                <span>{t(job.remote ? "remote" : "onSite")}</span>
                <span>{t(job.jobType)}</span>
                <span>{t(LANGUAGES[job.language])}</span>
              </span>
              {reason && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                  <Star className="h-3.5 w-3.5" />
                  {t(reason(job, i))}
                </span>
              )}
            </span>
            <span className="col-start-2 flex flex-col md:col-start-auto md:items-end">
              <span
                className={`text-lg font-extrabold tracking-tight tabular-nums ${
                  job.salaryMin === null ? "text-[#6B7280]" : ""
                }`}
              >
                {salary(job)}
              </span>
              <span className="text-xs text-[#6B7280]">
                {job.salaryMin !== null && `${t("perMonth")}, `}
                {posted(job.postedDaysAgo).toLowerCase()}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return useSessionEmail() ? <MemberHome /> : <GuestHome />;
}

/**
 * Guest hero visual: the product loop in three real UI pieces (a matched job,
 * a résumé past 70%, an interview update) instead of decoration.
 */
function ProductPreview() {
  const t = useT();
  const { salary, posted } = useFormat();
  const job = DEMO_JOBS[0];
  const invited = DEMO_JOBS[3];
  const shadow = "shadow-[0_24px_48px_-24px_rgba(31,41,55,0.35)]";
  return (
    <div aria-hidden className="relative hidden h-[450px] xl:block">
      <div
        className={`absolute top-0 right-0 z-10 w-[260px] p-5 ${card} ${shadow}`}
      >
        <span className="text-xs font-bold text-[#6B7280]">
          {t("applicationProgress")}
        </span>
        <div className="mt-2 text-sm font-extrabold">{invited.title}</div>
        <div className="text-xs text-[#6B7280]">{invited.company}</div>
        <span className="mt-3 inline-block rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-bold text-[#15803D]">
          {t("interviewInvited")}
        </span>
      </div>

      <div
        className={`absolute top-[138px] left-0 z-20 w-[310px] p-6 ${card} ${shadow}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#6B7280]">
            {t("smartMatching")}
          </span>
          <span className="text-xs text-[#6B7280]">
            {posted(job.postedDaysAgo)}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F2937] text-lg font-extrabold text-white">
            {monogram(job.company)}
          </span>
          <div>
            <div className="font-extrabold">{job.title}</div>
            <div className="text-sm text-[#6B7280]">{job.company}</div>
          </div>
        </div>
        <div className="mt-4 text-xl font-extrabold tracking-tight tabular-nums">
          {salary(job)}
        </div>
        <ul className="m-0 mt-4 flex list-none flex-col gap-1.5 border-0 border-t border-dashed border-[#E5E7EB] p-0 pt-4 text-sm">
          {(["matchesYourSkills", "matchesYourPreferredCity"] as const).map(
            (k) => (
              <li key={k} className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#15803D]" />
                {t(k)}
              </li>
            ),
          )}
        </ul>
      </div>

      <div
        className={`absolute right-0 bottom-0 z-30 w-[230px] p-5 ${card} ${shadow}`}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-[#6B7280]">
            {t("resumeCompleteness")}
          </span>
          <span className="text-xl font-extrabold tabular-nums">72%</span>
        </div>
        <div className="relative mt-3 h-2 rounded-full bg-[#F1F2F4]">
          <div className="absolute inset-y-0 left-0 w-[72%] rounded-full bg-[#15803D]" />
          <div
            className="absolute -top-1 -bottom-1 w-0.5 rounded bg-[#1F2937]"
            style={{ left: `${APPLY_THRESHOLD}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** Landing page: what the product does, why log in, and a job search (F02). */
function GuestHome() {
  const t = useT();
  const lang = useLang();
  const base = `/${lang}`;
  const login = `${base}/login`;
  const steps: { title: MessageKey; text: string }[] = [
    {
      title: "logInWithYourEmail",
      text: t("weSendA6DigitCodeNoPasswordNeeded"),
    },
    {
      title: "completeYourResume",
      text: t("completeAtLeastPercentOfYourResumeToApply", {
        percent: APPLY_THRESHOLD,
      }),
    },
    {
      title: "applyAndTrack",
      text: t("everyApplicationShowsUpInMessagesAndYourGrowthRecord"),
    },
  ];

  const features: { key: MessageKey; text: MessageKey; className: string }[] = [
    { key: "cvEditor", text: "tailorYourResumeForEachJob", className: "" },
    {
      key: "careerClasses",
      text: "resumeInterviewAndTechnicalCourses",
      className: "",
    },
    {
      key: "growthRecord",
      text: "trackEveryStepOfYourCareer",
      className: "lg:col-span-2",
    },
  ];

  const loginTag = (
    <span className="flex items-center gap-1.5 text-xs font-bold">
      <Lock className="h-3.5 w-3.5" />
      {t("logInToUse")}
    </span>
  );

  return (
    <main>
      <Hero
        title={t("findTheJobThatFitsYourNextStep")}
        subtitle={t("employersAcrossIndonesiaAreHiringGraduatesAndInterns")}
        aside={<ProductPreview />}
      />

      <section className="bg-[#1F2937] py-14 text-white">
        <div className={container}>
          <SectionHeading title={t("howItWorks")} />
          <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
            {steps.map(({ title, text }, i) => (
              <li
                key={title}
                className="flex gap-4 rounded-[20px] border border-solid border-white/10 bg-white/[0.04] p-6"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white text-base font-extrabold text-[#1F2937]">
                  {i + 1}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-extrabold tracking-tight">
                    {t(title)}
                  </span>
                  <span className="text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className={`${container} grid gap-4 pt-16 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2`}
      >
        <Link
          to={login}
          className="relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[20px] bg-[#DCE4EF] p-7 text-[#1F2937] no-underline sm:col-span-2 lg:row-span-2"
        >
          <Star className="absolute -top-10 -right-10 h-64 w-64 text-[#1F2937]/[0.06]" />
          <span className="relative text-[#4B5563]">{loginTag}</span>
          <span className="relative flex flex-col">
            <span className="text-[32px] leading-tight font-extrabold tracking-tight">
              {t("smartMatching")}
            </span>
            <span className="mt-2 max-w-sm text-base text-[#4B5563]">
              {t("jobsPickedFromYourResume")}
            </span>
          </span>
        </Link>
        {features.map(({ key, text, className }) => (
          <Link
            key={key}
            to={login}
            className={`group flex flex-col justify-between gap-6 p-6 no-underline ${card} ${className}`}
          >
            <span className="flex flex-col gap-2">
              <span className="text-[#6B7280]">{loginTag}</span>
              <span className="text-xl font-extrabold tracking-tight text-[#1F2937] group-hover:underline">
                {t(key)}
              </span>
            </span>
            <span className="text-sm text-[#6B7280]">{t(text)}</span>
          </Link>
        ))}
      </section>

      <section className={`${container} pt-16`}>
        <SectionHeading title={t("latestJobs")} to={`${base}/jobs`} />
        <JobList jobs={DEMO_JOBS.slice(0, 5)} />
      </section>

      <section className={`${container} pt-16`}>
        <SectionHeading
          title={t("featuredEmployers")}
          to={`${base}/companies`}
        />
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_EMPLOYERS.map((c) => (
            <li key={c.name}>
              <Link
                to={`${base}/companies`}
                className={`group flex h-full items-center gap-4 p-5 no-underline sm:flex-col sm:items-start sm:gap-5 sm:p-6 ${card}`}
              >
                <span
                  aria-hidden
                  className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-[#1F2937] text-xl font-extrabold text-white"
                >
                  {monogram(c.name)}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex items-center gap-1.5 font-extrabold text-[#1F2937]">
                    {c.name}
                    <Verified label={t("verified")} />
                  </span>
                  <span className="text-sm text-[#6B7280]">{c.industry}</span>
                  <span className="mt-1 text-sm font-bold text-[#374151]">
                    {t("countOpenPositions", { count: c.openings })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${container} pt-16`}>
        <div className="relative flex flex-col items-start gap-5 overflow-hidden rounded-[20px] bg-[#1F2937] p-8 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <Star className="pointer-events-none absolute -right-12 -bottom-16 h-60 w-60 text-white/[0.06]" />
          <div className="relative flex flex-col gap-2">
            <h2 className="m-0 text-2xl font-extrabold tracking-tight md:text-[28px]">
              {t("yourNextJobStartsHere")}
            </h2>
            <p className="m-0 text-white/80">
              {t("newHereLoggingInWithYourEmailCreatesYourAccount")}
            </p>
          </div>
          <Link
            to={login}
            className="relative rounded-full bg-[#E8392B] px-7 py-3 text-base font-bold text-white no-underline hover:bg-[#C2281B]"
          >
            {t("logIn")}
          </Link>
        </div>
      </section>
    </main>
  );
}

/**
 * Signed-in Home, built around the product loop: résumé to 70%, apply,
 * track (report §2), then matched jobs and classes that close skill gaps.
 */
function MemberHome() {
  const t = useT();
  const lang = useLang();
  const base = `/${lang}`;

  const filled = new Set(DEMO_FILLED);
  const percent = completeness(filled);
  const ready = canApply(percent);
  // The fewest missing sections that lift the résumé over the 70% rule.
  const toFill: { key: (typeof RESUME_SECTIONS)[number]; weight: number }[] =
    [];
  let reached = percent;
  for (const key of RESUME_SECTIONS.filter((s) => !filled.has(s)).sort(
    (a, b) => WEIGHTS[b] - WEIGHTS[a],
  )) {
    if (reached >= APPLY_THRESHOLD) break;
    toFill.push({ key, weight: WEIGHTS[key] });
    reached += WEIGHTS[key];
  }

  const inPreferredProvince = (job: DemoJob) =>
    job.province === DEMO_INTENTION.province;
  const jobs = [...DEMO_JOBS]
    .sort((a, b) => +inPreferredProvince(b) - +inPreferredProvince(a))
    .slice(0, 5);

  const stepLabel = (current: number) => (
    <span className="text-xs font-bold text-[#6B7280]">
      {t("stepCurrentOfTotal", { current, total: 3 })}
    </span>
  );

  return (
    <main>
      <Hero
        title={t("welcomeBack")}
        subtitle={t("jobsPickedFromYourResumeAndJobIntention")}
      >
        <div className="h-10" />
      </Hero>

      {/* The product loop. Step 1 is the eye-catcher: it says exactly what
          unlocks applying instead of only blocking it (report §2, F18). */}
      <section className={`${container} relative -mt-14`}>
        <ol className="m-0 grid list-none gap-4 p-0 lg:grid-cols-[1.5fr_1fr_1fr]">
          <li
            className={`flex flex-col gap-4 p-6 shadow-[0_20px_48px_-24px_rgba(31,41,55,0.45)] md:p-7 ${card} ${
              ready ? "" : "ring-2 ring-[#D97706]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                {stepLabel(1)}
                <h2 className="m-0 text-xl font-extrabold tracking-tight">
                  {t("completeYourResume")}
                </h2>
              </div>
              <span className="text-4xl font-extrabold tracking-tight tabular-nums">
                {percent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={t("resumeCompleteness")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="relative h-2.5 rounded-full bg-[#F1F2F4]"
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${ready ? "bg-[#15803D]" : "bg-[#D97706]"}`}
                style={{ width: `${percent}%` }}
              />
              <div
                aria-hidden
                className="absolute -top-1 -bottom-1 w-0.5 rounded bg-[#1F2937]"
                style={{ left: `${APPLY_THRESHOLD}%` }}
              />
            </div>
            {!ready && (
              <>
                <p className="m-0 text-sm font-semibold text-[#92400E]">
                  {t("fillInNMoreSectionsToStartApplying", {
                    n: toFill.length,
                  })}
                </p>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {toFill.map(({ key, weight }) => (
                    <li key={key}>
                      <Link
                        to={`${base}/cv-editor`}
                        className="flex items-center gap-2 rounded-full border border-solid border-[#F3D9B1] bg-[#FFF7E6] px-3.5 py-1.5 text-sm font-semibold text-[#1F2937] no-underline hover:border-[#D97706]"
                      >
                        {t(key)}
                        <span className="font-extrabold text-[#15803D]">
                          +{weight}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>

          <li
            className={`flex flex-col gap-4 border border-solid border-[#E5E7EB] p-6 ${card}`}
          >
            <div className="flex flex-col gap-1">
              {stepLabel(2)}
              <h2 className="m-0 text-xl font-extrabold tracking-tight">
                {t("applyToJobs")}
              </h2>
            </div>
            {ready ? (
              <Link to={`${base}/jobs`} className={darkButton}>
                {t("applyNow")}
              </Link>
            ) : (
              <span className="flex items-center gap-2 rounded-xl bg-[#F4F5F7] px-3.5 py-3 text-sm font-semibold text-[#4B5563]">
                <Lock className="h-4 w-4 flex-none" />
                {t("unlocksAtPercent", { percent: APPLY_THRESHOLD })}
              </span>
            )}
            <Link
              to={`${base}/applications`}
              className="mt-auto flex flex-col gap-0.5 text-sm no-underline"
            >
              <span className="font-bold text-[#1F2937]">
                {t("myApplications")}
              </span>
              <span className="text-[#6B7280]">{t("noApplicationsYet")}</span>
            </Link>
          </li>

          <li
            className={`flex flex-col gap-4 border border-solid border-[#E5E7EB] p-6 ${card}`}
          >
            <div className="flex flex-col gap-1">
              {stepLabel(3)}
              <h2 className="m-0 text-xl font-extrabold tracking-tight">
                {t("trackYourProgress")}
              </h2>
            </div>
            <ul className="m-0 mt-auto flex list-none flex-col gap-3 p-0 text-sm">
              {(
                [
                  ["messages", "noMessagesYet", "/messages"],
                  [
                    "growthRecord",
                    "trackEveryStepOfYourCareer",
                    "/growth-record",
                  ],
                ] as const
              ).map(([title, text, path]) => (
                <li key={title}>
                  <Link
                    to={base + path}
                    className="flex flex-col gap-0.5 no-underline"
                  >
                    <span className="font-bold text-[#1F2937]">{t(title)}</span>
                    <span className="text-[#6B7280]">{t(text)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ol>
      </section>

      <section className={`${container} pt-16`}>
        <SectionHeading
          title={t("recommendedJobs")}
          to={`${base}/recommendations`}
        />
        <JobList
          jobs={jobs}
          // shortcut: demo reasons; the matching API will return the real one.
          reason={(job, i) =>
            inPreferredProvince(job) && i % 2 === 0
              ? "matchesYourPreferredCity"
              : "matchesYourSkills"
          }
        />
      </section>

      <section className={`${container} pt-16`}>
        <SectionHeading title={t("suggestedCourses")} to={`${base}/classes`} />
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {DEMO_COURSES.map((c) => (
            <li key={c.id}>
              <Link
                to={`${base}/classes`}
                className={`group flex h-full flex-col gap-3 p-6 no-underline ${card}`}
              >
                <span className="text-xs font-bold text-[#6B7280]">
                  {c.category}
                </span>
                <span className="text-lg leading-snug font-extrabold tracking-tight text-[#1F2937] group-hover:underline">
                  {c.title}
                </span>
                <span className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-sm">
                  <span className="rounded-full bg-[#ECFDF3] px-3 py-1 font-bold text-[#15803D]">
                    {t("chapters1And2AreFree")}
                  </span>
                  <span className="text-[#6B7280]">
                    {c.chapters} {t("chapters").toLowerCase()}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
