import { describe, expect, it, vi } from "vitest";

import { createDb } from "../../db/index.server";
import { createTestD1 } from "../../test/d1";
import type { EmailProvider, OutboundEmail } from "../email/types.server";
import {
  OTP_MAX_SENDS_PER_WINDOW,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  requestEmailOtp,
  verifyEmailOtp,
} from "./otp.server";

function createMemoryEmailProvider(): {
  provider: EmailProvider;
  sent: OutboundEmail[];
  extractLastCode: () => string;
} {
  const sent: OutboundEmail[] = [];
  return {
    sent,
    provider: {
      name: "memory",
      async send(message) {
        sent.push(message);
        return { provider: "memory", messageId: `msg-${sent.length}` };
      },
    },
    extractLastCode() {
      const last = sent.at(-1);
      const match = last?.text.match(/\b(\d{6})\b/);
      if (!match) throw new Error("No 6-digit OTP found in email text");
      return match[1];
    },
  };
}

describe("email OTP service", () => {
  const otpSecret = "test-otp-secret-value";

  it("rejects invalid email addresses on request and verify", async () => {
    const db = createDb(createTestD1());
    const email = createMemoryEmailProvider();

    const reqRes = await requestEmailOtp(
      { db, emailProvider: email.provider, otpSecret },
      { email: "not-an-email", lang: "en" },
    );
    expect(reqRes).toEqual({ ok: false, status: 400, code: "INVALID_EMAIL" });
    expect(email.sent).toHaveLength(0);

    const verRes = await verifyEmailOtp(
      { db, otpSecret },
      { email: "bad", code: "123456", lang: "en" },
    );
    expect(verRes).toEqual({ ok: false, status: 400, code: "INVALID_EMAIL" });
  });

  it("issues an OTP, normalizes email, verifies once, and prevents replay", async () => {
    const db = createDb(createTestD1());
    const email = createMemoryEmailProvider();
    const currentMs = 1_700_000_000_000;
    const now = () => new Date(currentMs);

    const sendRes = await requestEmailOtp(
      { db, emailProvider: email.provider, otpSecret, now },
      { email: "  Alice@Example.COM ", lang: "id" },
    );
    expect(sendRes).toEqual({ ok: true, cooldownSeconds: 60 });
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0].subject).toContain("Employment Star");

    const code = email.extractLastCode();
    const verifyRes = await verifyEmailOtp(
      { db, otpSecret, now },
      { email: "alice@example.com", code, lang: "id" },
    );
    expect(verifyRes.ok).toBe(true);
    if (verifyRes.ok) {
      expect(verifyRes.user.email).toBe("alice@example.com");
      expect(verifyRes.user.preferredLang).toBe("id");
    }

    // Replaying the same OTP fails.
    const replayRes = await verifyEmailOtp(
      { db, otpSecret, now },
      { email: "alice@example.com", code, lang: "id" },
    );
    expect(replayRes).toEqual({ ok: false, status: 400, code: "OTP_INVALID" });
  });

  it("enforces resend cooldown and 15-minute window rate limits", async () => {
    const db = createDb(createTestD1());
    const email = createMemoryEmailProvider();
    let currentMs = 1_700_000_000_000;
    const now = () => new Date(currentMs);

    for (let i = 0; i < OTP_MAX_SENDS_PER_WINDOW; i += 1) {
      const okRes = await requestEmailOtp(
        { db, emailProvider: email.provider, otpSecret, now },
        { email: "bob@example.com", lang: "en" },
      );
      expect(okRes).toEqual({ ok: true, cooldownSeconds: 60 });

      if (i === 0) {
        currentMs += 10_000;
        const coolRes = await requestEmailOtp(
          { db, emailProvider: email.provider, otpSecret, now },
          { email: "bob@example.com", lang: "en" },
        );
        expect(coolRes).toEqual({
          ok: false,
          status: 429,
          code: "RATE_LIMITED",
          retryAfterSeconds: 50,
        });
      }
      currentMs += OTP_RESEND_COOLDOWN_MS + 1000;
    }

    const windowBlocked = await requestEmailOtp(
      { db, emailProvider: email.provider, otpSecret, now },
      { email: "bob@example.com", lang: "en" },
    );
    expect(windowBlocked).toEqual({
      ok: false,
      status: 429,
      code: "RATE_LIMITED",
    });
  });

  it("rolls back challenge when email sending fails so user is not rate-limited", async () => {
    const db = createDb(createTestD1());
    const failingProvider: EmailProvider = {
      name: "smtp",
      send: vi
        .fn()
        .mockRejectedValueOnce(new Error("SMTP down"))
        .mockResolvedValueOnce({
          provider: "smtp",
          messageId: "ok",
        }),
    };

    const failRes = await requestEmailOtp(
      { db, emailProvider: failingProvider, otpSecret },
      { email: "retry@example.com", lang: "en" },
    );
    expect(failRes).toEqual({
      ok: false,
      status: 502,
      code: "EMAIL_SEND_FAILED",
    });

    const retryRes = await requestEmailOtp(
      { db, emailProvider: failingProvider, otpSecret },
      { email: "retry@example.com", lang: "en" },
    );
    expect(retryRes).toEqual({ ok: true, cooldownSeconds: 60 });
  });

  it("locks out after max failed verification attempts and rejects expired OTPs", async () => {
    const db = createDb(createTestD1());
    const email = createMemoryEmailProvider();
    let currentMs = 1_700_000_000_000;
    const now = () => new Date(currentMs);

    await requestEmailOtp(
      { db, emailProvider: email.provider, otpSecret, now },
      { email: "brute@example.com", lang: "en" },
    );
    const validCode = email.extractLastCode();
    const wrongCode = validCode === "000000" ? "111111" : "000000";

    for (let i = 1; i < OTP_MAX_VERIFY_ATTEMPTS; i += 1) {
      const res = await verifyEmailOtp(
        { db, otpSecret, now },
        { email: "brute@example.com", code: wrongCode },
      );
      expect(res).toEqual({ ok: false, status: 400, code: "OTP_INVALID" });
    }

    const lockedRes = await verifyEmailOtp(
      { db, otpSecret, now },
      { email: "brute@example.com", code: wrongCode },
    );
    expect(lockedRes).toEqual({
      ok: false,
      status: 429,
      code: "OTP_TOO_MANY_ATTEMPTS",
    });

    // Advance past cooldown and test expiry.
    currentMs += OTP_RESEND_COOLDOWN_MS + 1000;
    await requestEmailOtp(
      { db, emailProvider: email.provider, otpSecret, now },
      { email: "expire@example.com", lang: "en" },
    );
    const expireCode = email.extractLastCode();
    currentMs += OTP_TTL_MS + 1;

    const expiredRes = await verifyEmailOtp(
      { db, otpSecret, now },
      { email: "expire@example.com", code: expireCode },
    );
    expect(expiredRes).toEqual({
      ok: false,
      status: 400,
      code: "OTP_EXPIRED",
    });
  });
});
