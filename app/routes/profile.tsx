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
import { redirect, useLoaderData } from "react-router";

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

const label = "text-sm font-medium";
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
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="basic-fullName">
            {t("fullName")}
          </label>
          <Input
            id="basic-fullName"
            variant="filled"
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
            variant="filled"
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
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="basic-linkedinUrl">
            {t("linkedinUrl")}
          </label>
          <Input
            id="basic-linkedinUrl"
            variant="filled"
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
        <div className="flex flex-wrap gap-2">
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
      <div className="flex flex-col gap-5">
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
        <div className="flex flex-wrap gap-2">
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

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#1D4ED8", borderRadius: 8, controlHeight: 44 },
      }}
    >
      <main className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-8 text-[#1F2937]">
        <section className="rounded-xl border border-solid border-[#E5E7EB] bg-white p-5">
          <div className="flex items-center gap-4 rounded-lg bg-[#FEF1F0] p-5">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#E8392B] text-lg font-bold text-white"
            >
              {initials(savedBasic.fullName)}
            </div>
            <h1 className="m-0 text-lg font-bold">{savedBasic.fullName}</h1>
          </div>
        </section>

        <div className="grid overflow-hidden rounded-xl border border-solid border-[#E5E7EB] bg-white md:grid-cols-[minmax(260px,1fr)_2fr]">
          <aside className="border-0 border-[#E5E7EB] md:border-r md:border-solid">
            <div
              role="tablist"
              aria-orientation="vertical"
              aria-label={t("myProfile")}
              onKeyDown={onTabKey}
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
                    className={`block min-h-12 w-full cursor-pointer border-0 border-b border-solid border-[#E5E7EB] px-5 py-3.5 text-left text-base ${
                      selected
                        ? "bg-[#DBEAFE] font-semibold text-[#1D4ED8]"
                        : "bg-[#F7F7F8] text-[#1F2937]"
                    }`}
                  >
                    {t(id)}
                  </button>
                );
              })}
            </div>

            <section className="flex flex-col gap-3 p-6">
              <h2 className="m-0 border-0 border-l-4 border-solid border-[#1D4ED8] pl-2 text-xl font-bold text-[#1D4ED8]">
                {t("resumeCompleteness")}
              </h2>
              <div
                role="progressbar"
                aria-label={t("resumeCompleteness")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-2.5 overflow-hidden rounded-full bg-[#F1F1F3]"
              >
                <div
                  className={`h-full ${applyOk ? "bg-[#166534]" : "bg-[#E8392B]"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-[#6B7280]">{percent}%</div>
              {!applyOk && (
                <div className="rounded-lg border border-solid border-[#E8392B] bg-[#FEF1F0] p-4 text-[#C2281B]">
                  {t("completeAtLeastPercentOfYourResumeToApply", {
                    percent: APPLY_THRESHOLD,
                  })}
                </div>
              )}
            </section>
          </aside>

          <section
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="p-6"
          >
            <h2 className="mt-0 mb-6 border-0 border-b border-solid border-[#E5E7EB] pb-4 text-xl font-bold">
              {t(tab)}
            </h2>
            {panels[tab]()}
          </section>
        </div>
      </main>
    </ConfigProvider>
  );
}
