import {
  ArrowLeft,
  Check,
  Copy,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  getCampaignStoreNumbers,
  normalizeCampaignStoreNumbers,
} from "../lib/campaigns";
import { filterStoresByPartialMatch } from "../lib/search";
import type { Campaign, Store } from "../types";

export interface CampaignDraft {
  name: string;
  startDate: string;
  storeNumbers?: string[];
}

interface CampaignEditorProps {
  campaign: Campaign | null;
  campaigns: Campaign[];
  stores: Store[];
  today: string;
  onCancel: () => void;
  onSave: (draft: CampaignDraft) => void;
}

const selectionLabel = (count: number) =>
  `${count} ${count === 1 ? "store" : "stores"} selected`;

// @lat: [[dsw-store-locator#Campaign Store Scope#Store Selection Workflow]]
export function CampaignEditor({
  campaign,
  campaigns,
  stores,
  today,
  onCancel,
  onSave,
}: CampaignEditorProps) {
  const [selectedStoreNumbers, setSelectedStoreNumbers] = useState(
    () => new Set(getCampaignStoreNumbers(campaign, stores)),
  );
  const [storeQuery, setStoreQuery] = useState("");
  const visibleStores = useMemo(
    () => filterStoresByPartialMatch(stores, storeQuery, stores.length),
    [storeQuery, stores],
  );
  const otherCampaigns = campaigns.filter((item) => item.id !== campaign?.id);

  const submitCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("campaign-name") ?? "").trim();
    const startDate = String(data.get("campaign-start-date") ?? "");
    if (!name || !startDate) return;

    onSave({
      name,
      startDate,
      storeNumbers: normalizeCampaignStoreNumbers(
        selectedStoreNumbers,
        stores,
      ),
    });
  };

  const toggleStore = (storeNumber: string) => {
    setSelectedStoreNumbers((current) => {
      const next = new Set(current);
      if (next.has(storeNumber)) next.delete(storeNumber);
      else next.add(storeNumber);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedStoreNumbers(
      new Set(stores.map((store) => store.storeNumber)),
    );
  };

  const deselectAll = () => {
    setSelectedStoreNumbers(new Set());
  };

  const invertSelection = () => {
    setSelectedStoreNumbers(
      new Set(
        stores
          .filter((store) => !selectedStoreNumbers.has(store.storeNumber))
          .map((store) => store.storeNumber),
      ),
    );
  };

  const copyFromCampaign = (campaignId: string) => {
    const source = campaigns.find((item) => item.id === campaignId);
    if (!source) return;
    setSelectedStoreNumbers(
      new Set(getCampaignStoreNumbers(source, stores)),
    );
  };

  return (
    <main className="campaign-editor" aria-labelledby="campaign-editor-title">
      <form onSubmit={submitCampaign}>
        <div className="campaign-editor-topbar">
          <button type="button" onClick={onCancel}>
            <ArrowLeft size={17} />
            Back
          </button>
        </div>

        <header className="campaign-editor-heading">
          <p className="eyebrow">
            {campaign ? "Edit activation" : "New activation"}
          </p>
          <h1 id="campaign-editor-title">
            {campaign ? "Edit campaign" : "Add campaign"}
          </h1>
          <p>
            Set the campaign details and choose the stores that participate in
            this activation.
          </p>
        </header>

        <section
          className="campaign-editor-details"
          aria-label="Campaign details"
        >
          <label>
            <span>Title</span>
            <input
              name="campaign-name"
              required
              maxLength={80}
              placeholder="e.g. Back-to-School Launch"
              defaultValue={campaign?.name ?? ""}
              autoFocus
            />
          </label>
          <label>
            <span>Start date</span>
            <input
              name="campaign-start-date"
              type="date"
              required
              defaultValue={campaign?.startDate ?? today}
            />
          </label>
        </section>

        <section
          className="campaign-editor-stores"
          aria-label="Choose participating stores"
        >
          <div className="campaign-editor-store-heading">
            <div>
              <p className="eyebrow">Campaign coverage</p>
              <h2>Participating stores</h2>
            </div>
            <div className="campaign-editor-count" aria-live="polite">
              <strong>{selectionLabel(selectedStoreNumbers.size)}</strong>
              <span>of {stores.length}</span>
            </div>
          </div>

          <div className="campaign-editor-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={storeQuery}
              onChange={(event) => setStoreQuery(event.target.value)}
              placeholder="Filter by store, ZIP, mall, address, city…"
              aria-label="Filter participating stores"
            />
            {storeQuery && (
              <button
                type="button"
                onClick={() => setStoreQuery("")}
                aria-label="Clear store filter"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="campaign-editor-tools">
            <button type="button" onClick={selectAll}>
              <Check size={15} />
              Select all
            </button>
            <button type="button" onClick={deselectAll}>
              <X size={15} />
              Deselect all
            </button>
            <button type="button" onClick={invertSelection}>
              <Shuffle size={15} />
              Invert selection
            </button>
            <label>
              <Copy size={15} />
              <span className="sr-only">Copy store selection from</span>
              <select
                value=""
                onChange={(event) => copyFromCampaign(event.target.value)}
                disabled={!otherCampaigns.length}
                aria-label="Copy store selection from another campaign"
              >
                <option value="">
                  {otherCampaigns.length
                    ? "Copy from…"
                    : "No campaigns to copy"}
                </option>
                {otherCampaigns.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="campaign-editor-summary">
            <span>
              {visibleStores.length}{" "}
              {visibleStores.length === 1 ? "store" : "stores"} shown
            </span>
            {storeQuery && <span>Partial matches only</span>}
          </div>

          <div className="campaign-editor-store-list">
            {visibleStores.map((store) => (
              <label key={store.storeNumber}>
                <input
                  type="checkbox"
                  checked={selectedStoreNumbers.has(store.storeNumber)}
                  onChange={() => toggleStore(store.storeNumber)}
                />
                <span className="selector-store-number">
                  #{store.store}
                </span>
                <span>
                  <strong>{store.mallName}</strong>
                  <small>
                    {store.address} · {store.city}, {store.state} {store.zip}
                  </small>
                </span>
              </label>
            ))}
            {!visibleStores.length && (
              <div className="campaign-editor-empty">
                No stores match that partial search.
              </div>
            )}
          </div>
        </section>

        <div className="campaign-editor-actions">
          <span>{selectionLabel(selectedStoreNumbers.size)}</span>
          <div>
            <button className="secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="primary" type="submit">
              {campaign ? "Save campaign" : "Add campaign"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
