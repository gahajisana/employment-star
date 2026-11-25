import { env } from "cloudflare:workers";
import { Button, Space, Typography } from "antd";
import { Form, Link } from "react-router";

import { useLang, useT } from "../i18n";
import { getCurrentUser } from "../lib/auth/session.server";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request, env);
  return {
    message: env.VALUE_FROM_CLOUDFLARE,
    user: user ? { id: user.id, email: user.email } : null,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const lang = useLang();
  const t = useT();

  return (
    <>
      <div className="flex justify-end px-4">
        {loaderData.user ? (
          <Space>
            <Typography.Text>{loaderData.user.email}</Typography.Text>
            <Form method="post" action="/api/auth/logout">
              <input type="hidden" name="redirectTo" value={`/${lang}/login`} />
              <Button htmlType="submit" size="small">
                {t("logOut")}
              </Button>
            </Form>
          </Space>
        ) : (
          <Link to={`/${lang}/login`}>{t("logIn")}</Link>
        )}
      </div>
      <Welcome message={loaderData.message} />
    </>
  );
}
