import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it, vi } from "vitest";

import Login from "./login";

describe("login page", () => {
  it("keeps phone disabled, switches to email, and clears verification code", async () => {
    const Stub = createRoutesStub([{ path: "/:lang/login", Component: Login }]);
    render(<Stub initialEntries={["/en/login"]} />);

    expect(screen.getByLabelText("Phone number")).toBeDisabled();
    expect(screen.getByLabelText("Verification code")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send code" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();

    await userEvent.click(screen.getByRole("tab", { name: "Email" }));
    expect(screen.getByLabelText("Email address")).toBeEnabled();
    expect(screen.getByLabelText("Verification code")).toBeEnabled();
    expect(screen.getByLabelText("Verification code")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Continue as guest" }),
    ).toHaveAttribute("href", "/en");
  });

  it("renders Indonesian copy and a localized guest link", () => {
    const Stub = createRoutesStub([{ path: "/:lang/login", Component: Login }]);
    render(<Stub initialEntries={["/id/login"]} />);

    expect(
      screen.getByRole("heading", { name: "Selamat datang kembali" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Lanjut sebagai tamu" }),
    ).toHaveAttribute("href", "/id");
  });

  it.each([
    {
      lang: "en",
      emailLabel: "Email address",
      sendLabel: "Send code",
      countdownName: /Resend code in \d+s/,
    },
    {
      lang: "id",
      emailLabel: "Alamat email",
      sendLabel: "Kirim kode",
      countdownName: /Kirim ulang kode dalam \d+ dtk/,
    },
  ])(
    "shows a compact resend countdown in $lang with a localized accessible name",
    async ({ lang, emailLabel, sendLabel, countdownName }) => {
      const Stub = createRoutesStub([
        { path: "/:lang/login", Component: Login },
        {
          path: "/api/auth/send-code",
          action: async () => ({ ok: true, cooldownSeconds: 56 }),
        },
      ]);
      render(<Stub initialEntries={[`/${lang}/login`]} />);

      await userEvent.click(screen.getByRole("tab", { name: "Email" }));
      await userEvent.type(
        screen.getByLabelText(emailLabel),
        "user@example.com",
      );
      await userEvent.click(screen.getByRole("button", { name: sendLabel }));

      const countdownButton = await screen.findByRole("button", {
        name: countdownName,
      });
      expect(countdownButton).toHaveTextContent(/^\d+s$/);
      expect(countdownButton).toBeDisabled();
    },
  );

  it("submits send-code and verify requests on the email tab", async () => {
    const sendSpy = vi.fn().mockResolvedValue({
      ok: true,
      cooldownSeconds: 60,
    });
    const verifySpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      code: "OTP_INVALID",
    });

    const Stub = createRoutesStub([
      { path: "/:lang/login", Component: Login },
      {
        path: "/api/auth/send-code",
        action: async ({ request }) => {
          const form = await request.formData();
          return sendSpy(Object.fromEntries(form));
        },
      },
      {
        path: "/api/auth/verify",
        action: async ({ request }) => {
          const form = await request.formData();
          return verifySpy(Object.fromEntries(form));
        },
      },
    ]);

    render(<Stub initialEntries={["/en/login"]} />);

    await userEvent.click(screen.getByRole("tab", { name: "Email" }));
    await userEvent.type(
      screen.getByLabelText("Email address"),
      "user@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Send code" }));

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith({
        email: "user@example.com",
        lang: "en",
      });
    });
    expect(
      await screen.findByText("Verification code sent"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Resend code in \d+s/ }),
    ).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Verification code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith({
        email: "user@example.com",
        code: "123456",
        lang: "en",
      });
    });
    expect(await screen.findByText("Wrong code")).toBeInTheDocument();
  });
});
