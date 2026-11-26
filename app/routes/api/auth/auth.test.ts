import { RouterContextProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestD1 } from "../../../test/d1";

const state = vi.hoisted(() => ({
  db: null as unknown as D1Database,
  sentCodes: [] as string[],
}));

vi.mock("cloudflare:workers", () => ({
  env: {
    get DB() {
      return state.db;
    },
    SESSION_SECRET: "test-session-secret-0123456789",
    EMAIL_PROVIDER: "console",
    EMAIL_FROM: "noreply@example.com",
    EMAIL_FROM_NAME: "Employment Star",
  },
}));

import { action as logoutAction, loader as logoutLoader } from "./logout";
import {
  action as sendCodeAction,
  loader as sendCodeLoader,
} from "./send-code";
import { loader as sessionLoader } from "./session";
import { action as verifyAction, loader as verifyLoader } from "./verify";

function extractCookieHeader(setCookie: string | null): string {
  expect(setCookie).toBeTruthy();
  return (setCookie ?? "").split(";")[0];
}

function makeArgs(request: Request, pattern: string) {
  return {
    request,
    params: {},
    context: new RouterContextProvider(),
    url: new URL(request.url),
    pattern,
  };
}

describe("auth API resource routes", () => {
  beforeEach(() => {
    state.db = createTestD1();
    state.sentCodes = [];
  });

  it("rejects GET on mutation endpoints with 405", async () => {
    expect(sendCodeLoader().status).toBe(405);
    expect(verifyLoader().status).toBe(405);
    expect(logoutLoader().status).toBe(405);
  });

  it("completes send-code -> verify -> session -> logout flow via JSON", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation((msg) => {
      const match = String(msg).match(/\b(\d{6})\b/);
      if (match) state.sentCodes.push(match[1]);
    });

    const sendReq = new Request("https://example.com/api/auth/send-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: "user@example.com", lang: "en" }),
    });
    const sendRes = (await sendCodeAction(
      makeArgs(sendReq, "/api/auth/send-code"),
    )) as Response;
    expect(sendRes.status).toBe(200);
    expect(await sendRes.json()).toEqual({ ok: true, cooldownSeconds: 60 });
    expect(state.sentCodes).toHaveLength(1);
    infoSpy.mockRestore();

    const verifyReq = new Request("https://example.com/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
        code: state.sentCodes[0],
        lang: "en",
      }),
    });
    const verifyRes = (await verifyAction(
      makeArgs(verifyReq, "/api/auth/verify"),
    )) as Response;
    expect(verifyRes.status).toBe(200);
    const verifyBody = (await verifyRes.json()) as {
      ok: boolean;
      user: { email: string };
      redirectTo: string;
    };
    expect(verifyBody.ok).toBe(true);
    expect(verifyBody.user.email).toBe("user@example.com");
    expect(verifyBody.redirectTo).toBe("/en");

    const cookie = extractCookieHeader(verifyRes.headers.get("Set-Cookie"));
    expect(verifyRes.headers.get("Set-Cookie")).toContain("HttpOnly");

    const sessionRes = await sessionLoader(
      makeArgs(
        new Request("https://example.com/api/auth/session", {
          headers: { Cookie: cookie },
        }),
        "/api/auth/session",
      ),
    );
    expect(sessionRes.status).toBe(200);
    expect(await sessionRes.json()).toMatchObject({
      authenticated: true,
      user: { email: "user@example.com" },
    });

    const logoutRes = (await logoutAction(
      makeArgs(
        new Request("https://example.com/api/auth/logout", {
          method: "POST",
          headers: {
            Accept: "application/json",
            Cookie: cookie,
          },
          body: new FormData(),
        }),
        "/api/auth/logout",
      ),
    )) as Response;
    expect(logoutRes.status).toBe(200);

    const afterLogoutRes = await sessionLoader(
      makeArgs(
        new Request("https://example.com/api/auth/session", {
          headers: { Cookie: cookie },
        }),
        "/api/auth/session",
      ),
    );
    expect(await afterLogoutRes.json()).toEqual({
      authenticated: false,
      user: null,
    });
  });

  it("supports FormData submissions with redirect and sanitizes redirectTo", async () => {
    let sentCode = "";
    const infoSpy = vi.spyOn(console, "info").mockImplementation((msg) => {
      const match = String(msg).match(/\b(\d{6})\b/);
      if (match) sentCode = match[1];
    });

    const sendForm = new FormData();
    sendForm.set("email", "form@example.com");
    sendForm.set("lang", "id");
    await sendCodeAction(
      makeArgs(
        new Request("http://localhost/api/auth/send-code", {
          method: "POST",
          body: sendForm,
        }),
        "/api/auth/send-code",
      ),
    );
    infoSpy.mockRestore();

    const verifyForm = new FormData();
    verifyForm.set("email", "form@example.com");
    verifyForm.set("code", sentCode);
    verifyForm.set("lang", "id");
    verifyForm.set("redirectTo", "https://evil.example/phish");

    const verifyRes = (await verifyAction(
      makeArgs(
        new Request("http://localhost/api/auth/verify", {
          method: "POST",
          body: verifyForm,
        }),
        "/api/auth/verify",
      ),
    )) as Response;

    expect(verifyRes.status).toBe(302);
    expect(verifyRes.headers.get("Location")).toBe("/id");
  });
});
