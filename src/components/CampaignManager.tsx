import {
  ArrowLeft,
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Store as StoreIcon,
  Trash2,
} from "lucide-react";
import { filterStoresForCampaign } from "../lib/campaigns";
import { isCompletedIssueStatus } from "../lib/issues";
import type { Campaign, CampaignIssue, Store } from "../types";

interface CampaignGroups {
  currentAndUpcoming: Campaign[];
  archived: Campaign[];
}

interface CampaignManagerProps {
  activeCampaignId: string;
  groups: CampaignGroups;
  issues: CampaignIssue[];
  stores: Store[];
  onAdd: () => void;
  onClose: () => void;
  onDelete: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onSelect: (campaign: Campaign) => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));

// @lat: [[dsw-store-locator#Campaign Manager#Manager Screen]]
export function CampaignManager({
  activeCampaignId,
  groups,
  issues,
  stores,
  onAdd,
  onClose,
  onDelete,
  onEdit,
  onSelect,
}: CampaignManagerProps) {
  const renderCampaign = (campaign: Campaign) => {
    const isActive = campaign.id === activeCampaignId;
    const storeCount = filterStoresForCampaign(campaign, stores).length;
    const campaignIssues = issues.filter(
      (issue) => issue.campaignId === campaign.id,
    );
    const openIssueCount = campaignIssues.filter(
      (issue) => !isCompletedIssueStatus(issue.status),
    ).length;

    return (
      <article
        className={`campaign-manager-card ${isActive ? "active" : ""}`}
        key={campaign.id}
      >
        <div className="manager-card-heading">
          <div>
            {isActive && (
              <span className="current-campaign-badge">
                <Check size={13} />
                Current
              </span>
            )}
            <h3>{campaign.name}</h3>
            <span className="manager-campaign-date">
              <CalendarDays size={15} />
              Starts {formatDate(campaign.startDate)}
            </span>
          </div>
          <button
            className="manager-delete-button"
            type="button"
            onClick={() => onDelete(campaign)}
            aria-label={`Delete ${campaign.name}`}
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="manager-card-stats">
          <button type="button" onClick={() => onEdit(campaign)}>
            <StoreIcon size={16} />
            {storeCount} {storeCount === 1 ? "store" : "stores"} selected
          </button>
          <span>
            {openIssueCount} open {openIssueCount === 1 ? "issue" : "issues"}
          </span>
        </div>

        <div className="manager-card-actions">
          <button
            className="manager-select-button"
            type="button"
            onClick={() => onSelect(campaign)}
          >
            {isActive ? <ArrowLeft size={16} /> : <Check size={16} />}
            {isActive ? "Return to stores" : "Select campaign"}
          </button>
          <button
            className="manager-edit-button"
            type="button"
            onClick={() => onEdit(campaign)}
          >
            <Pencil size={16} />
            Edit campaign
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="campaign-manager" aria-labelledby="campaign-manager-title">
      <div className="campaign-manager-topbar">
        <button type="button" onClick={onClose}>
          <ArrowLeft size={17} />
          Back to stores
        </button>
        <button className="manager-add-button" type="button" onClick={onAdd}>
          <Plus size={17} />
          Add campaign
        </button>
      </div>

      <div className="campaign-manager-heading">
        <p className="eyebrow">Activation setup</p>
        <h1 id="campaign-manager-title">Campaign manager</h1>
        <p>
          Choose the active campaign and manage its dates, participating stores,
          and campaign history.
        </p>
      </div>

      {groups.currentAndUpcoming.length > 0 && (
        <section className="campaign-manager-group">
          <div className="manager-group-heading">
            <h2>Current &amp; upcoming</h2>
            <span>{groups.currentAndUpcoming.length}</span>
          </div>
          <div className="campaign-manager-grid">
            {groups.currentAndUpcoming.map(renderCampaign)}
          </div>
        </section>
      )}

      {groups.archived.length > 0 && (
        <section className="campaign-manager-group archived">
          <div className="manager-group-heading">
            <h2>Archived</h2>
            <span>{groups.archived.length}</span>
          </div>
          <div className="campaign-manager-grid">
            {groups.archived.map(renderCampaign)}
          </div>
        </section>
      )}

      {!groups.currentAndUpcoming.length && !groups.archived.length && (
        <section className="campaign-manager-empty">
          <StoreIcon size={30} />
          <h2>No campaigns yet</h2>
          <p>Add a campaign to choose participating stores and begin logging.</p>
          <button type="button" onClick={onAdd}>
            <Plus size={17} />
            Add campaign
          </button>
        </section>
      )}
    </main>
  );
}
