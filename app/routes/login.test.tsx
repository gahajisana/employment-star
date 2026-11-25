import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import Login from "./login";

describe("login scaffold", () => {
  it("switches contact method and clears the verification code", async () => {
    const Stub = createRoutesStub([{ path: "/:lang/login", Component: Login }]);
    render(<Stub initialEntries={["/en/login"]} />);

    expect(screen.getByLabelText("Phone number")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Verification code"), "123456");
    await userEvent.click(screen.getByRole("tab", { name: "Email" }));
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
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
});
