import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutesStub, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { en, id, type MessageKey } from "./glossary";
import { pickLang, switchLangPath, translate, useT } from ".";
import { LanguageSwitcher } from "./language-switcher";

describe("translate", () => {
  it("returns the text for the active language", () => {
    expect(translate("en", "home")).toBe("Home");
    expect(translate("id", "home")).toBe("Beranda");
  });

  it("fills placeholders and leaves unknown ones untouched", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const key = "x {n} {m}" as MessageKey;
    expect(translate("en", key, { n: 3 })).toBe("x 3 {m}");
  });

  it("falls back to the key and logs it once when missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const key = "missing.key" as MessageKey;
    expect(translate("id", key)).toBe("missing.key");
    translate("id", key);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("has no empty Indonesian strings", () => {
    for (const key of Object.keys(en) as MessageKey[]) {
      expect(id[key].trim(), key).not.toBe("");
    }
  });
});

describe("switchLangPath", () => {
  it("swaps only the first segment", () => {
    expect(switchLangPath("/en", "id")).toBe("/id");
    expect(switchLangPath("/en/jobs/42", "id")).toBe("/id/jobs/42");
  });
});

describe("pickLang", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://x/", { headers });

  it("prefers the saved cookie", () => {
    expect(
      pickLang(req({ Cookie: "a=1; lang=id", "Accept-Language": "en" })),
    ).toBe("id");
  });

  it("uses Accept-Language, then the default", () => {
    expect(pickLang(req({ "Accept-Language": "fr, id-ID;q=0.8" }))).toBe("id");
    expect(pickLang(req({ "Accept-Language": "fr" }))).toBe("en");
    expect(pickLang(req({ Cookie: "lang=xx" }))).toBe("en");
  });
});

describe("LanguageSwitcher", () => {
  function Page() {
    const t = useT();
    const { pathname, search } = useLocation();
    return (
      <>
        <LanguageSwitcher />
        <h1>{t("myProfile")}</h1>
        <p data-testid="url">{pathname + search}</p>
        <input aria-label="draft" />
      </>
    );
  }

  it("keeps the page, query and typed text when switching", async () => {
    const Stub = createRoutesStub([
      { path: "/:lang/profile", Component: Page },
    ]);
    render(<Stub initialEntries={["/en/profile?tab=edu"]} />);

    await userEvent.type(screen.getByLabelText("draft"), "half typed");
    await userEvent.click(
      screen.getByRole("link", { name: "Bahasa Indonesia" }),
    );

    expect(screen.getByRole("heading")).toHaveTextContent("Profil Saya");
    expect(screen.getByTestId("url")).toHaveTextContent("/id/profile?tab=edu");
    expect(screen.getByLabelText("draft")).toHaveValue("half typed");
    expect(document.cookie).toContain("lang=id");
  });
});
