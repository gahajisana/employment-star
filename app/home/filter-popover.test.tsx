import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PopoverProps } from "antd";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { FilterPopover } from "./filter-popover";

// jsdom cannot align an Ant Design popup. Control animation completion so focus
// handoffs can be tested without relying on browser geometry or motion timing.
vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  return {
    ...actual,
    Popover: ({
      children,
      content,
      open,
      onOpenChange,
      afterOpenChange,
    }: PopoverProps) => (
      <>
        <span onClick={() => onOpenChange?.(!open)}>{children}</span>
        {open && <>{content}</>}
        <button onClick={() => afterOpenChange?.(!!open)}>
          Finish animation
        </button>
      </>
    ),
  };
});

function TestPopover() {
  const [open, setOpen] = useState(false);
  return (
    <FilterPopover
      id="test-filter"
      label="Filter"
      open={open}
      onOpenChange={setOpen}
    >
      <input aria-label="First field" />
      <input aria-label="Second field" />
    </FilterPopover>
  );
}

const finishAnimation = () =>
  fireEvent.click(screen.getByRole("button", { name: "Finish animation" }));

describe("FilterPopover focus", () => {
  it("focuses the first field after a keyboard opening finishes", async () => {
    render(<TestPopover />);
    screen.getByRole("button", { name: "Filter" }).focus();
    await userEvent.keyboard("{Enter}");
    finishAnimation();
    expect(screen.getByLabelText("First field")).toHaveFocus();
  });

  it("does not refocus the first field after pointer interaction during opening", async () => {
    render(<TestPopover />);
    const trigger = screen.getByRole("button", { name: "Filter" });
    await userEvent.click(trigger);
    fireEvent.pointerDown(screen.getByLabelText("Second field"));
    trigger.focus();
    finishAnimation();
    expect(trigger).toHaveFocus();
  });

  it("returns focus on Escape and allows autofocus on the next opening", async () => {
    render(<TestPopover />);
    const trigger = screen.getByRole("button", { name: "Filter" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByLabelText("Second field"));
    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{Enter}");
    finishAnimation();
    expect(screen.getByLabelText("First field")).toHaveFocus();
  });
});
