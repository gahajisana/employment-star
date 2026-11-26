import { describe, expect, it, vi } from "vitest";

import { ConsoleEmailProvider } from "./console-email.server";
import {
  createEmailProvider,
  EmailDeliveryError,
  renderOtpEmail,
} from "./index.server";
import { SmtpEmailProvider } from "./smtp.server";

describe("email abstraction", () => {
  it("logs emails cleanly in ConsoleEmailProvider", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const provider = new ConsoleEmailProvider({
      email: "noreply@example.com",
      name: "Employment Star",
    });

    const result = await provider.send({
      to: { email: "user@example.com" },
      subject: "Your code",
      text: "Code: 123456",
    });

    expect(result.provider).toBe("console");
    expect(result.messageId).toBeTruthy();
    expect(infoSpy).toHaveBeenCalledOnce();
    infoSpy.mockRestore();
  });

  it("sends via SmtpEmailProvider transport and wraps errors", async () => {
    const transport = vi.fn().mockResolvedValue(undefined);
    const provider = new SmtpEmailProvider({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      username: "smtp-user",
      password: "smtp-password",
      authType: "login",
      defaultFrom: { email: "noreply@example.com", name: "Employment Star" },
      sendViaTransport: transport,
    });

    const result = await provider.send({
      to: { email: "user@example.com" },
      subject: "OTP",
      text: "123456",
      html: "<p>123456</p>",
    });

    expect(result.provider).toBe("smtp");
    expect(transport).toHaveBeenCalledWith(
      {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        startTls: true,
        credentials: { username: "smtp-user", password: "smtp-password" },
        authType: "login",
      },
      expect.objectContaining({
        from: { email: "noreply@example.com", name: "Employment Star" },
        to: [{ email: "user@example.com" }],
        subject: "OTP",
        text: "123456",
      }),
    );

    transport.mockRejectedValueOnce(new Error("Auth failed"));
    await expect(
      provider.send({
        to: { email: "user@example.com" },
        subject: "OTP",
        text: "123456",
      }),
    ).rejects.toThrow(EmailDeliveryError);
  });

  it("selects provider from env and requires SMTP config in production", () => {
    expect(
      createEmailProvider({ EMAIL_PROVIDER: "console" }, { isDev: false }).name,
    ).toBe("console");

    expect(
      createEmailProvider({ EMAIL_PROVIDER: "smtp" }, { isDev: true }).name,
    ).toBe("console");

    expect(() =>
      createEmailProvider(
        {
          EMAIL_PROVIDER: "smtp",
          SMTP_HOST: "smtp.example.com",
          EMAIL_FROM: "noreply@example.com",
        },
        { isDev: false },
      ),
    ).toThrow(EmailDeliveryError);

    const smtp = createEmailProvider(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: "465",
        SMTP_SECURE: "true",
        SMTP_USER: "user",
        SMTP_PASS: "pass",
        EMAIL_FROM: "noreply@example.com",
      },
      { isDev: false },
    );
    expect(smtp.name).toBe("smtp");
  });

  it("renders localized OTP email templates in EN and ID", () => {
    const en = renderOtpEmail({
      lang: "en",
      code: "654321",
      expiresMinutes: 10,
    });
    expect(en.subject).toContain("654321");
    expect(en.text).toContain("10 minutes");

    const id = renderOtpEmail({
      lang: "id",
      code: "654321",
      expiresMinutes: 10,
    });
    expect(id.subject).toContain("654321");
    expect(id.text).toContain("10 menit");
  });
});
