import { env } from "cloudflare:workers";
import {
  Button,
  Cascader,
  ConfigProvider,
  Input,
  InputNumber,
  Select,
  Space,
} from "antd";
import { useState, type KeyboardEvent } from "react";
import { Form, redirect, useLoaderData } from "react-router";

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
import { getCurrentUser } from "../lib/auth/session.server";
import {
  type BasicField,
  type BasicInfo,
  NAME_MAX,
  URL_MAX,
  validateBasicInfo,
} from "../profile/basic-info";
import {
  APPLY_THRESHOLD,
  canApply,
  type CompletenessPart,
  completeness,
  DEMO_FILLED,
  DEMO_INTENTION,
  DEMO_PROFILE,
} from "../profile/demo";
import {
  type Field,
  type FieldError,
  JOB_SEEKING_STATUSES,
  type JobIntention,
  ROLE_MAX,
  validateJobIntention,
} from "../profile/job-intention";
import type { Route } from "./+types/profile";

export function meta({ params }: Route.MetaArgs) {
  const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
  return [{ title: translate(lang, "myProfile") }];
}

/** Private page (F04): guests go to login and come back here afterwards. */
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await getCurrentUser(request, env);
  if (!user) {
    const { pathname } = new URL(request.url);
    throw redirect(
      `/${params.lang}/login?redirectTo=${encodeURIComponent(pathname)}`,
    );
  }
  return { email: user.email };
}

type IntentionForm = Omit<JobIntention, "jobSeekingStatus"> & {
  jobSeekingStatus: JobIntention["jobSeekingStatus"] | "";
};

const TABS = [
  "basicInformation",
  "jobIntention",
  "myApplications",
] as const satisfies readonly MessageKey[];
type Tab = (typeof TABS)[number];

const CITY_OPTIONS = Object.entries(REGIONS).map(([province, cities]) => ({
  value: province,
  label: province,
  children: cities.map((city) => ({ value: city, label: city })),
}));

const label = "text-sm font-bold text-[#374151]";
const errorClass = "text-[13px] text-[#B42318]";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Field errors are shown once the user has left any of the given fields. */
function useTouched<F extends string>() {
  const [touched, setTouched] = useState<Set<F>>(new Set());
  const touch = (field: F) =>
    setTouched((s) => (s.has(field) ? s : new Set(s).add(field)));
  const reset = () => setTouched(new Set());
  const firstError = (
    errors: Partial<Record<F, FieldError>>,
    ...fields: F[]
  ): FieldError | undefined =>
    fields.some((f) => touched.has(f))
      ? fields.map((f) => errors[f]).find(Boolean)
      : undefined;
  return { touch, reset, firstError };
}

// shortcut: page state over demo data; nothing is saved to a server until
// the profile and job-intention APIs exist (W3).
export default function Profile() {
  const { email } = useLoaderData<typeof loader>();
  const t = useT();
  const lang = useLang();
  const [tab, setTab] = useState<Tab>("basicInformation");
  const [filled, setFilled] = useState(
    () => new Set<CompletenessPart>(DEMO_FILLED),
  );

  const [basic, setBasic] = useState<BasicInfo>(DEMO_PROFILE);
  const [savedBasic, setSavedBasic] = useState<BasicInfo>(DEMO_PROFILE);
  const basicTouched = useTouched<BasicField>();
  const basicCheck = validateBasicInfo(basic);
  const basicErrors = basicCheck.ok ? {} : basicCheck.errors;
  const basicChanged =
    basicCheck.ok &&
    JSON.stringify(basicCheck.value) !== JSON.stringify(savedBasic);

  const [intention, setIntention] = useState<IntentionForm>(DEMO_INTENTION);
  const [savedIntention, setSavedIntention] =
    useState<IntentionForm>(DEMO_INTENTION);
  const intentionTouched = useTouched<Field>();
  const intentionCheck = validateJobIntention(intention);
  const intentionErrors = intentionCheck.ok ? {} : intentionCheck.errors;

  const percent = completeness(filled);
  const applyOk = canApply(percent);
  const markFilled = (part: CompletenessPart) =>
    setFilled((f) => new Set(f).add(part));

  /** Error text, linked to its field by id so screen readers announce it. */
  const say = (id: string, error?: FieldError) =>
    error && (
      <span id={`${id}-error`} className={errorClass}>
        {t(error.key, error.vars)}
      </span>
    );
  const invalid = (id: string, error?: FieldError) =>
    error
      ? {
          status: "error" as const,
          "aria-invalid": true,
          "aria-describedby": `${id}-error`,
        }
      : {};

  const onTabKey = (event: KeyboardEvent) => {
    const step =
      event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  const cityPicker = (
    id: string,
    value: { province: string; city: string },
    onChange: (v: { province: string; city: string }) => void,
    onBlur: () => void,
    error?: FieldError,
  ) => (
    <Cascader
      id={id}
      style={{ width: "100%" }}
      showSearch
      options={CITY_OPTIONS}
      {...invalid(id, error)}
      placeholder={t("selectCity")}
      value={value.province ? [value.province, value.city] : undefined}
      displayRender={(labels) => [...labels].reverse().join(", ")}
      onChange={(path) =>
        onChange({
          province: String(path?.[0] ?? ""),
          city: String(path?.[1] ?? ""),
        })
      }
      onBlur={onBlur}
    />
  );

  const basicPanel = () => {
    const update = (patch: Partial<BasicInfo>) =>
      setBasic((v) => ({ ...v, ...patch }));
    const { touch, firstError } = basicTouched;
    const nameError = firstError(basicErrors, "fullName");
    const whatsappError = firstError(basicErrors, "whatsapp");
    const cityError = firstError(basicErrors, "province", "city");
    const linkedinError = firstError(basicErrors, "linkedinUrl");
    return (
      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="basic-fullName">
            {t("fullName")}
          </label>
          <Input
            id="basic-fullName"
            maxLength={NAME_MAX}
            {...invalid("basic-fullName", nameError)}
            value={basic.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            onBlur={() => touch("fullName")}
          />
          {say("basic-fullName", nameError)}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="basic-email">
            {t("emailAddress")}
          </label>
          <Input
            id="basic-email"
            variant="filled"
            readOnly
            value={email ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="basic-whatsapp">
            {t("whatsappNumber")}
          </label>
          <Input
            id="basic-whatsapp"
            inputMode="tel"
            autoComplete="tel"
            {...invalid("basic-whatsapp", whatsappError)}
            value={basic.whatsapp}
            onChange={(e) => update({ whatsapp: e.target.value })}
            onBlur={() => touch("whatsapp")}
          />
          {say("basic-whatsapp", whatsappError)}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="basic-location">
            {t("location")}
          </label>
          {cityPicker(
            "basic-location",
            basic,
            (v) => update(v),
            () => touch("city"),
            cityError,
          )}
          {say("basic-location", cityError)}
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={label} htmlFor="basic-linkedinUrl">
            {t("linkedinUrl")}
          </label>
          <Input
            id="basic-linkedinUrl"
            type="url"
            maxLength={URL_MAX}
            placeholder="https://www.linkedin.com/in/…"
            {...invalid("basic-linkedinUrl", linkedinError)}
            value={basic.linkedinUrl}
            onChange={(e) => update({ linkedinUrl: e.target.value })}
            onBlur={() => touch("linkedinUrl")}
          />
          {say("basic-linkedinUrl", linkedinError)}
        </div>
        <div className="flex flex-wrap gap-2 border-0 border-t border-solid border-[#F1F2F4] pt-6 sm:col-span-2">
          <Button
            type="primary"
            disabled={!basicChanged}
            onClick={() => {
              if (!basicCheck.ok) return;
              setSavedBasic(basicCheck.value);
              setBasic(basicCheck.value);
              basicTouched.reset();
              markFilled("basicInformation");
            }}
          >
            {t("save")}
          </Button>
          <Button
            onClick={() => {
              setBasic(savedBasic);
              basicTouched.reset();
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  };

  const intentionPanel = () => {
    const update = (patch: Partial<IntentionForm>) =>
      setIntention((v) => ({ ...v, ...patch }));
    const { touch, firstError } = intentionTouched;
    const roleError = firstError(intentionErrors, "expectedRole");
    const salaryError = firstError(intentionErrors, "salaryMin", "salaryMax");
    const cityError = firstError(intentionErrors, "province", "city");
    const statusError = firstError(intentionErrors, "jobSeekingStatus");
    const rupiah = new Intl.NumberFormat(LOCALES[lang]);
    const salaryInput = (
      field: "salaryMin" | "salaryMax",
      aria: MessageKey,
    ) => (
      <InputNumber<number>
        id={`profile-${field}`}
        aria-label={t(aria)}
        prefix="Rp"
        min={0}
        step={500_000}
        className="flex-1"
        {...invalid("profile-salary", salaryError)}
        value={intention[field]}
        formatter={(v) => (v === undefined ? "" : rupiah.format(v))}
        parser={(v) => Number(v?.replace(/\D/g, "") || 0)}
        onChange={(v) => update({ [field]: v ?? null })}
        onBlur={() => touch(field)}
      />
    );
    return (
      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="profile-expectedRole">
            {t("expectedRole")}
          </label>
          <Input
            id="profile-expectedRole"
            maxLength={ROLE_MAX}
            {...invalid("profile-expectedRole", roleError)}
            value={intention.expectedRole}
            onChange={(e) => update({ expectedRole: e.target.value })}
            onBlur={() => touch("expectedRole")}
          />
          {say("profile-expectedRole", roleError)}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="profile-salaryMin">
            {t("expectedSalary")} ({t("perMonth").toLowerCase()})
          </label>
          <Space.Compact block>
            {salaryInput("salaryMin", "minimumSalary")}
            {salaryInput("salaryMax", "maximumSalary")}
          </Space.Compact>
          {say("profile-salary", salaryError)}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="profile-city">
            {t("preferredCity")}
          </label>
          {cityPicker(
            "profile-city",
            intention,
            (v) => update(v),
            () => touch("city"),
            cityError,
          )}
          {say("profile-city", cityError)}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="profile-jobSeekingStatus">
            {t("jobSeekingStatus")}
          </label>
          <Select
            id="profile-jobSeekingStatus"
            {...invalid("profile-jobSeekingStatus", statusError)}
            value={intention.jobSeekingStatus || undefined}
            options={JOB_SEEKING_STATUSES.map((s) => ({
              value: s,
              label: t(s),
            }))}
            onChange={(jobSeekingStatus) => update({ jobSeekingStatus })}
            onBlur={() => touch("jobSeekingStatus")}
          />
          {say("profile-jobSeekingStatus", statusError)}
        </div>
        <div className="flex flex-wrap gap-2 border-0 border-t border-solid border-[#F1F2F4] pt-6 sm:col-span-2">
          <Button
            type="primary"
            disabled={!intentionCheck.ok}
            onClick={() => {
              setSavedIntention(intention);
              markFilled("jobIntention");
            }}
          >
            {t("saveChanges")}
          </Button>
          <Button
            onClick={() => {
              setIntention(savedIntention);
              intentionTouched.reset();
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  };

  const panels: Record<Tab, () => React.ReactNode> = {
    basicInformation: basicPanel,
    jobIntention: intentionPanel,
    myApplications: () => (
      // shortcut: empty until the applications API (Rafi, W3) exists.
      <p className="m-0 text-[#6B7280]">{t("noApplicationsYet")}</p>
    ),
  };

  const meterColor = applyOk ? "bg-[#15803D]" : "bg-[#D97706]";

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#E8392B",
          borderRadius: 12,
          controlHeight: 44,
        },
      }}
    >
      <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-10 text-[#1F2937]">
        <section className="flex flex-col gap-5 rounded-[20px] bg-white p-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-[#1F2937] text-xl font-extrabold text-white"
            >
              {initials(savedBasic.fullName)}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="m-0 truncate text-2xl leading-tight font-extrabold tracking-tight">
                {savedBasic.fullName}
              </h1>
              <span className="truncate text-sm text-[#6B7280]">{email}</span>
            </div>
          </div>
          <Form method="post" action="/api/auth/logout">
            <input type="hidden" name="redirectTo" value={`/${lang}/login`} />
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-2 rounded-full border border-solid border-[#D9DCE1] bg-white px-4 py-2 text-sm font-bold text-[#374151] hover:border-[#B42318] hover:text-[#B42318] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2937]"
            >
              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M3 4.5A1.5 1.5 0 014.5 3h5a1 1 0 010 2H5v10h4.5a1 1 0 110 2h-5A1.5 1.5 0 013 15.5v-11zm9.3 1.8a1 1 0 011.4 0l3 3a1 1 0 010 1.4l-3 3a1 1 0 01-1.4-1.4l1.3-1.3H8a1 1 0 110-2h5.6l-1.3-1.3a1 1 0 010-1.4z" />
              </svg>
              {t("logOut")}
            </button>
          </Form>
        </section>

        <div className="grid gap-6 md:grid-cols-[300px_1fr] md:items-start">
          <aside className="flex flex-col gap-4">
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label={t("myProfile")}
              onKeyDown={onTabKey}
              className="flex flex-col gap-1 rounded-[20px] bg-white p-2"
            >
              {TABS.map((id) => {
                const selected = tab === id;
                return (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`panel-${id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setTab(id)}
                    className={`min-h-11 w-full cursor-pointer rounded-xl border-0 px-4 py-2.5 text-left text-[15px] focus-visible:outline-2 focus-visible:outline-[#1F2937] ${
                      selected
                        ? "bg-[#F4F5F7] font-bold text-[#1F2937]"
                        : "bg-transparent font-medium text-[#374151] hover:bg-[#F4F5F7]"
                    }`}
                  >
                    {t(id)}
                  </button>
                );
              })}
            </div>

            <section className="flex flex-col gap-3 rounded-[20px] bg-white p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="m-0 text-[15px] font-bold">
                  {t("resumeCompleteness")}
                </h2>
                <span className="text-xl font-extrabold tabular-nums">
                  {percent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={t("resumeCompleteness")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="relative h-2 rounded-full bg-[#F1F2F4]"
              >
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${meterColor}`}
                  style={{ width: `${percent}%` }}
                />
                {/* The 70% apply threshold (F18). */}
                <div
                  aria-hidden
                  className="absolute -top-1 -bottom-1 w-0.5 rounded bg-[#1F2937]"
                  style={{ left: `${APPLY_THRESHOLD}%` }}
                />
              </div>
              {!applyOk && (
                <p className="m-0 rounded-xl bg-[#FFF7E6] px-3.5 py-3 text-sm text-[#92400E]">
                  {t("completeAtLeastPercentOfYourResumeToApply", {
                    percent: APPLY_THRESHOLD,
                  })}
                </p>
              )}
            </section>
          </aside>

          <section
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="rounded-[20px] bg-white p-6 md:p-8"
          >
            <h2 className="mt-0 mb-6 text-xl font-extrabold tracking-tight">
              {t(tab)}
            </h2>
            {panels[tab]()}
          </section>
        </div>
      </main>
    </ConfigProvider>
  );
}
