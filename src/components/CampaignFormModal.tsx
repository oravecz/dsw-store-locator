import {
  Check,
  Copy,
  Search,
  Shuffle,
  Store as StoreIcon,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  getCampaignStoreNumbers,
  normalizeCampaignStoreNumbers,
} from "../lib/campaigns";
import { searchStores } from "../lib/search";
import type { Campaign, Store } from "../types";

export interface CampaignDraft {
  name: string;
  startDate: string;
  storeNumbers?: string[];
}

interface CampaignFormModalProps {
  campaign: Campaign | null;
  campaigns: Campaign[];
  stores: Store[];
  today: string;
  onClose: () => void;
  onSave: (draft: CampaignDraft) => void;
}

const selectionLabel = (count: number) =>
  `${count} ${count === 1 ? "store" : "stores"} selected`;

export function CampaignFormModal({
  campaign,
  campaigns,
  stores,
  today,
  onClose,
  onSave,
}: CampaignFormModalProps) {
  const [selectedStoreNumbers, setSelectedStoreNumbers] = useState(
    () => new Set(getCampaignStoreNumbers(campaign, stores)),
  );
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [storeQuery, setStoreQuery] = useState("");
  const visibleStores = useMemo(
    () => searchStores(stores, storeQuery, stores.length),
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
    <div className="campaign-form-backdrop">
      <section
        className="campaign-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-form-title"
      >
        <form id="campaign-form" onSubmit={submitCampaign}>
          <div className="campaign-form-heading">
            <div>
              <p className="eyebrow">
                {campaign ? "Edit activation" : "New activation"}
              </p>
              <h2 id="campaign-form-title">
                {campaign ? "Edit campaign" : "Add campaign"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close campaign form"
            >
              <X size={18} />
            </button>
          </div>
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
          <div className="campaign-store-scope">
            <span>Participating stores</span>
            <button
              type="button"
              onClick={() => setStoreSelectorOpen(true)}
              aria-expanded={storeSelectorOpen}
            >
              <StoreIcon size={17} />
              {selectionLabel(selectedStoreNumbers.size)}
            </button>
            <small>New campaigns default to all stores.</small>
          </div>
          <div className="campaign-form-actions">
            <button className="secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" type="submit">
              {campaign ? "Save campaign" : "Add campaign"}
            </button>
          </div>
        </form>

        {storeSelectorOpen && (
          <section
            className="campaign-store-selector"
            aria-label="Choose participating stores"
          >
            <div className="store-selector-heading">
              <div>
                <p className="eyebrow">Campaign coverage</p>
                <h3>Choose stores</h3>
              </div>
              <button
                type="button"
                onClick={() => setStoreSelectorOpen(false)}
                aria-label="Close store selector"
              >
                <X size={19} />
              </button>
            </div>

            <div className="store-selector-count" aria-live="polite">
              <strong>{selectionLabel(selectedStoreNumbers.size)}</strong>
              <span>of {stores.length}</span>
            </div>

            <div className="store-selector-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={storeQuery}
                onChange={(event) => setStoreQuery(event.target.value)}
                placeholder="Filter by store, mall, city, ZIP…"
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

            <div className="store-selector-tools">
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
                Invert
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

            <div className="store-selector-summary">
              <span>
                {visibleStores.length}{" "}
                {visibleStores.length === 1 ? "store" : "stores"} shown
              </span>
              {storeQuery && <span>Fuzzy matches included</span>}
            </div>

            <div className="campaign-store-list">
              {visibleStores.map((store) => (
                <label key={store.storeNumber}>
                  <input
                    type="checkbox"
                    checked={selectedStoreNumbers.has(store.storeNumber)}
                    onChange={() => toggleStore(store.storeNumber)}
                  />
                  <span className="selector-store-number">
                    #{store.storeNumber}
                  </span>
                  <span>
                    <strong>{store.mallName}</strong>
                    <small>
                      {store.city}, {store.state} · {store.zip}
                    </small>
                  </span>
                </label>
              ))}
            </div>

            <div className="store-selector-actions">
              <span>{selectionLabel(selectedStoreNumbers.size)}</span>
              <button
                type="button"
                onClick={() => setStoreSelectorOpen(false)}
              >
                Done
              </button>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
