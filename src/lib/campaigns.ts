import type { Campaign, Store } from "../types";

const storageKey = "dsw-activations:campaigns:v1";

const defaultCampaigns: Campaign[] = [
  {
    id: "35th-birthday",
    name: "35th Birthday",
    startDate: "2026-07-26",
  },
];

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const isCampaign = (value: unknown): value is Campaign => {
  if (!value || typeof value !== "object") return false;
  const campaign = value as Partial<Campaign>;
  return (
    typeof campaign.id === "string" &&
    typeof campaign.name === "string" &&
    typeof campaign.startDate === "string" &&
    datePattern.test(campaign.startDate) &&
    (campaign.storeNumbers === undefined ||
      (Array.isArray(campaign.storeNumbers) &&
        campaign.storeNumbers.every(
          (storeNumber) => typeof storeNumber === "string",
        )))
  );
};

const dayNumber = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
};

export const dateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function loadCampaigns(): Campaign[] {
  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return defaultCampaigns.map((campaign) => ({ ...campaign }));

    const campaigns = JSON.parse(value) as unknown;
    return Array.isArray(campaigns) && campaigns.every(isCampaign)
      ? campaigns
      : defaultCampaigns.map((campaign) => ({ ...campaign }));
  } catch {
    return defaultCampaigns.map((campaign) => ({ ...campaign }));
  }
}

export function saveCampaigns(campaigns: Campaign[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(campaigns));
}

// @lat: [[dsw-store-locator#Campaign Store Scope#Persistence and Filtering]]
export function getCampaignStoreNumbers(
  campaign: Campaign | null,
  stores: Store[],
) {
  return campaign?.storeNumbers ?? stores.map((store) => store.storeNumber);
}

export function normalizeCampaignStoreNumbers(
  selectedStoreNumbers: Iterable<string>,
  stores: Store[],
) {
  const selected = new Set(selectedStoreNumbers);
  const normalized = stores
    .map((store) => store.storeNumber)
    .filter((storeNumber) => selected.has(storeNumber));

  return normalized.length === stores.length ? undefined : normalized;
}

export function filterStoresForCampaign(
  campaign: Campaign | null,
  stores: Store[],
) {
  if (!campaign?.storeNumbers) return stores;
  const included = new Set(campaign.storeNumbers);
  return stores.filter((store) => included.has(store.storeNumber));
}

export function groupCampaigns(campaigns: Campaign[], today: string) {
  const archiveBefore = dayNumber(today) - 7;
  const currentAndUpcoming = campaigns
    .filter((campaign) => dayNumber(campaign.startDate) >= archiveBefore)
    .sort(
      (left, right) =>
        left.startDate.localeCompare(right.startDate) ||
        left.name.localeCompare(right.name),
    );
  const archived = campaigns
    .filter((campaign) => dayNumber(campaign.startDate) < archiveBefore)
    .sort(
      (left, right) =>
        right.startDate.localeCompare(left.startDate) ||
        left.name.localeCompare(right.name),
    );

  return { currentAndUpcoming, archived };
}

export function selectInitialCampaign(
  campaigns: Campaign[],
  today: string,
) {
  if (!campaigns.length) return "";

  const todayDay = dayNumber(today);
  const dated = campaigns.map((campaign) => ({
    campaign,
    day: dayNumber(campaign.startDate),
  }));
  const todayCampaign = dated
    .filter(({ day }) => day === todayDay)
    .sort((left, right) =>
      left.campaign.name.localeCompare(right.campaign.name),
    )[0];
  if (todayCampaign) return todayCampaign.campaign.id;

  const upcoming = dated
    .filter(({ day }) => day > todayDay)
    .sort(
      (left, right) =>
        left.day - right.day ||
        left.campaign.name.localeCompare(right.campaign.name),
    )[0];
  if (upcoming) return upcoming.campaign.id;

  return dated
    .sort(
      (left, right) =>
        right.day - left.day ||
        left.campaign.name.localeCompare(right.campaign.name),
    )[0].campaign.id;
}
