import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/lang-redirect.tsx"),
  route("login", "routes/login-redirect.tsx"),
  route("api/auth/send-code", "routes/api/auth/send-code.ts"),
  route("api/auth/verify", "routes/api/auth/verify.ts"),
  route("api/auth/logout", "routes/api/auth/logout.ts"),
  route("api/auth/session", "routes/api/auth/session.ts"),
  route(":lang", "routes/lang-layout.tsx", [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
  ]),
] satisfies RouteConfig;
