import { describe, expect, it } from "vitest";
import type { Campaign } from "../types";
import { groupCampaigns, selectInitialCampaign } from "./campaigns";

const campaign = (id: string, startDate: string): Campaign => ({
  id,
  name: id,
  startDate,
});

describe("campaign dates", () => {
  it("groups campaigns older than seven days as archived", () => {
    const groups = groupCampaigns(
      [
        campaign("oldest-active", "2026-07-19"),
        campaign("today", "2026-07-26"),
        campaign("upcoming", "2026-08-02"),
        campaign("old-archive", "2026-06-01"),
        campaign("new-archive", "2026-07-18"),
      ],
      "2026-07-26",
    );

    expect(groups.currentAndUpcoming.map(({ id }) => id)).toEqual([
      "oldest-active",
      "today",
      "upcoming",
    ]);
    expect(groups.archived.map(({ id }) => id)).toEqual([
      "new-archive",
      "old-archive",
    ]);
  });

  it("selects today before the nearest upcoming campaign", () => {
    const campaigns = [
      campaign("future-near", "2026-07-27"),
      campaign("today", "2026-07-26"),
      campaign("future-far", "2026-08-10"),
    ];

    expect(selectInitialCampaign(campaigns, "2026-07-26")).toBe("today");
    expect(
      selectInitialCampaign(
        campaigns.filter(({ id }) => id !== "today"),
        "2026-07-26",
      ),
    ).toBe("future-near");
  });

  it("falls back to the newest past campaign when no future exists", () => {
    expect(
      selectInitialCampaign(
        [
          campaign("older", "2026-06-01"),
          campaign("newer", "2026-07-20"),
        ],
        "2026-07-26",
      ),
    ).toBe("newer");
  });
});
