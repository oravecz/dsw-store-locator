import Fuse from "fuse.js";
import type { Store } from "../types";

const searchKeys: Array<keyof Store> = [
  "store",
  "storeNumber",
  "mallName",
  "openDate",
  "address",
  "city",
  "state",
  "zip",
  "phone",
  "fax",
  "storeHours",
  "district",
  "region",
];

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const directRank = (store: Store, query: string) => {
  let best = Number.POSITIVE_INFINITY;

  searchKeys.forEach((key, fieldIndex) => {
    const field = normalize(store[key]);
    const position = field.indexOf(query);
    if (position === -1) return;

    const startsAtField = position === 0 ? 0 : 1;
    best = Math.min(best, startsAtField * 1000 + position * 10 + fieldIndex);
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
