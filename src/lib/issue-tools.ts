import {
  ISSUE_STATUSES,
  type CampaignIssue,
  type IssueStatus,
  type Store,
} from "../types";

const attentionStatusStorageKey =
  "dsw-activations:attention-statuses:v1";

export const DEFAULT_ATTENTION_STATUSES: IssueStatus[] = ["New", "Reported"];

export interface AttentionOption {
  key: string;
  label: string;
  count: number;
}

export interface IssueExport {
  html: string;
  plainText: string;
}

export const normalizeAttention = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export function loadAttentionStatuses(): IssueStatus[] {
  try {
    const stored = window.localStorage.getItem(attentionStatusStorageKey);
    if (stored === null) return [...DEFAULT_ATTENTION_STATUSES];

    const value = JSON.parse(stored) as unknown;
    if (
      !Array.isArray(value) ||
      value.some(
        (status) =>
          typeof status !== "string" ||
          !ISSUE_STATUSES.includes(status as IssueStatus),
      )
    ) {
      return [...DEFAULT_ATTENTION_STATUSES];
    }

    return ISSUE_STATUSES.filter((status) => value.includes(status));
  } catch {
    return [...DEFAULT_ATTENTION_STATUSES];
  }
}

export function saveAttentionStatuses(statuses: IssueStatus[]) {
  window.localStorage.setItem(
    attentionStatusStorageKey,
    JSON.stringify(statuses),
  );
}

export function getAttentionOptions(
  issues: CampaignIssue[],
): AttentionOption[] {
  const options = new Map<string, AttentionOption>();

  issues.forEach((issue) => {
    const label = issue.summary.trim().replace(/\s+/g, " ");
    const key = normalizeAttention(label);
    if (!key) return;

    const existing = options.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      options.set(key, { key, label, count: 1 });
    }
  });

  return [...options.values()].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

export function canonicalAttentionValue(
  value: string,
  options: AttentionOption[],
) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const match = options.find(
    (option) => option.key === normalizeAttention(trimmed),
  );
  return match?.label ?? trimmed;
}

export function filterIssuesByAttentionAndStatus(
  issues: CampaignIssue[],
  selectedKeys: string[],
  selectedStatuses: IssueStatus[],
) {
  if (!selectedKeys.length) return issues;

  const selectedAttention = new Set(selectedKeys);
  const selectedStatus = new Set(selectedStatuses);

  return issues.filter(
    (issue) =>
      selectedAttention.has(normalizeAttention(issue.summary)) &&
      selectedStatus.has(issue.status),
  );
}

export function filterStoresByAttention(
  stores: Store[],
  issues: CampaignIssue[],
  selectedKeys: string[],
  selectedStatuses: IssueStatus[],
) {
  if (!selectedKeys.length) return stores;

  const matchingStores = new Set(
    filterIssuesByAttentionAndStatus(
      issues,
      selectedKeys,
      selectedStatuses,
    ).map((issue) => issue.storeNumber),
  );

  return stores.filter((store) => matchingStores.has(store.storeNumber));
}

const exportCell = (value: string) =>
  value.replaceAll("\t", " ").replace(/\r?\n/g, " ").trim();

const exportHeaders = [
  "Store",
  "Mall name",
  "Address",
  "City",
  "State",
  "ZIP",
  "What needs attention",
  "Notes",
  "Status",
  "Created",
];

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const tableStyle =
  "border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;";
const headerCellStyle =
  "border:1px solid #999;background:#17120f;color:#fff;padding:6px 8px;text-align:left;font-weight:bold;";
const bodyCellStyle =
  "border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top;";

// @lat: [[dsw-store-locator#Clipboard Export#Rich Table Format]]
export function buildIssueExport(
  stores: Store[],
  issues: CampaignIssue[],
): IssueExport {
  const issuesByStore = new Map<string, CampaignIssue[]>();
  issues.forEach((issue) => {
    const storeIssues = issuesByStore.get(issue.storeNumber) ?? [];
    storeIssues.push(issue);
    issuesByStore.set(issue.storeNumber, storeIssues);
  });

  const rows = stores.flatMap((store) => {
    const storeIssues = issuesByStore.get(store.storeNumber) ?? [];
    const issueRows: Array<CampaignIssue | null> = storeIssues.length
      ? storeIssues
      : [null];

    return issueRows.map((issue) =>
      [
        store.store,
        store.mallName,
        store.address,
        store.city,
        store.state,
        store.zip,
        issue?.summary ?? "",
        issue?.notes ?? "",
        issue?.status ?? "",
        issue?.createdAt ?? "",
      ].map(exportCell),
    );
  });

  const plainText = [exportHeaders, ...rows]
    .map((row) => row.join("\t"))
    .join("\n");
  const html = [
    `<table style="${tableStyle}">`,
    "<thead><tr>",
    ...exportHeaders.map(
      (header) =>
        `<th style="${headerCellStyle}">${escapeHtml(header)}</th>`,
    ),
    "</tr></thead>",
    "<tbody>",
    ...rows.map(
      (row) =>
        `<tr>${row
          .map(
            (value) =>
              `<td style="${bodyCellStyle}">${escapeHtml(value)}</td>`,
          )
          .join("")}</tr>`,
    ),
    "</tbody></table>",
  ].join("");

  return { html, plainText };
}
