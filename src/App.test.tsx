import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("campaign store selection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // @lat: [[dsw-store-locator#Campaign Store Scope#Store Selection Workflow]]
  it("edits campaign coverage and applies it to the store directory", () => {
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
  });
});
