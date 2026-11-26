import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, useLocation, useNavigate } from "react-router";
import { describe, expect, it } from "vitest";

import { LanguageSwitcher } from "../i18n/language-switcher";
import Home, { meta } from "./home";

function LocationControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <span data-testid="location">
        {location.pathname}
        {location.search}
      </span>
      <button onClick={() => navigate(-1)}>History back</button>
      <button onClick={() => navigate(1)}>History forward</button>
    </>
  );
}

function renderHome(entry = "/en") {
  const Stub = createRoutesStub([
    {
      path: "/:lang",
      Component: () => (
        <>
          <LanguageSwitcher />
          <Home />
          <LocationControls />
        </>
      ),
    },
    {
      path: "/:lang/profile",
      Component: () => (
        <>
          <h1>Profile page</h1>
          <LocationControls />
        </>
      ),
    },
  ]);
  return render(<Stub initialEntries={[entry]} />);
}

const jobsRegion = () =>
  screen.getByRole("region", {
    name: /Hot jobs|Search results|Lowongan populer|Hasil pencarian/,
  });
const employersRegion = () =>
  screen.getByRole("region", {
    name: /Featured employers|Perusahaan unggulan/,
  });
const cards = (region: HTMLElement) =>
  within(region)
    .getAllByRole("button")
    .filter((element) => element.hasAttribute("tabindex"));
const location = () => screen.getByTestId("location").textContent;

async function openFilter(name: string) {
  await userEvent.click(await screen.findByRole("button", { name }));
}

describe("Home (P01)", () => {
  it("shows the search, four shortcuts, ten guest-accessible jobs and four employers", async () => {
    renderHome();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Find the job that fits your next step",
    );
    for (const name of [
      "Smart matching",
      "CV editing",
      "Career classes",
      "Digital growth record",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(cards(jobsRegion())).toHaveLength(10);
    expect(cards(employersRegion())).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("24 jobs found");
    expect(screen.queryByLabelText("Province")).toBeNull();
    await openFilter("Location");
    expect(screen.getByLabelText("City")).toBeDisabled();
    await openFilter("Salary");
    expect(screen.getByLabelText("Minimum salary")).toHaveValue("");
    expect(screen.getByLabelText("Maximum salary")).toHaveValue("");
    expect(screen.queryByText("React Router Docs")).not.toBeInTheDocument();
  });

  it("appends job pages without duplicates and replaces load more at the end", async () => {
    renderHome();
    await screen.findByRole("heading", { level: 1 });
    await userEvent.click(
      within(jobsRegion()).getByRole("button", { name: "Load more" }),
    );
    expect(cards(jobsRegion())).toHaveLength(20);
    expect(location()).toContain("page=2");
    await userEvent.click(
      within(jobsRegion()).getByRole("button", { name: "Load more" }),
    );
    expect(cards(jobsRegion())).toHaveLength(24);
    expect(
      within(jobsRegion()).queryByRole("button", { name: "Load more" }),
    ).toBeNull();
    expect(
      within(jobsRegion()).getByText("You have seen all jobs"),
    ).toBeInTheDocument();
  });

  it("expands employers independently from job paging", async () => {
    renderHome("/en?page=2");
    await screen.findByRole("heading", { level: 1 });
    await userEvent.click(
      within(employersRegion()).getByRole("button", { name: "View all" }),
    );
    expect(cards(employersRegion())).toHaveLength(8);
    expect(cards(jobsRegion())).toHaveLength(20);
    expect(location()).toContain("page=2");
    expect(location()).toContain("employerPage=2");
  });

  it("shows every matching job with View all", async () => {
    renderHome();
    await screen.findByRole("heading", { level: 1 });
    await userEvent.click(
      within(jobsRegion()).getByRole("button", { name: "View all" }),
    );
    expect(cards(jobsRegion())).toHaveLength(24);
    expect(location()).toContain("page=3");
  });

  it("searches on Enter, trims the keyword, searches companies too, and resets paging", async () => {
    renderHome("/en?page=2&utm_source=campus");
    const input = await screen.findByLabelText("Search jobs or companies");
    await userEvent.type(input, "  Telkom  {Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("3 jobs found");
    expect(cards(jobsRegion())).toHaveLength(3);
    expect(cards(employersRegion())).toHaveLength(1);
    expect(input).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search jobs or companies")).toHaveValue(
      "Telkom",
    );
    expect(location()).toContain("q=Telkom");
    expect(location()).toContain("utm_source=campus");
    expect(location()).not.toContain("page=");
  });

  it("also searches with the button and ignores whitespace-only keywords", async () => {
    renderHome();
    const input = await screen.findByLabelText("Search jobs or companies");
    expect(input).toHaveAttribute("maxlength", "50");
    await userEvent.type(input, "React");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByRole("status")).toHaveTextContent("2 jobs found");
    const next = screen.getByLabelText("Search jobs or companies");
    await userEvent.clear(next);
    await userEvent.type(next, "   {Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("24 jobs found");
    expect(location()).toBe("/en");
  });

  it("clears the applied keyword and resets paging with the search field's clear button", async () => {
    renderHome("/en?q=Telkom&page=2");
    const input = await screen.findByLabelText("Search jobs or companies");
    await userEvent.click(
      within(input.parentElement!).getByRole("button", { name: "Clear" }),
    );
    expect(screen.getByLabelText("Search jobs or companies")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("24 jobs found");
    expect(cards(jobsRegion())).toHaveLength(10);
    expect(location()).toBe("/en");
  });

  it("cascades province/city options and clears the city on a province change", async () => {
    renderHome();
    await openFilter("Location");
    await userEvent.click(await screen.findByLabelText("Province"));
    await userEvent.click(await screen.findByTitle("DKI Jakarta"));
    await userEvent.click(screen.getByLabelText("City"));
    expect(screen.queryByTitle("Kota Bandung")).toBeNull();
    await userEvent.click(await screen.findByTitle("Jakarta Selatan"));
    expect(location()).toContain("city=Jakarta+Selatan");
    expect(
      cards(jobsRegion()).every((card) =>
        card.textContent?.includes("Jakarta Selatan"),
      ),
    ).toBe(true);
    await userEvent.click(screen.getByLabelText("Province"));
    await userEvent.click(await screen.findByTitle("Jawa Barat"));
    expect(location()).not.toContain("city=");
    await userEvent.click(screen.getByLabelText("City"));
    expect(await screen.findByTitle("Kota Bandung")).toBeInTheDocument();
    expect(screen.queryByTitle("Jakarta Selatan")).toBeNull();
  });

  it("supports multiple job types and removable chips", async () => {
    renderHome();
    await openFilter("Job type");
    await userEvent.click(await screen.findByLabelText("Job type"));
    await userEvent.click(await screen.findByTitle("Internship"));
    await userEvent.click(await screen.findByTitle("Part-time"));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("status")).toHaveTextContent("8 jobs found");
    const chip = screen.getByText("Job type: Internship");
    await userEvent.click(within(chip).getByRole("button"));
    expect(screen.getByRole("status")).toHaveTextContent("2 jobs found");
    expect(location()).not.toContain("jobType=internship");
    expect(location()).toContain("jobType=partTime");
  });

  it("combines education, work type and job language selections", async () => {
    renderHome("/en?province=DKI+Jakarta");
    await openFilter("Job type");
    await userEvent.click(await screen.findByLabelText("Education"));
    await userEvent.click(await screen.findByTitle("S1 — Bachelor's degree"));
    await userEvent.click(screen.getByLabelText("Work type"));
    await userEvent.click(await screen.findByTitle("Hybrid"));
    await userEvent.click(screen.getByLabelText("Job language"));
    await userEvent.click(await screen.findByTitle("English"));
    expect(screen.getByRole("status")).toHaveTextContent("1 job found");
    expect(cards(jobsRegion())[0]).toHaveAccessibleName(
      "Pengembang Backend Junior",
    );
    expect(location()).toContain("education=S1");
    expect(location()).toContain("workType=hybrid");
    expect(location()).toContain("language=en");
  });

  it("applies valid salary bounds and removes cleared bounds rather than substituting zero", async () => {
    renderHome();
    await openFilter("Salary");
    const min = await screen.findByLabelText("Minimum salary");
    const max = screen.getByLabelText("Maximum salary");
    await userEvent.type(min, "9500000");
    await userEvent.type(max, "10000000");
    expect(location()).toContain("salaryMin=9500000");
    expect(location()).toContain("salaryMax=10000000");
    expect(screen.getByRole("status")).toHaveTextContent("6 jobs found");
    await userEvent.clear(min);
    expect(location()).not.toContain("salaryMin=");
    expect(min).toHaveValue("");
    await userEvent.clear(max);
    expect(location()).not.toContain("salaryMax=");
    expect(screen.getByRole("status")).toHaveTextContent("24 jobs found");
  });

  it("clears unsubmitted search text even when the URL has no filters", async () => {
    renderHome();
    const input = await screen.findByLabelText("Search jobs or companies");
    await userEvent.type(input, "not submitted");
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.getByLabelText("Search jobs or companies")).toHaveValue("");
    expect(location()).toBe("/en");
  });

  it("keeps long keyword chips compact while preserving the complete query and tooltip", async () => {
    const keyword = "W".repeat(50);
    renderHome(`/en?q=${keyword}`);
    const chip = await screen.findByText(`Keyword: ${"W".repeat(16)}…`);
    expect(location()).toContain(`q=${keyword}`);
    await userEvent.hover(chip);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      `Keyword: ${keyword}`,
    );
  });

  it("restores URL filters and shows an empty state with a working reset", async () => {
    renderHome(
      "/en?q=nonexistent&province=DKI+Jakarta&education=S1&workType=hybrid&language=en",
    );
    expect(
      await screen.findByLabelText("Search jobs or companies"),
    ).toHaveValue("nonexistent");
    expect(
      screen.getByText("No jobs match your filters. Try removing some."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No companies match your search."),
    ).toBeInTheDocument();
    await userEvent.click(
      within(jobsRegion()).getByRole("button", { name: "Clear all" }),
    );
    expect(cards(jobsRegion())).toHaveLength(10);
    expect(screen.getByLabelText("Search jobs or companies")).toHaveValue("");
    await openFilter("Location");
    expect(screen.getByLabelText("City")).toBeDisabled();
    expect(location()).toBe("/en");
  });

  it("validates salary bounds inline and retains invalid drafts when changing language", async () => {
    renderHome("/en?salaryMax=5000000");
    await openFilter("Salary");
    const min = await screen.findByLabelText("Minimum salary");
    await userEvent.type(min, "9000000");
    expect(
      await screen.findByText(
        "Minimum salary cannot be higher than maximum salary",
      ),
    ).toBeInTheDocument();
    expect(min).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(
      screen.getByRole("link", { name: "Bahasa Indonesia" }),
    );
    await openFilter("Gaji");
    expect(screen.getByLabelText("Gaji minimum")).toHaveValue("9.000.000");
    expect(
      screen.getByText(
        "Gaji minimum tidak boleh lebih tinggi dari gaji maksimum",
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hapus semua" }));
    expect(screen.getByLabelText("Gaji minimum")).toHaveValue("");
    await waitFor(() =>
      expect(
        screen.queryByText(
          "Gaji minimum tidak boleh lebih tinggi dari gaji maksimum",
        ),
      ).toBeNull(),
    );
  });

  it("keeps filters, paging and half-typed search text across language switches", async () => {
    renderHome("/en?province=DKI+Jakarta&jobType=fullTime&page=2");
    const input = await screen.findByLabelText("Search jobs or companies");
    await userEvent.type(input, "unsubmitted keyword");
    await userEvent.click(
      screen.getByRole("link", { name: "Bahasa Indonesia" }),
    );
    expect(screen.getByLabelText("Cari lowongan atau perusahaan")).toHaveValue(
      "unsubmitted keyword",
    );
    expect(location()).toContain("/id?");
    expect(location()).toContain("province=DKI+Jakarta");
    expect(location()).toContain("jobType=fullTime");
    expect(location()).toContain("page=2");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Temukan pekerjaan yang tepat untuk langkah Anda selanjutnya",
    );
  });

  it("restores applied search values on browser back/forward", async () => {
    renderHome();
    await userEvent.type(
      await screen.findByLabelText("Search jobs or companies"),
      "React{Enter}",
    );
    await userEvent.click(screen.getByRole("button", { name: "History back" }));
    expect(screen.getByLabelText("Search jobs or companies")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("24 jobs found");
    await userEvent.click(
      screen.getByRole("button", { name: "History forward" }),
    );
    expect(screen.getByLabelText("Search jobs or companies")).toHaveValue(
      "React",
    );
    expect(screen.getByRole("status")).toHaveTextContent("2 jobs found");
  });

  it("sorts by highest salary and resets loaded job pages", async () => {
    renderHome("/en?page=2");
    await userEvent.click(await screen.findByLabelText("Sort by"));
    await userEvent.click(await screen.findByTitle("Highest salary"));
    expect(cards(jobsRegion())).toHaveLength(10);
    expect(cards(jobsRegion())[0]).toHaveAccessibleName(
      "Analis Keamanan Informasi",
    );
    expect(location()).toContain("sort=highestSalary");
    expect(location()).not.toContain("page=");
  });

  it("opens job/company previews for guests without a login wall or fake application", async () => {
    renderHome();
    await userEvent.click(
      await screen.findByRole("button", { name: "Analis Data Junior" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Front-end preview")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: "Responsibilities" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Apply now" }),
    ).toBeDisabled();
    expect(screen.queryByText("Please log in")).toBeNull();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "PT. Bank Central Asia" }),
    );
    expect(
      within(dialog).getByRole("heading", { name: "PT. Bank Central Asia" }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Staf Layanan Nasabah" }),
    );
    expect(
      within(dialog).getByRole("heading", { name: "Staf Layanan Nasabah" }),
    ).toBeInTheDocument();
  });

  it("opens cards with the keyboard and presents undisclosed salary as negotiable", async () => {
    renderHome("/id");
    const card = await screen.findByRole("button", {
      name: "Penulis Konten Pendidikan",
    });
    card.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("Dapat dinegosiasikan"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Tidak dipersyaratkan"),
    ).toBeInTheDocument();
  });

  it("routes CV editing to the existing localized profile", async () => {
    renderHome("/id");
    await userEvent.click(
      await screen.findByRole("button", { name: "Edit CV" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Profile page" }),
    ).toBeInTheDocument();
    expect(location()).toBe("/id/profile");
  });

  it("keeps future shortcut features explicit rather than pretending to fetch recommendations", async () => {
    renderHome();
    await userEvent.click(
      await screen.findByRole("button", { name: "Smart matching" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Coming soon")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("opens compact filter panels with the keyboard and returns focus on Escape", async () => {
    renderHome();
    const trigger = await screen.findByRole("button", {
      name: "Location",
    });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(
      await screen.findByRole("group", { name: "Location" }),
    ).toBeInTheDocument();
    const province = screen.getByLabelText("Province");
    // jsdom has no popup geometry; browser checks cover initial autofocus.
    province.focus();
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("opens only one detailed filter panel at a time", async () => {
    renderHome();
    await openFilter("Job type");
    expect(screen.getByRole("button", { name: "Job type" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await openFilter("Location");
    expect(screen.getByRole("button", { name: "Job type" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Location" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("group", { name: "Location" })).toBeInTheDocument();
  });
});

describe("home metadata", () => {
  it("uses localized Employment Star titles and descriptions", () => {
    const args = { params: { lang: "id" } } as Parameters<typeof meta>[0];
    expect(meta(args)[0]).toEqual({ title: "Beranda | Employment Star" });
    expect(meta(args)[1].content).toContain("Temukan pekerjaan");
  });
});
