import { DownOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Tooltip,
} from "antd";
import { useState } from "react";

import { REGIONS } from "../data/regions";
import { LOCALES, useLang, useT } from "../i18n";
import {
  EDUCATION_LABELS,
  EDUCATION_LEVELS,
  JOB_TYPES,
  WORK_TYPES,
  type JobType,
} from "./demo";
import { FilterPopover } from "./filter-popover";
import {
  KEYWORD_MAX,
  formatSalary,
  salaryError,
  type HomeFilters,
  type SalaryRange,
} from "./search";

interface SearchFormProps {
  filters: HomeFilters;
  resetKey: number;
  onChange: (patch: Partial<HomeFilters>) => void;
  onClear: () => void;
}

function KeywordSearch({
  keyword,
  onSearch,
}: {
  keyword: string;
  onSearch: (keyword: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState(keyword);

  return (
    <Flex align="center" gap={8} className="home-keyword-bar">
      <Input
        id="home-keyword"
        aria-label={t("searchJobsOrCompanies")}
        placeholder={t("searchByJobTitleSkillsOrCompany")}
        className="home-keyword-input"
        variant="borderless"
        value={draft}
        maxLength={KEYWORD_MAX}
        allowClear
        onChange={(event) => setDraft(event.target.value)}
        onClear={() => onSearch("")}
        onPressEnter={() => onSearch(draft.trim())}
      />
      <Button type="primary" onClick={() => onSearch(draft.trim())}>
        {t("search")}
      </Button>
    </Flex>
  );
}

function SalaryInputs({
  filters,
  resetKey,
  onChange,
}: Omit<SearchFormProps, "onClear">) {
  const lang = useLang();
  const t = useT();
  const source = `${filters.salaryMin ?? ""}:${filters.salaryMax ?? ""}:${resetKey}`;
  const [draft, setDraft] = useState(() => ({
    source,
    salaryMin: filters.salaryMin,
    salaryMax: filters.salaryMax,
  }));

  // Keep invalid, half-typed values locally. Only a changed URL range or an
  // explicit reset replaces them; switching /en <-> /id leaves them intact.
  if (draft.source !== source) {
    setDraft({
      source,
      salaryMin: filters.salaryMin,
      salaryMax: filters.salaryMax,
    });
  }

  const error = salaryError(draft);
  const number = new Intl.NumberFormat(LOCALES[lang]);
  const update = (field: keyof SalaryRange, value: number | null) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (!salaryError(next)) {
      onChange({ salaryMin: next.salaryMin, salaryMax: next.salaryMax });
    }
  };

  return (
    <Form.Item
      label={`${t("salaryRange")} (${t("perMonth").toLowerCase()})`}
      htmlFor="home-salary-min"
      validateStatus={error ? "error" : undefined}
      help={error ? t(error) : undefined}
      extra={
        !error && (draft.salaryMin !== null || draft.salaryMax !== null)
          ? formatSalary(draft, lang)
          : undefined
      }
    >
      <Flex gap={8}>
        {(["salaryMin", "salaryMax"] as const).map((field) => (
          <InputNumber<number | string>
            key={field}
            className="home-salary-input"
            id={field === "salaryMin" ? "home-salary-min" : "home-salary-max"}
            aria-label={t(
              field === "salaryMin" ? "minimumSalary" : "maximumSalary",
            )}
            aria-invalid={!!error}
            placeholder={t(
              field === "salaryMin" ? "minimumSalary" : "maximumSalary",
            )}
            prefix="Rp"
            min={0}
            max={Number.MAX_SAFE_INTEGER}
            precision={0}
            step={500_000}
            value={draft[field]}
            status={error ? "error" : undefined}
            formatter={(value, info) =>
              info.userTyping
                ? info.input
                : value === undefined || value === ""
                  ? ""
                  : number.format(Number(value))
            }
            parser={(value) => (value ?? "").replace(/[^\d-]/g, "")}
            onChange={(value) =>
              update(field, value === null ? null : Number(value))
            }
          />
        ))}
      </Flex>
    </Form.Item>
  );
}

export function SearchForm({
  filters,
  resetKey,
  onChange,
  onClear,
}: SearchFormProps) {
  const lang = useLang();
  const t = useT();
  const number = new Intl.NumberFormat(LOCALES[lang]);
  const [openFilter, setOpenFilter] = useState<
    "type" | "location" | "salary" | null
  >(null);
  const toggle =
    (filter: NonNullable<typeof openFilter>) => (open: boolean) => {
      setOpenFilter((current) =>
        open ? filter : current === filter ? null : current,
      );
    };
  const chips: {
    key: string;
    label: string;
    displayLabel: string;
    remove: () => void;
  }[] = [];
  const chip = (
    key: string,
    label: string,
    value: string | number | null,
    patch: Partial<HomeFilters>,
  ) => {
    if (value !== "" && value !== null) {
      const text = String(value);
      const limit = key === "q" ? 16 : 24;
      chips.push({
        key,
        label: `${label}: ${value}`,
        displayLabel: `${label}: ${text.length > limit ? `${text.slice(0, limit)}…` : text}`,
        remove: () => onChange(patch),
      });
    }
  };

  chip("q", t("keyword"), filters.keyword, { keyword: "" });
  chip("province", t("province"), filters.province, { province: "", city: "" });
  chip("city", t("city"), filters.city, { city: "" });
  chip("education", t("education"), filters.education, { education: "" });
  chip("workType", t("workType"), filters.workType ? t(filters.workType) : "", {
    workType: "",
  });
  chip(
    "language",
    t("jobLanguage"),
    filters.language
      ? t(filters.language === "en" ? "english" : "indonesian")
      : "",
    { language: "" },
  );
  chip(
    "salaryMin",
    t("minimumSalary"),
    filters.salaryMin === null
      ? null
      : `Rp ${number.format(filters.salaryMin)}`,
    { salaryMin: null },
  );
  chip(
    "salaryMax",
    t("maximumSalary"),
    filters.salaryMax === null
      ? null
      : `Rp ${number.format(filters.salaryMax)}`,
    { salaryMax: null },
  );
  if (filters.sort !== "newest") {
    chip("sort", t("sortBy"), t(filters.sort), { sort: "newest" });
  }
  filters.jobTypes.forEach((jobType) => {
    chip(`jobType-${jobType}`, t("jobType"), t(jobType), {
      jobTypes: filters.jobTypes.filter((value) => value !== jobType),
    });
  });

  return (
    <Flex vertical gap={10} className="home-search">
      <Form layout="vertical" component={false}>
        <KeywordSearch
          key={`${filters.keyword}:${resetKey}`}
          keyword={filters.keyword}
          onSearch={(keyword) => onChange({ keyword })}
        />

        <Flex align="center" justify="center" gap={10} wrap>
          <FilterPopover
            id="home-type-filter"
            label={t("jobType")}
            title={`${t("jobType")} · ${t("education")}`}
            open={openFilter === "type"}
            onOpenChange={toggle("type")}
          >
            <Form.Item label={t("jobType")} htmlFor="home-job-type">
              <Select<JobType[]>
                id="home-job-type"
                aria-label={t("jobType")}
                mode="multiple"
                maxTagCount="responsive"
                allowClear
                placeholder={t("all")}
                value={filters.jobTypes}
                options={JOB_TYPES.map((value) => ({ value, label: t(value) }))}
                onChange={(jobTypes) => onChange({ jobTypes })}
              />
            </Form.Item>
            <Form.Item label={t("education")} htmlFor="home-education">
              <Select
                id="home-education"
                aria-label={t("education")}
                allowClear
                placeholder={t("any")}
                value={filters.education || undefined}
                options={EDUCATION_LEVELS.map((value) => ({
                  value,
                  label: `${value} — ${t(EDUCATION_LABELS[value])}`,
                }))}
                onChange={(education) =>
                  onChange({ education: education ?? "" })
                }
              />
            </Form.Item>
          </FilterPopover>

          <Select
            id="home-work-type"
            aria-label={t("workType")}
            className="home-filter"
            allowClear
            placeholder={t("workType")}
            suffix={
              <DownOutlined className="home-filter-chevron" aria-hidden />
            }
            value={filters.workType || undefined}
            options={WORK_TYPES.map((value) => ({ value, label: t(value) }))}
            onChange={(workType) => onChange({ workType: workType ?? "" })}
          />

          <FilterPopover
            id="home-location-filter"
            label={t("location")}
            open={openFilter === "location"}
            onOpenChange={toggle("location")}
          >
            <Form.Item label={t("province")} htmlFor="home-province">
              <Select
                id="home-province"
                aria-label={t("province")}
                showSearch
                optionFilterProp="label"
                allowClear
                placeholder={t("allProvinces")}
                value={filters.province || undefined}
                options={Object.keys(REGIONS).map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(province) =>
                  onChange({ province: province ?? "", city: "" })
                }
              />
            </Form.Item>
            <Form.Item label={t("city")} htmlFor="home-city">
              <Select
                id="home-city"
                aria-label={t("city")}
                showSearch
                optionFilterProp="label"
                allowClear
                disabled={!filters.province}
                placeholder={t("allCities")}
                value={filters.city || undefined}
                options={(REGIONS[filters.province] ?? []).map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(city) => onChange({ city: city ?? "" })}
              />
            </Form.Item>
          </FilterPopover>

          <FilterPopover
            id="home-salary-filter"
            label={t("salary")}
            open={openFilter === "salary"}
            onOpenChange={toggle("salary")}
          >
            <SalaryInputs
              filters={filters}
              resetKey={resetKey}
              onChange={onChange}
            />
          </FilterPopover>

          <Select
            id="home-job-language"
            aria-label={t("jobLanguage")}
            className="home-filter"
            allowClear
            placeholder={t("language")}
            suffix={
              <DownOutlined className="home-filter-chevron" aria-hidden />
            }
            value={filters.language || undefined}
            options={[
              { value: "en", label: t("english") },
              { value: "id", label: t("indonesian") },
            ]}
            onChange={(language) => onChange({ language: language ?? "" })}
          />

          <Tooltip title={t("clearAll")}>
            <Button
              type="text"
              icon={<ReloadOutlined aria-hidden />}
              aria-label={t("clearAll")}
              className="home-clear"
              onClick={() => {
                setOpenFilter(null);
                onClear();
              }}
            />
          </Tooltip>
        </Flex>
      </Form>

      {!!chips.length && (
        <Flex justify="center" gap={8} wrap>
          {chips.map(({ key, label, displayLabel, remove }) => (
            <Tooltip key={key} title={label} trigger={["hover", "focus"]}>
              <Tag
                classNames={{
                  root: "home-filter-chip",
                  content: "home-filter-chip-label",
                }}
                closable
                onClose={(event) => {
                  event.preventDefault();
                  remove();
                }}
              >
                {displayLabel}
              </Tag>
            </Tooltip>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
