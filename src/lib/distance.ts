import type { Store } from "../types";

const earthRadiusMiles = 3958.7613;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceInMiles(
  from: Pick<Store, "latitude" | "longitude">,
  to: Pick<Store, "latitude" | "longitude">,
) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(haversine));
}

export function nearestStores(selected: Store, stores: Store[], count = 5) {
  return stores
    .filter((store) => store.storeNumber !== selected.storeNumber)
    .map((store) => ({
      store,
      distance: distanceInMiles(selected, store),
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, count);
}
