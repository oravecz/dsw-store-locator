import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("campaign store selection", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  // @lat: [[dsw-store-locator#Campaign Store Scope#Store Selection Workflow]]
  it(
    "edits campaign coverage and applies it to the store directory",
    () => {
      render(<App />);

      fireEvent.click(
        screen.getByRole("button", { name: "Edit 35th Birthday" }),
      );
      expect(
        screen.getByRole("heading", { name: "Edit campaign" }),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "493 stores selected" }),
      );
      const selector = screen.getByRole("region", {
        name: "Choose participating stores",
      });
      expect(within(selector).getAllByRole("checkbox")).toHaveLength(493);

      fireEvent.change(
        within(selector).getByRole("searchbox", {
          name: "Filter participating stores",
        }),
        { target: { value: "Dublin-Sawmill" } },
      );
      expect(within(selector).getByText("#9051")).toBeInTheDocument();
      expect(within(selector).queryByText("#9052")).not.toBeInTheDocument();

      fireEvent.click(
        within(selector).getByRole("button", { name: "Deselect all" }),
      );
      fireEvent.click(within(selector).getByRole("checkbox"));
      expect(
        within(selector).getByText("1 store selected", {
          selector: "strong",
        }),
      ).toBeInTheDocument();

      fireEvent.click(within(selector).getByRole("button", { name: "Done" }));
      fireEvent.click(
        screen.getByRole("button", { name: "Save campaign" }),
      );

      const directory = screen.getByRole("region", {
        name: "Store directory",
      });
      expect(within(directory).getByText("#9051")).toBeInTheDocument();
      expect(within(directory).queryByText("#9052")).not.toBeInTheDocument();
    },
    15_000,
  );

  // @lat: [[dsw-store-locator#Issue Status Workflow#Status Values]]
  it(
    "offers and saves the four issue statuses",
    () => {
      render(<App />);

      const directory = screen.getByRole("region", {
        name: "Store directory",
      });
      const storeButton = within(directory).getByText("#9051").closest("button");
      expect(storeButton).not.toBeNull();
      fireEvent.click(storeButton!);

      fireEvent.click(screen.getByRole("button", { name: "Add issue" }));
      const statusSelect = screen.getByLabelText("Status");
      expect(
        within(statusSelect)
          .getAllByRole("option")
          .map((option) => option.textContent),
      ).toEqual(["New", "Reported", "Resolved", "Accepted"]);

      fireEvent.change(screen.getByLabelText("What needs attention?"), {
        target: { value: "Window decal" },
      });
      fireEvent.change(statusSelect, { target: { value: "Reported" } });
      fireEvent.click(screen.getByRole("button", { name: "Save issue" }));

      expect(
        screen.getByText("Reported", { selector: ".issue-status" }),
      ).toBeInTheDocument();
    },
    15_000,
  );

  // @lat: [[dsw-store-locator#Campaign Manager#Manager Screen]]
  it("opens campaign management from the header and exposes campaign actions", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open campaign manager" }),
    );
    expect(
      screen.getByRole("heading", { name: "Campaign manager" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "493 stores selected" }),
    );
    expect(
      screen.getByRole("heading", { name: "Edit campaign" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Close campaign form" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Delete 35th Birthday" }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete 35th Birthday?" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(
      screen.getByRole("button", { name: "Return to stores" }),
    );
    expect(
      screen.queryByRole("heading", { name: "Campaign manager" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Store directory" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open campaign manager" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add campaign" }));
    expect(
      screen.getByRole("heading", { name: "Add campaign" }),
    ).toBeInTheDocument();
  });
});
