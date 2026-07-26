import { describe, expect, it } from "vitest";
import type { CampaignIssue, Store } from "../types";
import {
  buildIssueExport,
  canonicalAttentionValue,
  DEFAULT_ATTENTION_STATUSES,
  filterIssuesByAttentionAndStatus,
  filterStoresByAttention,
  getAttentionOptions,
  loadAttentionStatuses,
  saveAttentionStatuses,
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
  overrides: Partial<CampaignIssue> = {},
): CampaignIssue => ({
  id,
  campaignId: "35th-birthday",
  storeNumber,
  summary,
  notes: "Front window",
  status: "Reported",
  createdAt: "2026-07-26T12:00:00.000Z",
  ...overrides,
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

  it("filters stores by matching attention values and statuses", () => {
    const stores = [store("9051", "Dublin"), store("9052", "Easton")];
    const issues = [
      issue("1", "9051", "Window decal", { status: "New" }),
      issue("2", "9052", "Missing sign", { status: "Resolved" }),
      issue("3", "9052", "Window decal", { status: "Resolved" }),
    ];

    expect(
      filterStoresByAttention(
        stores,
        issues,
        ["window decal", "missing sign"],
        ["New", "Reported"],
      ).map((item) => item.storeNumber),
    ).toEqual(["9051"]);
    expect(
      filterStoresByAttention(
        stores,
        issues,
        ["window decal"],
        ["New", "Resolved"],
      ).map((item) => item.storeNumber),
    ).toEqual(["9051", "9052"]);
    expect(
      filterIssuesByAttentionAndStatus(
        issues,
        ["window decal"],
        ["Resolved"],
      ).map((item) => item.id),
    ).toEqual(["3"]);
  });

  it("defaults and persists attention status choices", () => {
    window.localStorage.clear();
    expect(loadAttentionStatuses()).toEqual(DEFAULT_ATTENTION_STATUSES);

    saveAttentionStatuses(["Resolved", "Accepted"]);
    expect(loadAttentionStatuses()).toEqual(["Resolved", "Accepted"]);

    saveAttentionStatuses([]);
    expect(loadAttentionStatuses()).toEqual([]);
  });

  it("exports matching HTML and tab-separated table formats", () => {
    const content = buildIssueExport(
      [store("9051", "Dublin-Sawmill")],
      [issue("1", "9051", "Window decal")],
    );

    expect(content.plainText).toContain(
      "Store\tMall name\tAddress\tCity\tState\tZIP",
    );
    expect(content.plainText).toContain(
      "What needs attention\tNotes\tStatus\tCreated",
    );
    expect(content.plainText).toContain(
      "29051\tDublin-Sawmill\t100 Main Street\tColumbus\tOH\t43000\tWindow decal",
    );

    const template = document.createElement("template");
    template.innerHTML = content.html;
    expect(template.content.querySelectorAll("thead th")).toHaveLength(10);
    expect(template.content.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(
      [...template.content.querySelectorAll("tbody td")].map(
        (cell) => cell.textContent,
      ),
    ).toEqual(content.plainText.split("\n")[1].split("\t"));
  });

  it("uses one row per issue and a blank issue row for stores without issues", () => {
    const content = buildIssueExport(
      [store("9051", "Dublin"), store("9052", "Easton")],
      [
        issue("1", "9051", "Window decal"),
        issue("2", "9051", "Missing sign"),
      ],
    );
    const rows = content.plainText
      .split("\n")
      .slice(1)
      .map((row) => row.split("\t"));

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row[6])).toEqual([
      "Window decal",
      "Missing sign",
      "",
    ]);
    expect(rows[2].slice(6)).toEqual(["", "", "", ""]);
  });

  it("escapes HTML from store and issue content", () => {
    const content = buildIssueExport(
      [store("9051", "Dublin & <Sawmill>")],
      [
        issue("1", "9051", "<script>alert('x')</script>", {
          notes: 'Use "front" & side',
        }),
      ],
    );
    const template = document.createElement("template");
    template.innerHTML = content.html;

    expect(template.content.querySelector("script")).toBeNull();
    expect(content.html).not.toContain("<script>alert");
    expect(template.content.querySelector("tbody")?.textContent).toContain(
      "<script>alert('x')</script>",
    );
    expect(template.content.querySelector("tbody")?.textContent).toContain(
      'Use "front" & side',
    );
  });
});
