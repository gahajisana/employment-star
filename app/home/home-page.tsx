import {
  ArrowRightOutlined,
  CheckCircleFilled,
  DownOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  ConfigProvider,
  Empty,
  Flex,
  Layout,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { LOCALES, useLang, useT } from "../i18n";
import {
  DEMO_EMPLOYERS,
  DEMO_JOBS,
  type DemoEmployer,
  type DemoJob,
} from "./demo";
import { PreviewDrawer, type HomePreview } from "./preview-drawer";
import {
  EMPLOYER_PAGE_SIZE,
  JOB_PAGE_SIZE,
  filterEmployers,
  filterJobs,
  formatPosted,
  formatSalary,
  readFilters,
  writeFilters,
  type HomeFilters,
} from "./search";
import { SearchForm } from "./search-form";
import { HOME_THEME } from "./theme";
import "./home.css";

const FEATURES = [
  { title: "smartMatching", description: "recommendedFromYourResume" },
  { title: "cvEditing", description: "editYourCvToShowcaseYourPotential" },
  { title: "careerClasses", description: "cvInterviewAndTechnicalCourses" },
  { title: "digitalGrowthRecord", description: "trackEveryStepYouTake" },
] as const;

function PreviewCard({
  label,
  onOpen,
  children,
  size,
  className = "",
  bodyClassName,
  variant = "outlined",
  hoverable = true,
}: {
  label: string;
  onOpen: () => void;
  children: ReactNode;
  size?: "small";
  className?: string;
  bodyClassName?: string;
  variant?: "outlined" | "borderless";
  hoverable?: boolean;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <Card
      hoverable={hoverable}
      size={size}
      variant={variant}
      className={`home-preview ${className}`}
      classNames={{ body: bodyClassName }}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      {children}
    </Card>
  );
}

function JobCard({ job, onOpen }: { job: DemoJob; onOpen: () => void }) {
  const lang = useLang();
  const t = useT();

  return (
    <PreviewCard
      label={job.title}
      onOpen={onOpen}
      size="small"
      className="home-job"
      variant="borderless"
      hoverable={false}
    >
      <Flex vertical gap={6}>
        <Typography.Text strong className="home-job-title">
          {job.title}
        </Typography.Text>
        <Flex align="center" gap={8} wrap>
          <Typography.Text className="home-job-meta">
            {job.companyName}
          </Typography.Text>
          <Tooltip title={`${job.city}, ${job.province}`}>
            <Tag color="error" variant="filled">
              {job.city}
            </Tag>
          </Tooltip>
          <Tag color="processing" variant="filled">
            {t(job.workType)}
          </Tag>
          <Typography.Text className="home-job-meta">
            {formatSalary(job, lang)}
          </Typography.Text>
        </Flex>
        <Typography.Text className="home-job-meta">
          {formatPosted(job.postedDaysAgo, lang)} · {t("jobLanguage")}:{" "}
          {job.languages.map((language) => language.toUpperCase()).join(" / ")}{" "}
          · {t(job.jobType)}
        </Typography.Text>
      </Flex>
    </PreviewCard>
  );
}

function EmployerCard({
  employer,
  onOpen,
}: {
  employer: DemoEmployer;
  onOpen: () => void;
}) {
  const t = useT();

  return (
    <PreviewCard
      label={employer.name}
      onOpen={onOpen}
      variant="borderless"
      bodyClassName="home-employer-body"
    >
      <Flex vertical align="center" gap={20}>
        <Avatar shape="square" size={64}>
          {employer.initials}
        </Avatar>
        <Flex vertical align="center" gap={2}>
          <Space align="center" wrap>
            <Typography.Title level={3}>{employer.name}</Typography.Title>
            {employer.verified && (
              <Tooltip title={t("verified")}>
                <CheckCircleFilled
                  aria-label={t("verified")}
                  className="home-verified"
                />
              </Tooltip>
            )}
          </Space>
          <Typography.Text type="secondary" className="home-caption">
            {employer.industry}
          </Typography.Text>
        </Flex>
      </Flex>
    </PreviewCard>
  );
}

export function HomePage() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [resetKey, setResetKey] = useState(0);
  const [preview, setPreview] = useState<HomePreview | null>(null);

  const jobs = filterJobs(DEMO_JOBS, filters);
  const employers = filterEmployers(DEMO_EMPLOYERS, filters.keyword);
  const jobPage = Math.min(
    filters.page,
    Math.max(1, Math.ceil(jobs.length / JOB_PAGE_SIZE)),
  );
  const employerPage = Math.min(
    filters.employerPage,
    Math.max(1, Math.ceil(employers.length / EMPLOYER_PAGE_SIZE)),
  );
  const visibleJobs = jobs.slice(0, jobPage * JOB_PAGE_SIZE);
  const visibleEmployers = employers.slice(
    0,
    employerPage * EMPLOYER_PAGE_SIZE,
  );
  const moreJobs = visibleJobs.length < jobs.length;
  const moreEmployers = visibleEmployers.length < employers.length;
  const searching = !!(
    filters.keyword ||
    filters.province ||
    filters.education ||
    filters.jobTypes.length ||
    filters.workType ||
    filters.language ||
    filters.salaryMin !== null ||
    filters.salaryMax !== null
  );

  const commit = (next: HomeFilters) => {
    setParams(writeFilters(next, params), { preventScrollReset: true });
  };
  const update = (patch: Partial<HomeFilters>) => {
    commit({ ...filters, ...patch, page: 1, employerPage: 1 });
  };
  const clear = () => {
    setResetKey((value) => value + 1);
    commit(readFilters(new URLSearchParams()));
  };
  const openJob = (job: DemoJob) => setPreview({ kind: "job", item: job });
  const openEmployer = (id: string) => {
    const employer = DEMO_EMPLOYERS.find((item) => item.id === id);
    if (employer) setPreview({ kind: "employer", item: employer });
  };

  return (
    <ConfigProvider theme={HOME_THEME}>
      <Layout className="home-page">
        <Layout.Content className="home-container">
          <Flex vertical gap={22}>
            <Flex
              vertical
              align="center"
              gap={16}
              className="home-hero"
              aria-labelledby="home-title"
              role="region"
            >
              <Typography.Title
                id="home-title"
                level={1}
                className="home-hero-title"
              >
                {t("findTheJobThatFitsYourNextStep")}
              </Typography.Title>
              <SearchForm
                filters={filters}
                resetKey={resetKey}
                onChange={update}
                onClear={clear}
              />
            </Flex>

            <Row gutter={[14, 14]}>
              {FEATURES.map((feature) => (
                <Col key={feature.title} xs={24} sm={12} lg={6}>
                  <PreviewCard
                    label={t(feature.title)}
                    className="home-shortcut"
                    onOpen={() => {
                      if (feature.title === "cvEditing") {
                        navigate(`/${lang}/profile`);
                      } else {
                        setPreview({ kind: "feature", ...feature });
                      }
                    }}
                  >
                    <Flex vertical gap={8}>
                      <Typography.Title level={4}>
                        {t(feature.title)}
                      </Typography.Title>
                      <Typography.Text
                        type="secondary"
                        className="home-caption"
                      >
                        {t(feature.description)}
                      </Typography.Text>
                    </Flex>
                  </PreviewCard>
                </Col>
              ))}
            </Row>

            <Card
              role="region"
              aria-labelledby="home-jobs-title"
              className="home-section"
              classNames={{ body: "home-section-body" }}
            >
              <Flex vertical gap={24}>
                <Flex align="center" justify="space-between" gap="middle" wrap>
                  <Flex align="center" gap={12} wrap>
                    <Typography.Title
                      level={2}
                      id="home-jobs-title"
                      className="home-section-title"
                    >
                      {t(searching ? "searchResults" : "hotJobs")}
                    </Typography.Title>
                    <Typography.Text
                      role="status"
                      aria-live="polite"
                      type="secondary"
                      className="home-caption"
                    >
                      {t(
                        jobs.length === 1 ? "countJobFound" : "countJobsFound",
                        {
                          count: new Intl.NumberFormat(LOCALES[lang]).format(
                            jobs.length,
                          ),
                        },
                      )}
                    </Typography.Text>
                  </Flex>
                  <Space wrap>
                    <Select
                      size="small"
                      aria-label={t("sortBy")}
                      value={filters.sort}
                      options={[
                        { value: "newest", label: t("newest") },
                        { value: "highestSalary", label: t("highestSalary") },
                      ]}
                      onChange={(sort) => update({ sort })}
                    />
                    {moreJobs && (
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowRightOutlined aria-hidden />}
                        iconPlacement="end"
                        onClick={() =>
                          commit({
                            ...filters,
                            page: Math.ceil(jobs.length / JOB_PAGE_SIZE),
                          })
                        }
                      >
                        {t("viewAll")}
                      </Button>
                    )}
                  </Space>
                </Flex>

                {jobs.length ? (
                  <>
                    <Row gutter={[12, 0]}>
                      {visibleJobs.map((job) => (
                        <Col key={job.id} xs={24} md={12}>
                          <JobCard job={job} onOpen={() => openJob(job)} />
                        </Col>
                      ))}
                    </Row>
                    <Flex justify="center">
                      {moreJobs ? (
                        <Button
                          type="primary"
                          icon={<DownOutlined aria-hidden />}
                          iconPlacement="end"
                          onClick={() =>
                            commit({ ...filters, page: jobPage + 1 })
                          }
                        >
                          {t("loadMore")}
                        </Button>
                      ) : (
                        <Typography.Text type="secondary">
                          {t("youHaveSeenAllJobs")}
                        </Typography.Text>
                      )}
                    </Flex>
                  </>
                ) : (
                  <Empty
                    description={t("noJobsMatchYourFiltersTryRemovingSome")}
                  >
                    <Button onClick={clear}>{t("clearAll")}</Button>
                  </Empty>
                )}
              </Flex>
            </Card>

            <Card
              role="region"
              aria-labelledby="home-employers-title"
              className="home-section"
              classNames={{ body: "home-section-body" }}
            >
              <Flex vertical gap={24}>
                <Flex align="center" justify="space-between" gap="small" wrap>
                  <Typography.Title
                    id="home-employers-title"
                    level={2}
                    className="home-section-title"
                  >
                    {t("featuredEmployers")}
                  </Typography.Title>
                  {moreEmployers && (
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowRightOutlined aria-hidden />}
                      iconPlacement="end"
                      onClick={() =>
                        commit({
                          ...filters,
                          employerPage: Math.ceil(
                            employers.length / EMPLOYER_PAGE_SIZE,
                          ),
                        })
                      }
                    >
                      {t("viewAll")}
                    </Button>
                  )}
                </Flex>
                {employers.length ? (
                  <>
                    <Flex vertical className="home-employer-grid">
                      <Row gutter={[48, 24]}>
                        {visibleEmployers.map((employer) => (
                          <Col key={employer.id} xs={24} md={12}>
                            <EmployerCard
                              employer={employer}
                              onOpen={() => openEmployer(employer.id)}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Flex>
                    <Flex justify="center">
                      {moreEmployers ? (
                        <Button
                          type="primary"
                          icon={<DownOutlined aria-hidden />}
                          iconPlacement="end"
                          onClick={() =>
                            commit({
                              ...filters,
                              employerPage: employerPage + 1,
                            })
                          }
                        >
                          {t("loadMore")}
                        </Button>
                      ) : (
                        <Typography.Text type="secondary">
                          {t("youHaveSeenAllEmployers")}
                        </Typography.Text>
                      )}
                    </Flex>
                  </>
                ) : (
                  <Empty description={t("noCompaniesMatchYourSearch")}>
                    <Button onClick={clear}>{t("clearAll")}</Button>
                  </Empty>
                )}
              </Flex>
            </Card>
          </Flex>
        </Layout.Content>
        <Layout.Footer className="home-footer-accent" aria-hidden />
        <PreviewDrawer
          preview={preview}
          onClose={() => setPreview(null)}
          onJob={openJob}
          onEmployer={openEmployer}
        />
      </Layout>
    </ConfigProvider>
  );
}
