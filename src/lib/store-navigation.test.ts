import { describe, expect, it } from "vitest";
import {
  isEdgeBackSwipe,
  openStoreNavigation,
  popStoreNavigation,
  pushStoreNavigation,
} from "./store-navigation";

describe("store navigation", () => {
  it("resets from the directory and stacks nearby stores", () => {
    const opened = openStoreNavigation("9051");
    const stacked = pushStoreNavigation(opened, "9092");

    expect(opened).toEqual(["9051"]);
    expect(stacked).toEqual(["9051", "9092"]);
    expect(popStoreNavigation(stacked)).toEqual(["9051"]);
    expect(popStoreNavigation(opened)).toEqual([]);
  });

  it("does not stack the currently selected store twice", () => {
    const history = ["9051"];
    expect(pushStoreNavigation(history, "9051")).toBe(history);
  });

  it("recognizes a deliberate right swipe from the left edge", () => {
    expect(isEdgeBackSwipe({ x: 12, y: 240 }, { x: 104, y: 252 })).toBe(
      true,
    );
    expect(isEdgeBackSwipe({ x: 46, y: 240 }, { x: 140, y: 245 })).toBe(
      false,
    );
    expect(isEdgeBackSwipe({ x: 12, y: 240 }, { x: 62, y: 244 })).toBe(
      false,
    );
    expect(isEdgeBackSwipe({ x: 12, y: 240 }, { x: 100, y: 330 })).toBe(
      false,
    );
  });
});
