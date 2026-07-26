import { describe, expect, it } from "vitest";
import type { Store } from "../types";
import { filterStoresByPartialMatch, searchStores } from "./search";

const store = (
  storeNumber: string,
  mallName: string,
  city: string,
  overrides: Partial<Store> = {},
): Store => ({
  store: `2${storeNumber}`,
  storeNumber,
  mallName,
  openDate: "2020-01-01",
  address: "100 Main Street",
  city,
  state: "OH",
  zip: "43000",
  phone: "555-0100",
  fax: "555-0101",
  storeHours: "Mon-Sat 10am-8pm",
  district: "Columbus",
  region: "Great",
  latitude: 40,
  longitude: -83,
  coordinateSource: "census-address",
  ...overrides,
});

const fixtures = [
  store("9051", "Dublin-Sawmill", "Columbus"),
  store("9100", "Colonial Commons", "Harrisburg", { state: "PA" }),
  store("9200", "Market Square", "Austin", { state: "TX" }),
];

describe("searchStores", () => {
  it("places direct partial matches ahead of fuzzy-only matches", () => {
    const results = searchStores(fixtures, "columbus");

    expect(results[0].storeNumber).toBe("9051");
  });

  it("ranks partial matches by store number, ZIP, mall, then address", () => {
    const rankedFixtures = [
      store("1001", "North Plaza", "Columbus", {
        address: "55 Campaign Road",
      }),
      store("1002", "Campaign Center", "Columbus"),
      store("1003", "South Plaza", "Columbus", { zip: "Campaign 43000" }),
      store("Campaign 1004", "West Plaza", "Columbus"),
    ];

    expect(
      searchStores(rankedFixtures, "campaign").map(
        (result) => result.storeNumber,
      ),
    ).toEqual(["Campaign 1004", "1003", "1002", "1001"]);
  });

  it("finds misspelled values with fuzzy matching", () => {
    const results = searchStores(fixtures, "dublen sawmil");

    expect(results[0].mallName).toBe("Dublin-Sawmill");
  });

  it("can restrict campaign filtering to partial matches", () => {
    expect(filterStoresByPartialMatch(fixtures, "Dublin-Sawmill")).toHaveLength(
      1,
    );
    expect(filterStoresByPartialMatch(fixtures, "dublen sawmil")).toHaveLength(
      0,
    );
  });

  it("searches operational fields such as district and phone", () => {
    expect(searchStores(fixtures, "555 0100")).toHaveLength(3);
    expect(searchStores(fixtures, "columbus")[0].storeNumber).toBe("9051");
  });
});
