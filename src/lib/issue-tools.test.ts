import { describe, expect, it } from "vitest";
import type { CampaignIssue, Store } from "../types";
import {
  buildIssueExport,
  canonicalAttentionValue,
  filterStoresByAttention,
  getAttentionOptions,
} from "./issue-tools";

const store = (storeNumber: string, mallName: string): Store => ({
  store: `2${storeNumber}`,
  storeNumber,
  mallName,
  openDate: "2020-01-01",
  address: "100 Main Street",
  city: "Columbus",
  state: "OH",
  zip: "43000",
  phone: "555-0100",
  fax: "",
  storeHours: "Mon-Sat 10am-8pm",
  district: "Columbus",
  region: "Great",
  latitude: 40,
  longitude: -83,
  coordinateSource: "census-address",
});

const issue = (
  id: string,
  storeNumber: string,
  summary: string,
): CampaignIssue => ({
  id,
  campaignId: "35th-birthday",
  storeNumber,
  summary,
  notes: "Front window",
  priority: "High",
  status: "Open",
  createdAt: "2026-07-26T12:00:00.000Z",
});

describe("issue tools", () => {
  it("deduplicates attention suggestions and preserves the first label", () => {
    const options = getAttentionOptions([
      issue("1", "9051", "Window decal"),
      issue("2", "9052", "  window   decal "),
    ]);

    expect(options).toEqual([
      { key: "window decal", label: "Window decal", count: 2 },
    ]);
    expect(canonicalAttentionValue("WINDOW DECAL", options)).toBe(
      "Window decal",
    );
  });

  it("filters stores matching any selected attention value", () => {
    const stores = [store("9051", "Dublin"), store("9052", "Easton")];
    const issues = [
      issue("1", "9051", "Window decal"),
      issue("2", "9052", "Missing sign"),
    ];

    expect(
      filterStoresByAttention(stores, issues, [
        "window decal",
        "missing sign",
      ]).map((item) => item.storeNumber),
    ).toEqual(["9051", "9052"]);
    expect(
      filterStoresByAttention(stores, issues, ["window decal"]).map(
        (item) => item.storeNumber,
      ),
    ).toEqual(["9051"]);
  });

  it("exports store and issue details as tab-separated rows", () => {
    const text = buildIssueExport(
      [store("9051", "Dublin-Sawmill")],
      [issue("1", "9051", "Window decal")],
    );

    expect(text).toContain(
      "Store number\tMall name\tAddress\tCity\tState\tZIP",
    );
    expect(text).toContain(
      "9051\tDublin-Sawmill\t100 Main Street\tColumbus\tOH\t43000\tWindow decal",
    );
  });
});
