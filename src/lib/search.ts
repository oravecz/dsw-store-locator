import Fuse from "fuse.js";
import type { Store } from "../types";

const partialSearchKeys: Array<keyof Store> = [
  "storeNumber",
  "zip",
  "mallName",
  "address",
  "store",
  "city",
  "state",
  "district",
  "region",
  "phone",
  "fax",
  "storeHours",
  "openDate",
];

const searchKeys = partialSearchKeys;

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const directRank = (store: Store, query: string) => {
  let best = Number.POSITIVE_INFINITY;

  partialSearchKeys.forEach((key, fieldIndex) => {
    const field = normalize(store[key]);
    const position = field.indexOf(query);
    if (position === -1) return;

    const matchType = field === query ? 0 : position === 0 ? 1 : 2;
    best = Math.min(
      best,
      fieldIndex * 1_000_000 + matchType * 100_000 + position,
    );
  });

  return best;
};

export function searchStores(stores: Store[], rawQuery: string, limit = 100) {
  const query = normalize(rawQuery);
  if (!query) return stores.slice(0, limit);

  const direct = stores
    .map((store) => ({ store, rank: directRank(store, query) }))
    .filter(({ rank }) => Number.isFinite(rank))
    .sort(
      (left, right) =>
        left.rank - right.rank ||
        left.store.mallName.localeCompare(right.store.mallName),
    )
    .map(({ store }) => store);

  const directIds = new Set(direct.map((store) => store.storeNumber));
  const fuzzy = new Fuse(stores, {
    keys: searchKeys,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
    threshold: 0.34,
    shouldSort: true,
    useExtendedSearch: false,
  })
    .search(query)
    .filter(({ item }) => !directIds.has(item.storeNumber))
    .map(({ item }) => item);

  return [...direct, ...fuzzy].slice(0, limit);
}
