import type { CampaignIssue } from "../types";

const storageKey = "dsw-campaign-field-guide:issues:v1";

export function loadIssues(): CampaignIssue[] {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as CampaignIssue[]) : [];
  } catch {
    return [];
  }
}

export function saveIssues(issues: CampaignIssue[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(issues));
}
