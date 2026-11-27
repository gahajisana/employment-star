import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, type SessionEnv } from "./session.server";

describe("getCurrentUser in production", () => {
  beforeEach(() => {
    vi.stubEnv("DEV", false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats a cookie-free request as a guest without runtime session bindings", async () => {
    const env: SessionEnv = {
      get DB(): D1Database {
        throw new Error("Unexpected database access for a guest request");
      },
    };
    const request = new Request("https://example.test/en/login");

    await expect(getCurrentUser(request, env)).resolves.toBeNull();
  });

  it("still requires a secret when a session cookie is present", async () => {
    const env: SessionEnv = { DB: {} as D1Database };
    const request = new Request("https://example.test/en", {
      headers: { Cookie: "__es_session=test" },
    });

    await expect(getCurrentUser(request, env)).rejects.toThrow(
      "SESSION_SECRET must be set",
    );
  });
});
