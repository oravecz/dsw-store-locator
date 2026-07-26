import type { CampaignIssue, Store } from "../types";

export interface AttentionOption {
  key: string;
  label: string;
  count: number;
}

export const normalizeAttention = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

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

export function filterStoresByAttention(
  stores: Store[],
  issues: CampaignIssue[],
  selectedKeys: string[],
) {
  if (!selectedKeys.length) return stores;

  const selected = new Set(selectedKeys);
  const matchingStores = new Set(
    issues
      .filter((issue) => selected.has(normalizeAttention(issue.summary)))
      .map((issue) => issue.storeNumber),
  );

  return stores.filter((store) => matchingStores.has(store.storeNumber));
}

const exportCell = (value: string) =>
  value.replaceAll("\t", " ").replace(/\r?\n/g, " ").trim();

export function buildIssueExport(
  stores: Store[],
  issues: CampaignIssue[],
) {
  const header = [
    "Store number",
    "Mall name",
    "Address",
    "City",
    "State",
    "ZIP",
    "What needs attention",
    "Notes",
    "Priority",
    "Status",
    "Created",
  ];
  const rows = [header.join("\t")];

  stores.forEach((store) => {
    const storeIssues = issues.filter(
      (issue) => issue.storeNumber === store.storeNumber,
    );
    const issueRows: Array<CampaignIssue | null> = storeIssues.length
      ? storeIssues
      : [null];

    issueRows.forEach((issue) => {
      rows.push(
        [
          store.storeNumber,
          store.mallName,
          store.address,
          store.city,
          store.state,
          store.zip,
          issue?.summary ?? "",
          issue?.notes ?? "",
          issue?.priority ?? "",
          issue?.status ?? "",
          issue?.createdAt ?? "",
        ]
          .map(exportCell)
          .join("\t"),
      );
    });
  });

  return rows.join("\n");
}
