import { describe, expect, it } from "vitest";
import type { Store } from "../types";
import { distanceInMiles, nearestStores } from "./distance";

const store = (
  storeNumber: string,
  latitude: number,
  longitude: number,
): Store => ({
  store: `2${storeNumber}`,
  storeNumber,
  mallName: `Store ${storeNumber}`,
  openDate: "2020-01-01",
  address: "100 Main Street",
  city: "Test City",
  state: "OH",
  zip: "43000",
  phone: "",
  fax: "",
  storeHours: "",
  district: "",
  region: "",
  latitude,
  longitude,
  coordinateSource: "census-address",
});

describe("store proximity", () => {
  it("calculates a realistic distance between Columbus and Cleveland", () => {
    const miles = distanceInMiles(
      { latitude: 39.9612, longitude: -82.9988 },
      { latitude: 41.4993, longitude: -81.6944 },
    );

    expect(miles).toBeGreaterThan(120);
    expect(miles).toBeLessThan(130);
  });

  it("returns the requested number of nearest stores in order", () => {
    const selected = store("1", 40, -83);
    const stores = [
      selected,
      store("2", 40.1, -83),
      store("3", 41, -83),
      store("4", 40.2, -83),
    ];

    expect(nearestStores(selected, stores, 2).map(({ store }) => store.storeNumber))
      .toEqual(["2", "4"]);
  });
});
