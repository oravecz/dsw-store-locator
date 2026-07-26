import { describe, expect, it } from "vitest";
import { isCampaignDrawerPull } from "./campaign-drawer";

describe("campaign pull-down drawer", () => {
  it("recognizes a deliberate downward pull from the top", () => {
    expect(
      isCampaignDrawerPull({ x: 180, y: 24 }, { x: 184, y: 102 }, 0),
    ).toBe(true);
  });

  it("rejects pulls that begin below the top, while scrolled, or move sideways", () => {
    expect(
      isCampaignDrawerPull({ x: 180, y: 100 }, { x: 184, y: 180 }, 0),
    ).toBe(false);
    expect(
      isCampaignDrawerPull({ x: 180, y: 24 }, { x: 184, y: 102 }, 12),
    ).toBe(false);
    expect(
      isCampaignDrawerPull({ x: 20, y: 24 }, { x: 120, y: 94 }, 0),
    ).toBe(false);
  });
});
