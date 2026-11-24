import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/lang-redirect.tsx"),
  route("login", "routes/login-redirect.tsx"),
  route(":lang", "routes/lang-layout.tsx", [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
  ]),
] satisfies RouteConfig;
