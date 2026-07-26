import { beforeEach, describe, expect, it } from "vitest";
import { isCompletedIssueStatus, loadIssues } from "./issues";

const storageKey = "dsw-campaign-field-guide:issues:v1";

describe("issue persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("migrates legacy open and resolved issues to the new status workflow", () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          id: "open",
          campaignId: "campaign",
          storeNumber: "9051",
          summary: "Window decal",
          notes: "",
          priority: "High",
          status: "Open",
          createdAt: "2026-07-26T12:00:00.000Z",
        },
        {
          id: "resolved",
          campaignId: "campaign",
          storeNumber: "9052",
          summary: "Counter sign",
          notes: "",
          priority: "Low",
          status: "Resolved",
          createdAt: "2026-07-26T13:00:00.000Z",
        },
      ]),
    );

    expect(loadIssues()).toEqual([
      {
        id: "open",
        campaignId: "campaign",
        storeNumber: "9051",
        summary: "Window decal",
        notes: "",
        status: "New",
        createdAt: "2026-07-26T12:00:00.000Z",
      },
      {
        id: "resolved",
        campaignId: "campaign",
        storeNumber: "9052",
        summary: "Counter sign",
        notes: "",
        status: "Resolved",
        createdAt: "2026-07-26T13:00:00.000Z",
      },
    ]);
  });

  it("treats resolved and accepted issues as completed", () => {
    expect(isCompletedIssueStatus("New")).toBe(false);
    expect(isCompletedIssueStatus("Reported")).toBe(false);
    expect(isCompletedIssueStatus("Resolved")).toBe(true);
    expect(isCompletedIssueStatus("Accepted")).toBe(true);
  });
});
