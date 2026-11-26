import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it, vi } from "vitest";

import type { UserRecord } from "../db/schema";
import { LanguageSwitcher } from "../i18n/language-switcher";
import { getCurrentUser } from "../lib/auth/session.server";
import Profile, { loader } from "./profile";

vi.mock("../lib/auth/session.server", () => ({ getCurrentUser: vi.fn() }));

const SIGNED_IN_EMAIL = "dewi@example.com";

function renderProfile(lang = "en") {
  const Stub = createRoutesStub([
    {
      path: "/:lang/profile",
      loader: () => ({ email: SIGNED_IN_EMAIL }),
      Component: () => (
        <>
          <LanguageSwitcher />
          <Profile />
        </>
      ),
    },
  ]);
  render(<Stub initialEntries={[`/${lang}/profile`]} />);
}

const runLoader = (lang: string) =>
  loader({
    request: new Request(`http://localhost/${lang}/profile`),
    params: { lang },
  } as Parameters<typeof loader>[0]);

describe("Profile loader (login guard, F04 / AC12)", () => {
  it("sends a guest to login and back to this page afterwards", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const response = await runLoader("id").catch((thrown: unknown) => thrown);
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(302);
    expect((response as Response).headers.get("Location")).toBe(
      "/id/login?redirectTo=%2Fid%2Fprofile",
    );
  });

  it("returns the signed-in user's email", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      email: SIGNED_IN_EMAIL,
    } as UserRecord);
    await expect(runLoader("en")).resolves.toEqual({ email: SIGNED_IN_EMAIL });
  });
});

const tab = (name: string) => screen.getByRole("tab", { name });

describe("Profile page (Figma layout)", () => {
  it("shows the saved name, completeness 58% and the 70% box", async () => {
    renderProfile();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Nama" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "58",
    );
    expect(
      screen.getByText("Complete at least 70% of your résumé to apply"),
    ).toBeInTheDocument();
  });

  it("opens Basic information first and shows the account email read-only", async () => {
    renderProfile();
    expect(
      await screen.findByRole("tab", { name: "Basic information" }),
    ).toHaveAttribute("aria-selected", "true");
    const email = screen.getByLabelText("Email address");
    expect(email).toHaveValue(SIGNED_IN_EMAIL);
    expect(email).toHaveAttribute("readonly");
  });

  it("saving a new full name updates the name card", async () => {
    renderProfile();
    const name = await screen.findByLabelText("Full name");
    await userEvent.clear(name);
    await userEvent.type(name, "Dewi Lestari");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Dewi Lestari" }),
    ).toBeInTheDocument();
    expect(screen.getByText("DL")).toBeInTheDocument();
  });

  it("blocks an invalid WhatsApp number", async () => {
    renderProfile();
    const whatsapp = await screen.findByLabelText("WhatsApp number");
    await userEvent.clear(whatsapp);
    await userEvent.type(whatsapp, "0812");
    await userEvent.tab();
    expect(screen.getByText("Invalid phone number")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    // Screen readers announce the error with the field, not only the color.
    expect(whatsapp).toHaveAttribute("aria-invalid", "true");
    expect(whatsapp).toHaveAccessibleDescription("Invalid phone number");
  });

  it("cancel restores saved basic information and clears errors", async () => {
    renderProfile();
    const name = await screen.findByLabelText("Full name");
    await userEvent.clear(name);
    await userEvent.tab();
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(name).toHaveValue("Nama");
    expect(screen.queryByText("This field is required")).toBeNull();
  });

  it("keeps unsaved edits when switching tabs", async () => {
    renderProfile();
    const name = await screen.findByLabelText("Full name");
    await userEvent.clear(name);
    await userEvent.type(name, "Dewi");
    await userEvent.click(tab("Job intention"));
    await userEvent.click(tab("Basic information"));
    expect(screen.getByLabelText("Full name")).toHaveValue("Dewi");
  });

  it("moves between tabs with the arrow keys", async () => {
    renderProfile();
    (await screen.findByRole("tab", { name: "Basic information" })).focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(tab("Job intention")).toHaveAttribute("aria-selected", "true");
    expect(tab("Job intention")).toHaveFocus();
  });

  it("shows the job intention form in its tab", async () => {
    renderProfile();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Job intention" }),
    );
    expect(screen.getByLabelText("Expected role")).toHaveValue(
      "Pengembang Frontend Junior",
    );
  });

  it("shows the salary range error after leaving only the minimum field", async () => {
    renderProfile();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Job intention" }),
    );
    const min = screen.getByLabelText("Minimum salary");
    await userEvent.clear(min);
    await userEvent.type(min, "9500000"); // demo maximum is 9,000,000
    await userEvent.tab();
    expect(
      screen.getByText("Minimum salary cannot be higher than maximum salary"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("shows an empty My applications tab", async () => {
    renderProfile();
    await userEvent.click(
      await screen.findByRole("tab", { name: "My applications" }),
    );
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
  });

  it("keeps typed values when switching to Indonesian", async () => {
    renderProfile();
    const name = await screen.findByLabelText("Full name");
    await userEvent.clear(name);
    await userEvent.type(name, "Dewi");
    await userEvent.click(
      screen.getByRole("link", { name: "Bahasa Indonesia" }),
    );
    expect(await screen.findByLabelText("Nama lengkap")).toHaveValue("Dewi");
  });
});
