import {
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
import { useState } from "react";
import { Link } from "react-router";

import { useLang, useT } from "../i18n";

export default function Login() {
  const t = useT();
  const lang = useLang();
  const [method, setMethod] = useState("phone");
  const [code, setCode] = useState("");

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
            <Form layout="vertical" onFinish={() => {}}>
              <Form.Item
                htmlFor="login-contact"
                label={
                  method === "phone" ? t("phoneNumber") : t("emailAddress")
                }
              >
                {method === "phone" ? (
                  <Space.Compact block size="large">
                    <Button>+62</Button>
                    <Input
                      id="login-contact"
                      type="tel"
                      autoComplete="tel"
                      placeholder="812 3456 7890"
                      size="large"
                    />
                  </Space.Compact>
                ) : (
                  <Input
                    id="login-contact"
                    type="email"
                    autoComplete="email"
                    maxLength={100}
                    size="large"
                  />
                )}
              </Form.Item>
              <Form.Item label={t("verificationCode")} htmlFor="login-code">
                <Space.Compact block size="large">
                  <Input
                    id="login-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, ""))
                    }
                    size="large"
                  />
                  <Button disabled size="large">
                    {t("sendCode")}
                  </Button>
                </Space.Compact>
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled
              >
                {t("logIn")}
              </Button>
              <Typography.Paragraph type="secondary" role="status">
                {t("loginIsNotAvailableYet")}
              </Typography.Paragraph>
            </Form>
            <Divider plain>{t("or")}</Divider>
            <Link to={`/${lang}`}>{t("continueAsGuest")}</Link>
          </Card>
        </Col>
      </Row>
    </main>
  );
}
