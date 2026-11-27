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
    route("profile", "routes/profile.tsx"),
    // shortcut: one "coming soon" page per menu item until each feature is built.
    route("jobs/:jobId", "routes/coming-soon.tsx", {
      id: "coming-soon-job-detail",
    }),
    ...[
      "jobs",
      "companies",
      "classes",
      "cv-editor",
      "messages",
      "growth-record",
      "recommendations",
      "applications",
      "saved-jobs",
      "employer",
    ].map((path) =>
      route(path, "routes/coming-soon.tsx", { id: `coming-soon-${path}` }),
    ),
  ]),
] satisfies RouteConfig;
