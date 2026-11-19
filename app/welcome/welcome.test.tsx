import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Welcome } from "./welcome";

describe("Welcome", () => {
  it("renders the message passed by the loader", () => {
    render(<Welcome message="Hello from tests" />);

    expect(screen.getByText("Hello from tests")).toBeInTheDocument();
  });

  it("renders the resource links", () => {
    render(<Welcome message="Hello from tests" />);

    expect(
      screen.getByRole("link", { name: "React Router Docs" }),
    ).toHaveAttribute("href", "https://reactrouter.com/docs");
    expect(screen.getByRole("link", { name: "Join Discord" })).toHaveAttribute(
      "href",
      "https://rmx.as/discord",
    );
  });
});
