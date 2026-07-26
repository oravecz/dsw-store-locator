export type CoordinateSource = "census-address" | "zip-centroid";

export interface Store {
  store: string;
  storeNumber: string;
  mallName: string;
  openDate: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string;
  storeHours: string;
  district: string;
  region: string;
  latitude: number;
  longitude: number;
  coordinateSource: CoordinateSource;
}

export interface Campaign {
  id: string;
  name: string;
  startDate: string;
  storeNumbers?: string[];
}

export type IssuePriority = "Low" | "Medium" | "High";
export type IssueStatus = "Open" | "Resolved";

export interface CampaignIssue {
  id: string;
  campaignId: string;
  storeNumber: string;
  summary: string;
  notes: string;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
}
