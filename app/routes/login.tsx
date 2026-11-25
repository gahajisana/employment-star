import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Tabs,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { Link, redirect, useFetcher } from "react-router";

import { DEFAULT_LANG, isLang, useLang, useT, type MessageKey } from "../i18n";
import { API_ERROR_CODES, type ApiErrorCode } from "../lib/http/api-result";
import type { Route } from "./+types/login";
import type { action as sendCodeAction } from "./api/auth/send-code";
import type { action as verifyAction } from "./api/auth/verify";

const ERROR_MESSAGE_KEYS: Record<ApiErrorCode, MessageKey> = {
  [API_ERROR_CODES.INVALID_EMAIL]: "pleaseEnterAValidEmailAddress",
  [API_ERROR_CODES.INVALID_CODE]: "wrongCode",
  [API_ERROR_CODES.RATE_LIMITED]: "tryAgainLater",
  [API_ERROR_CODES.EMAIL_SEND_FAILED]: "somethingWentWrong",
  [API_ERROR_CODES.OTP_EXPIRED]: "codeExpired",
  [API_ERROR_CODES.OTP_INVALID]: "wrongCode",
  [API_ERROR_CODES.OTP_TOO_MANY_ATTEMPTS]: "tooManyAttempts",
  [API_ERROR_CODES.METHOD_NOT_ALLOWED]: "somethingWentWrong",
  [API_ERROR_CODES.INTERNAL_ERROR]: "somethingWentWrong",
};

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
    });
    if (response.ok) {
      const data = (await response.json()) as { authenticated?: boolean };
      if (data.authenticated) {
        throw redirect(`/${lang}`);
      }
    }
  } catch (error) {
    if (error instanceof Response) throw error;
  }
  return null;
}
clientLoader.hydrate = true as const;

export default function Login() {
  const t = useT();
  const lang = useLang();
  const [method, setMethod] = useState("phone");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldownAnchorMs, setCooldownAnchorMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const sendFetcher = useFetcher<typeof sendCodeAction>();
  const verifyFetcher = useFetcher<typeof verifyAction>();

  const isPhone = method === "phone";
  const isSending = sendFetcher.state !== "idle";
  const isVerifying = verifyFetcher.state !== "idle";

  const cooldownDurationSeconds =
    sendFetcher.data?.ok === true
      ? sendFetcher.data.cooldownSeconds
      : sendFetcher.data?.ok === false
        ? (sendFetcher.data.retryAfterSeconds ?? 0)
        : 0;

  const cooldownRemaining =
    !isPhone && cooldownAnchorMs !== null && cooldownDurationSeconds > 0
      ? Math.max(
          0,
          Math.ceil(
            (cooldownAnchorMs + cooldownDurationSeconds * 1000 - nowMs) / 1000,
          ),
        )
      : 0;

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  const trimmedEmail = email.trim();
  const canSendCode =
    !isPhone &&
    trimmedEmail.length > 0 &&
    !isSending &&
    cooldownRemaining === 0;
  const canSubmit =
    !isPhone && trimmedEmail.length > 0 && code.length === 6 && !isVerifying;

  const activeError =
    verifyFetcher.data && !verifyFetcher.data.ok
      ? verifyFetcher.data.code
      : sendFetcher.data && !sendFetcher.data.ok
        ? sendFetcher.data.code
        : null;

  const handleSendCode = () => {
    if (!canSendCode) return;
    const now = Date.now();
    setCooldownAnchorMs(now);
    setNowMs(now);
    sendFetcher.submit(
      { email: trimmedEmail, lang },
      { method: "post", action: "/api/auth/send-code" },
    );
  };

  const handleVerify = () => {
    if (!canSubmit) return;
    verifyFetcher.submit(
      { email: trimmedEmail, code, lang },
      { method: "post", action: "/api/auth/verify" },
    );
  };

  return (
    <main>
      <Row justify="center">
        <Col xs={24} sm={18} md={12} lg={8} xl={6}>
          <Card>
            <Typography.Text strong>Employment Star</Typography.Text>
            <Typography.Title id="login-title" level={1}>
              {t("welcomeBack")}
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              {t("logInToContinueYourJobSearch")}
            </Typography.Paragraph>

            <Tabs
              activeKey={method}
              onChange={(key) => {
                setMethod(key);
                setCode("");
              }}
              items={[
                { key: "phone", label: t("phone") },
                { key: "email", label: t("email") },
              ]}
            />
            <Form layout="vertical" onFinish={handleVerify}>
              <Form.Item
                htmlFor="login-contact"
                label={isPhone ? t("phoneNumber") : t("emailAddress")}
              >
                {isPhone ? (
                  <Space.Compact block size="large">
                    <Button disabled>+62</Button>
                    <Input
                      id="login-contact"
                      type="tel"
                      autoComplete="tel"
                      placeholder="812 3456 7890"
                      size="large"
                      disabled
                    />
                  </Space.Compact>
                ) : (
                  <Input
                    id="login-contact"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={100}
                    size="large"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                )}
              </Form.Item>
              <Form.Item label={t("verificationCode")} htmlFor="login-code">
                <Space.Compact block size="large">
                  <Input
                    id="login-code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, ""))
                    }
                    size="large"
                    disabled={isPhone}
                  />
                  <Button
                    aria-label={
                      cooldownRemaining > 0
                        ? t("resendCodeInSecondsS", {
                            seconds: cooldownRemaining,
                          })
                        : undefined
                    }
                    disabled={!canSendCode}
                    loading={isSending}
                    onClick={handleSendCode}
                    size="large"
                  >
                    {cooldownRemaining > 0
                      ? `${cooldownRemaining}s`
                      : t("sendCode")}
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled={!canSubmit}
                loading={isVerifying}
              >
                {t("logIn")}
              </Button>
              {isPhone ? (
                <Typography.Paragraph type="secondary" role="status">
                  {t("loginIsNotAvailableYet")}
                </Typography.Paragraph>
              ) : (
                <Space orientation="vertical" className="mt-3 w-full">
                  {sendFetcher.data?.ok && (
                    <Alert
                      type="success"
                      role="status"
                      title={t("verificationCodeSent")}
                    />
                  )}
                  {activeError && (
                    <Alert
                      type="error"
                      role="alert"
                      title={t(ERROR_MESSAGE_KEYS[activeError])}
                    />
                  )}
                </Space>
              )}
            </Form>
            <Divider plain>{t("or")}</Divider>
            <Link to={`/${lang}`}>{t("continueAsGuest")}</Link>
          </Card>
        </Col>
      </Row>
    </main>
  );
}
