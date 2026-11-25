import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { LanguageSwitcher } from "../i18n/language-switcher";
import Profile from "./profile";

function renderProfile(lang = "en") {
  const Stub = createRoutesStub([
    {
      path: "/:lang/profile",
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

const identityCard = () =>
  within(screen.getByRole("heading", { name: "Nama" }).closest("section")!);

describe("Profile (P07)", () => {
  it("shows the demo identity, 58% and the 70% banner", async () => {
    renderProfile();
    expect(
      await screen.findByRole("heading", { name: "Nama" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "58",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your résumé is 58% complete",
    );
  });

  it("lists the 11 report sections with their status", async () => {
    renderProfile();
    const items = within(await screen.findByRole("list")).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(11);
    expect(items[0]).toHaveTextContent("Basic information");
    expect(items[0]).toHaveTextContent("Filled");
    expect(items[10]).toHaveTextContent("Career plan");
    expect(items[10]).toHaveTextContent("Not filled");
    expect(
      items.some((item) => item.textContent?.includes("Job intention")),
    ).toBe(false);
  });

  it("names the missing sections", async () => {
    renderProfile();
    expect(await screen.findByText(/Missing sections/)).toHaveTextContent(
      "Work history",
    );
  });

  it("blocks an invalid salary range until fixed", async () => {
    renderProfile();
    const min = await screen.findByLabelText("Minimum salary");
    const max = screen.getByLabelText("Maximum salary");
    await userEvent.clear(min);
    await userEvent.type(min, "9000000");
    await userEvent.clear(max);
    await userEvent.type(max, "1000000");
    await userEvent.tab();
    expect(
      screen.getByText("Minimum salary cannot be higher than maximum salary"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("shows the salary range error after leaving only the minimum field", async () => {
    renderProfile();
    const min = await screen.findByLabelText("Minimum salary");
    await userEvent.clear(min);
    await userEvent.type(min, "9500000"); // demo maximum is 9,000,000
    await userEvent.tab();
    expect(
      screen.getByText("Minimum salary cannot be higher than maximum salary"),
    ).toBeInTheDocument();
  });

  it("cancel restores the last saved values", async () => {
    renderProfile();
    const role = await screen.findByLabelText("Expected role");
    await userEvent.clear(role);
    await userEvent.type(role, "Data Analyst");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(role).toHaveValue("Pengembang Frontend Junior");
  });

  it("saving a new status updates the identity tag", async () => {
    renderProfile();
    await userEvent.click(await screen.findByLabelText("Job-seeking status"));
    await userEvent.click(await screen.findByTitle("Open to offers"));
    expect(identityCard().getByText("Looking for a job")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(identityCard().getByText("Open to offers")).toBeInTheDocument();
    expect(identityCard().queryByText("Looking for a job")).toBeNull();
  });

  it("keeps typed values when switching to Indonesian", async () => {
    renderProfile();
    const role = await screen.findByLabelText("Expected role");
    await userEvent.clear(role);
    await userEvent.type(role, "Data Analyst");
    await userEvent.click(
      screen.getByRole("link", { name: "Bahasa Indonesia" }),
    );
    expect(screen.getByLabelText("Posisi yang diharapkan")).toHaveValue(
      "Data Analyst",
    );
  });

  it("has no inline editors or demo controls", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Nama" });
    expect(screen.queryByRole("button", { name: "Mark empty" })).toBeNull();
    expect(screen.queryByText(/Weight/)).toBeNull();
    expect(screen.queryByText("Version history")).toBeNull();
  });
});
