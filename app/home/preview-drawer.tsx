import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Flex,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import { useLang, useT, type MessageKey } from "../i18n";
import {
  DEMO_JOBS,
  EDUCATION_LABELS,
  type DemoEmployer,
  type DemoJob,
} from "./demo";
import { formatPosted, formatSalary } from "./search";

export type HomePreview =
  | { kind: "job"; item: DemoJob }
  | { kind: "employer"; item: DemoEmployer }
  | { kind: "feature"; title: MessageKey; description: MessageKey };

interface PreviewDrawerProps {
  preview: HomePreview | null;
  onClose: () => void;
  onJob: (job: DemoJob) => void;
  onEmployer: (employerId: string) => void;
}

export function PreviewDrawer({
  preview,
  onClose,
  onJob,
  onEmployer,
}: PreviewDrawerProps) {
  const t = useT();
  const lang = useLang();
  const title =
    preview?.kind === "feature"
      ? t(preview.title)
      : t(preview?.kind === "employer" ? "aboutTheCompany" : "jobDetails");

  return (
    <Drawer
      title={title}
      size="large"
      open={preview !== null}
      onClose={onClose}
      footer={
        <Space wrap>
          <Button onClick={onClose}>{t("close")}</Button>
          {preview?.kind === "job" && (
            <Tooltip title={t("thisFeatureWillBeAvailableInALaterUpdate")}>
              <Button type="primary" disabled>
                {t("applyNow")}
              </Button>
            </Tooltip>
          )}
        </Space>
      }
    >
      {preview?.kind === "feature" ? (
        <Flex vertical gap="large">
          <Typography.Paragraph>{t(preview.description)}</Typography.Paragraph>
          <Alert
            type="info"
            showIcon
            title={t("comingSoon")}
            description={t("thisFeatureWillBeAvailableInALaterUpdate")}
          />
        </Flex>
      ) : preview ? (
        <Flex vertical gap="large">
          <Alert
            type="info"
            showIcon
            title={t("frontEndPreview")}
            description={t(
              "theseAreSampleListingsApplicationsAndLiveCompanyDataWillBeConnectedLater",
            )}
          />

          {preview.kind === "job" ? (
            <>
              <Typography.Title level={3}>
                {preview.item.title}
              </Typography.Title>
              <Button
                type="link"
                onClick={() => onEmployer(preview.item.employerId)}
              >
                {preview.item.companyName}
              </Button>
              <Descriptions
                bordered
                column={1}
                size="small"
                items={[
                  {
                    key: "salary",
                    label: t("salary"),
                    children: formatSalary(preview.item, lang),
                  },
                  {
                    key: "location",
                    label: t("location"),
                    children: `${preview.item.city}, ${preview.item.province}`,
                  },
                  {
                    key: "jobType",
                    label: t("jobType"),
                    children: t(preview.item.jobType),
                  },
                  {
                    key: "workType",
                    label: t("workType"),
                    children: t(preview.item.workType),
                  },
                  {
                    key: "education",
                    label: t("educationRequired"),
                    children: preview.item.education
                      ? `${preview.item.education} — ${t(EDUCATION_LABELS[preview.item.education])}`
                      : t("notRequired"),
                  },
                  {
                    key: "language",
                    label: t("jobLanguage"),
                    children: preview.item.languages
                      .map((value) =>
                        t(value === "en" ? "english" : "indonesian"),
                      )
                      .join(", "),
                  },
                  {
                    key: "experience",
                    label: t("experience"),
                    children: t("freshGraduatesWelcome"),
                  },
                ]}
              />
              <Flex gap="small" wrap>
                {preview.item.skills.map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))}
              </Flex>
              <Typography.Text type="secondary">
                {formatPosted(preview.item.postedDaysAgo, lang)}
              </Typography.Text>
              <Typography.Title level={4}>
                {t("responsibilities")}
              </Typography.Title>
              <Typography.Paragraph>
                {preview.item.responsibilities}
              </Typography.Paragraph>
              <Typography.Title level={4}>{t("requirements")}</Typography.Title>
              <Typography.Paragraph>
                {preview.item.requirements}
              </Typography.Paragraph>
            </>
          ) : (
            <>
              <Typography.Title level={3}>{preview.item.name}</Typography.Title>
              <Descriptions
                bordered
                column={1}
                size="small"
                items={[
                  {
                    key: "industry",
                    label: t("industry"),
                    children: preview.item.industry,
                  },
                  {
                    key: "location",
                    label: t("location"),
                    children: `${preview.item.city}, ${preview.item.province}`,
                  },
                ]}
              />
              <Typography.Paragraph>
                {preview.item.description}
              </Typography.Paragraph>
              <Typography.Title level={4}>
                {t("openPositions")}
              </Typography.Title>
              <Flex vertical align="start" gap="small">
                {DEMO_JOBS.filter(
                  (job) => job.employerId === preview.item.id,
                ).map((job) => (
                  <Button key={job.id} type="link" onClick={() => onJob(job)}>
                    {job.title}
                  </Button>
                ))}
              </Flex>
            </>
          )}
        </Flex>
      ) : null}
    </Drawer>
  );
}
