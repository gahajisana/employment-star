import {
  Button,
  Cascader,
  ConfigProvider,
  Input,
  InputNumber,
  Select,
  Space,
} from "antd";
import { useState } from "react";

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
import {
  APPLY_THRESHOLD,
  canApply,
  type CompletenessPart,
  completeness,
  DEMO_FILLED,
  DEMO_INTENTION,
  DEMO_PROFILE,
  missingSections,
  RESUME_SECTIONS,
} from "../profile/demo";
import {
  type Field,
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

type IntentionForm = Omit<JobIntention, "jobSeekingStatus"> & {
  jobSeekingStatus: JobIntention["jobSeekingStatus"] | "";
};

const CITY_OPTIONS = Object.entries(REGIONS).map(([province, cities]) => ({
  value: province,
  label: province,
  children: cities.map((city) => ({ value: city, label: city })),
}));

const card = "rounded-[14px] border border-solid border-[#DDE3EA] bg-white p-5";
const tag =
  "inline-block rounded-full px-[9px] py-[3px] text-xs font-semibold whitespace-nowrap";
const tagOn = `${tag} bg-[#E6F1F0] text-[#0B4F4A]`;
const tagOff = `${tag} bg-[#F1E7DC] text-[#7C2D12]`;
const label = "text-[13px] font-semibold";
const muted = "text-[#4B5A6B]";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// shortcut: page state over demo data; nothing is saved to a server until
// the résumé and job-intention APIs exist (W3).
export default function Profile() {
  const t = useT();
  const lang = useLang();
  const [filled, setFilled] = useState(
    () => new Set<CompletenessPart>(DEMO_FILLED),
  );
  const [intention, setIntention] = useState<IntentionForm>(DEMO_INTENTION);
  const [saved, setSaved] = useState<IntentionForm>(DEMO_INTENTION);
  const [touched, setTouched] = useState<Set<Field>>(new Set());

  const percent = completeness(filled);
  const applyOk = canApply(percent);
  const missing = missingSections(filled);

  const check = validateJobIntention(intention);
  const errors = check.ok ? {} : check.errors;
  const update = (patch: Partial<IntentionForm>) =>
    setIntention((v) => ({ ...v, ...patch }));
  const touch = (field: Field) =>
    setTouched((s) => (s.has(field) ? s : new Set(s).add(field)));
  /** First error among `fields`, shown once the user has left any of them. */
  const errorText = (...fields: Field[]) => {
    if (!fields.some((f) => touched.has(f))) return undefined;
    const error = fields.map((f) => errors[f]).find(Boolean);
    return error ? t(error.key, error.vars) : undefined;
  };

  const roleError = errorText("expectedRole");
  const salaryError = errorText("salaryMin", "salaryMax");
  const cityError = errorText("province", "city");
  const statusError = errorText("jobSeekingStatus");
  const hint = (text?: string) =>
    text && <span className="text-[13px] text-[#B42318]">{text}</span>;

  const rupiah = new Intl.NumberFormat(LOCALES[lang]);
  const salaryInput = (field: "salaryMin" | "salaryMax", aria: MessageKey) => (
    <InputNumber<number>
      id={`profile-${field}`}
      aria-label={t(aria)}
      prefix="Rp"
      min={0}
      step={500_000}
      className="flex-1"
      status={salaryError ? "error" : undefined}
      value={intention[field]}
      formatter={(v) => (v === undefined ? "" : rupiah.format(v))}
      parser={(v) => Number(v?.replace(/\D/g, "") || 0)}
      onChange={(v) => update({ [field]: v ?? null })}
      onBlur={() => touch(field)}
    />
  );

  const gate = (
    <>
      {t("yourResumeIsPercentComplete", { percent })}.{" "}
      {t("completeAtLeastPercentOfYourResumeToApply", {
        percent: APPLY_THRESHOLD,
      })}
      .
    </>
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0F766E",
          colorText: "#14213D",
          colorBorder: "#6B7A8C",
          borderRadius: 10,
          controlHeight: 44,
        },
      }}
    >
      <div className="min-h-screen bg-[#F4F6F8] text-[#14213D]">
        <main className="mx-auto flex max-w-[1140px] flex-wrap items-start gap-5 px-5 py-6">
          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <section className={`${card} flex flex-col gap-3`}>
              <div className="flex items-center gap-3.5">
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-[#E6F1F0] text-[22px] font-bold text-[#0B4F4A]"
                >
                  {initials(DEMO_PROFILE.name)}
                </div>
                <div className="min-w-0">
                  <h1 className="m-0 text-xl font-bold">{DEMO_PROFILE.name}</h1>
                  <div className={`text-sm ${muted}`}>
                    {DEMO_PROFILE.headline}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {saved.jobSeekingStatus && (
                  <span className={tagOn}>{t(saved.jobSeekingStatus)}</span>
                )}
                <span className={`${tag} bg-[#EEF2F7] text-[#28364A]`}>
                  {t("freshGraduate")}
                </span>
              </div>
              <dl className="m-0 flex flex-col gap-1 text-sm">
                {(
                  [
                    ["phoneNumber", DEMO_PROFILE.phone],
                    ["emailAddress", DEMO_PROFILE.email],
                    ["currentCity", DEMO_PROFILE.city],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key} className="[overflow-wrap:anywhere]">
                    <dt className={`inline ${muted}`}>{t(key)}: </dt>
                    <dd className="m-0 inline">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={`${card} flex flex-col gap-2.5`}>
              <h2 className="m-0 text-base font-bold">
                {t("resumeCompleteness")}
              </h2>
              <div className="text-[28px] font-bold">{percent}%</div>
              <div
                role="progressbar"
                aria-label={t("resumeCompleteness")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="relative h-3 overflow-hidden rounded-full bg-[#E3E8EE]"
              >
                <div
                  className={`h-full ${applyOk ? "bg-[#166534]" : "bg-[#B45309]"}`}
                  style={{ width: `${percent}%` }}
                />
                <div
                  aria-hidden="true"
                  className="absolute top-0 h-full w-0.5 bg-[#14213D]"
                  style={{ left: `${APPLY_THRESHOLD}%` }}
                />
              </div>
              <div
                className={`font-semibold ${applyOk ? "text-[#14532D]" : "text-[#7C2D12]"}`}
              >
                {applyOk
                  ? t("yourResumeIsPercentComplete", { percent })
                  : t("completeAtLeastPercentOfYourResumeToApply", {
                      percent: APPLY_THRESHOLD,
                    })}
              </div>
              {missing.length > 0 && (
                <div className={`text-[13px] ${muted}`}>
                  {t("missingSections")}:{" "}
                  {missing.map((id) => t(id)).join(", ")}
                </div>
              )}
            </section>
          </aside>

          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
            {!applyOk && (
              <div
                role="status"
                className={`${card} border-[#B45309] bg-[#FFF7ED] font-semibold text-[#7C2D12]`}
              >
                {gate}
              </div>
            )}

            <section
              className={`${card} flex flex-col gap-3.5`}
              aria-labelledby="job-intention-title"
            >
              <h2 id="job-intention-title" className="m-0 text-lg font-bold">
                {t("jobIntention")}
              </h2>
              <div className="grid gap-3.5 md:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <label className={label} htmlFor="profile-expectedRole">
                    {t("expectedRole")}
                  </label>
                  <Input
                    id="profile-expectedRole"
                    maxLength={ROLE_MAX}
                    status={roleError ? "error" : undefined}
                    value={intention.expectedRole}
                    onChange={(e) => update({ expectedRole: e.target.value })}
                    onBlur={() => touch("expectedRole")}
                  />
                  {hint(roleError)}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <label className={label} htmlFor="profile-salaryMin">
                    {t("expectedSalary")} ({t("perMonth").toLowerCase()})
                  </label>
                  <Space.Compact block>
                    {salaryInput("salaryMin", "minimumSalary")}
                    {salaryInput("salaryMax", "maximumSalary")}
                  </Space.Compact>
                  {hint(salaryError)}
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <label className={label} htmlFor="profile-city">
                    {t("preferredCity")}
                  </label>
                  <Cascader
                    id="profile-city"
                    showSearch
                    options={CITY_OPTIONS}
                    status={cityError ? "error" : undefined}
                    placeholder={t("selectCity")}
                    value={
                      intention.province
                        ? [intention.province, intention.city]
                        : undefined
                    }
                    displayRender={(labels) => [...labels].reverse().join(", ")}
                    onChange={(path) =>
                      update({
                        province: String(path?.[0] ?? ""),
                        city: String(path?.[1] ?? ""),
                      })
                    }
                    onBlur={() => touch("city")}
                  />
                  {hint(cityError)}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={label} htmlFor="profile-jobSeekingStatus">
                  {t("jobSeekingStatus")}
                </label>
                <Select
                  id="profile-jobSeekingStatus"
                  status={statusError ? "error" : undefined}
                  value={intention.jobSeekingStatus || undefined}
                  options={JOB_SEEKING_STATUSES.map((s) => ({
                    value: s,
                    label: t(s),
                  }))}
                  onChange={(jobSeekingStatus) => update({ jobSeekingStatus })}
                  onBlur={() => touch("jobSeekingStatus")}
                />
                {hint(statusError)}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="primary"
                  disabled={!check.ok}
                  onClick={() => {
                    setSaved(intention);
                    setFilled((f) => new Set(f).add("jobIntention"));
                  }}
                >
                  {t("saveChanges")}
                </Button>
                <Button
                  onClick={() => {
                    setIntention(saved);
                    setTouched(new Set());
                  }}
                >
                  {t("cancel")}
                </Button>
              </div>
            </section>

            <section
              className={`${card} flex flex-col gap-1`}
              aria-labelledby="online-resume-title"
            >
              <h2 id="online-resume-title" className="m-0 text-lg font-bold">
                {t("onlineResume")}
              </h2>
              <ul className="m-0 list-none p-0">
                {RESUME_SECTIONS.map((id) => (
                  <li
                    key={id}
                    className="flex min-h-11 items-center justify-between gap-3 border-0 border-t border-solid border-[#E3E8EE] py-2"
                  >
                    <span className="font-semibold">{t(id)}</span>
                    <span className={filled.has(id) ? tagOn : tagOff}>
                      {filled.has(id) ? t("filled") : t("notFilled")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}
