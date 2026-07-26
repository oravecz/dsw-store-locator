import {
  ISSUE_STATUSES,
  type CampaignIssue,
  type IssueStatus,
} from "../types";

const storageKey = "dsw-campaign-field-guide:issues:v1";

export const isCompletedIssueStatus = (status: IssueStatus) =>
  status === "Resolved" || status === "Accepted";

const migrateIssue = (value: unknown): CampaignIssue | null => {
  if (!value || typeof value !== "object") return null;
  const issue = value as Record<string, unknown>;
  const requiredKeys = [
    "id",
    "campaignId",
    "storeNumber",
    "summary",
    "createdAt",
  ];
  if (requiredKeys.some((key) => typeof issue[key] !== "string")) return null;

  const legacyStatus = String(issue.status ?? "");
  const status = ISSUE_STATUSES.includes(legacyStatus as IssueStatus)
    ? (legacyStatus as IssueStatus)
    : legacyStatus === "Resolved"
      ? "Resolved"
      : "New";

  return {
    id: String(issue.id),
    campaignId: String(issue.campaignId),
    storeNumber: String(issue.storeNumber),
    summary: String(issue.summary),
    notes: typeof issue.notes === "string" ? issue.notes : "",
    status,
    createdAt: String(issue.createdAt),
  };
};

// @lat: [[dsw-store-locator#Issue Status Workflow#Legacy Migration]]
export function loadIssues(): CampaignIssue[] {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return [];
    const issues = JSON.parse(value) as unknown;
    return Array.isArray(issues)
      ? issues
          .map(migrateIssue)
          .filter((issue): issue is CampaignIssue => issue !== null)
      : [];
  } catch {
    return [];
  }
}

export function saveIssues(issues: CampaignIssue[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(issues));
}
