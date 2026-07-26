import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  Flag,
  LocateFixed,
  MapPin,
  Phone,
  Plus,
  Search,
  Signal,
  SignalZero,
  Smartphone,
  Store as StoreIcon,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import storesData from "./data/stores.json";
import { nearestStores } from "./lib/distance";
import { loadIssues, saveIssues } from "./lib/issues";
import { searchStores } from "./lib/search";
import type {
  Campaign,
  CampaignIssue,
  IssuePriority,
  Store,
} from "./types";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const stores = storesData as Store[];

const campaigns: Campaign[] = [
  {
    id: "35th-birthday",
    name: "35th Birthday",
    kicker: "Celebrate every step",
  },
];

const priorityOrder: Record<IssuePriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

const fullAddress = (store: Store) =>
  `${store.address}, ${store.city}, ${store.state} ${store.zip}`;

const formatDistance = (miles: number) => {
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));

function App() {
  const [campaignId, setCampaignId] = useState(
    () => window.localStorage.getItem("dsw:selected-campaign") ?? "",
  );
  const [query, setQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [issues, setIssues] = useState<CampaignIssue[]>(loadIssues);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  useEffect(() => {
    saveIssues(issues);
  }, [issues]);

  useEffect(() => {
    if (campaignId) {
      window.localStorage.setItem("dsw:selected-campaign", campaignId);
    } else {
      window.localStorage.removeItem("dsw:selected-campaign");
      setSelectedStore(null);
    }
  }, [campaignId]);

  const campaign = campaigns.find((item) => item.id === campaignId) ?? null;
  const results = useMemo(
    () => searchStores(stores, query, stores.length),
    [query],
  );
  const campaignIssues = useMemo(
    () => issues.filter((issue) => issue.campaignId === campaignId),
    [campaignId, issues],
  );
  const issueCounts = useMemo(
    () =>
      campaignIssues.reduce<Record<string, number>>((counts, issue) => {
        if (issue.status === "Open") {
          counts[issue.storeNumber] = (counts[issue.storeNumber] ?? 0) + 1;
        }
        return counts;
      }, {}),
    [campaignIssues],
  );

  const selectStore = (store: Store) => {
    setSelectedStore(store);
    setFormOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addIssue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStore || !campaign) return;

    const data = new FormData(event.currentTarget);
    const summary = String(data.get("summary") ?? "").trim();
    const notes = String(data.get("notes") ?? "").trim();
    const priority = String(data.get("priority") ?? "Medium") as IssuePriority;
    if (!summary) return;

    setIssues((current) => [
      {
        id: crypto.randomUUID(),
        campaignId: campaign.id,
        storeNumber: selectedStore.storeNumber,
        summary,
        notes,
        priority,
        status: "Open",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    event.currentTarget.reset();
    setFormOpen(false);
  };

  const toggleIssue = (id: string) => {
    setIssues((current) =>
      current.map((issue) =>
        issue.id === id
          ? {
              ...issue,
              status: issue.status === "Open" ? "Resolved" : "Open",
            }
          : issue,
      ),
    );
  };

  const deleteIssue = (id: string) => {
    setIssues((current) => current.filter((issue) => issue.id !== id));
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#top" aria-label="DSW Activations">
          <span className="brand-mark">DSW</span>
          <span className="brand-copy">
            <strong>Field Guide</strong>
            <small>Campaign operations</small>
          </span>
        </a>

        <div className="header-actions">
          <span
            className={`network-status ${isOnline ? "online" : "offline"}`}
            aria-live="polite"
          >
            {isOnline ? <Signal size={14} /> : <SignalZero size={14} />}
            {isOnline ? "Online" : "Offline"}
          </span>
          {installPrompt && (
            <button className="install-button" type="button" onClick={installApp}>
              <Smartphone size={16} />
              Install
            </button>
          )}
        </div>
      </header>

      <section className="campaign-strip" id="top">
        <label htmlFor="campaign">Active campaign</label>
        <div className="select-wrap">
          <Flag size={18} aria-hidden="true" />
          <select
            id="campaign"
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
          >
            <option value="">Choose a campaign</option>
            {campaigns.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronRight size={18} aria-hidden="true" />
        </div>
        {campaign && (
          <div className="campaign-stats">
            <span>{stores.length} stores</span>
            <span>{campaignIssues.filter((issue) => issue.status === "Open").length} open issues</span>
          </div>
        )}
      </section>

      {!campaign ? (
        <main className="welcome">
          <div className="birthday-orbit" aria-hidden="true">
            <span>35</span>
          </div>
          <p className="eyebrow">Ready for the floor</p>
          <h1>Pick a campaign to get started.</h1>
          <p>
            Search all 493 stores, open directions, find nearby locations, and
            keep field issues organized—even when service drops.
          </p>
          <label className="welcome-select" htmlFor="welcome-campaign">
            <span>Campaign</span>
            <select
              id="welcome-campaign"
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
            >
              <option value="">Select campaign</option>
              {campaigns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </main>
      ) : (
        <>
          <section className="campaign-hero">
            <div>
              <p className="eyebrow">{campaign.kicker}</p>
              <h1>
                <span>35</span>
                <small>th</small> Birthday
              </h1>
            </div>
            <p>
              Find a store, capture what needs attention, and keep the
              celebration moving.
            </p>
          </section>

          <main className={`workspace ${selectedStore ? "has-selection" : ""}`}>
            <section className="directory-panel" aria-label="Store directory">
              <div className="search-area">
                <label htmlFor="store-search">Find a store</label>
                <div className="search-box">
                  <Search size={20} aria-hidden="true" />
                  <input
                    id="store-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Store #, mall, city, ZIP, district…"
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear store search"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div className="result-summary" aria-live="polite">
                  <span>
                    {results.length} {results.length === 1 ? "match" : "matches"}
                  </span>
                  {query && <span>Partial matches shown first</span>}
                </div>
              </div>

              <div className="store-list">
                {results.length ? (
                  results.map((store) => {
                    const openIssues = issueCounts[store.storeNumber] ?? 0;
                    return (
                      <button
                        className={`store-row ${
                          selectedStore?.storeNumber === store.storeNumber
                            ? "selected"
                            : ""
                        }`}
                        key={store.storeNumber}
                        type="button"
                        onClick={() => selectStore(store)}
                      >
                        <span className="store-number">#{store.storeNumber}</span>
                        <span className="store-row-copy">
                          <strong>{store.mallName}</strong>
                          <small>
                            {store.city}, {store.state} · {store.district}
                          </small>
                        </span>
                        {openIssues > 0 && (
                          <span className="issue-count">
                            {openIssues}
                            <span className="sr-only"> open issues</span>
                          </span>
                        )}
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                    );
                  })
                ) : (
                  <div className="empty-results">
                    <Search size={28} />
                    <strong>No stores found</strong>
                    <p>Try a shorter term or check the spelling.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="detail-panel" aria-label="Selected store details">
              {selectedStore ? (
                <StoreDetails
                  store={selectedStore}
                  stores={stores}
                  issues={campaignIssues}
                  formOpen={formOpen}
                  onBack={() => setSelectedStore(null)}
                  onSelectStore={selectStore}
                  onOpenForm={() => setFormOpen(true)}
                  onCloseForm={() => setFormOpen(false)}
                  onAddIssue={addIssue}
                  onToggleIssue={toggleIssue}
                  onDeleteIssue={deleteIssue}
                />
              ) : (
                <div className="detail-placeholder">
                  <div>
                    <LocateFixed size={34} />
                  </div>
                  <h2>Select a store</h2>
                  <p>
                    Store details, directions, nearby locations, and campaign
                    issues will appear here.
                  </p>
                </div>
              )}
            </section>
          </main>
        </>
      )}

      <footer>
        <span>Issue data stays on this device.</span>
        <span>Store directory dated May 27, 2026.</span>
      </footer>
    </div>
  );
}

interface StoreDetailsProps {
  store: Store;
  stores: Store[];
  issues: CampaignIssue[];
  formOpen: boolean;
  onBack: () => void;
  onSelectStore: (store: Store) => void;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onAddIssue: (event: FormEvent<HTMLFormElement>) => void;
  onToggleIssue: (id: string) => void;
  onDeleteIssue: (id: string) => void;
}

function StoreDetails({
  store,
  stores,
  issues,
  formOpen,
  onBack,
  onSelectStore,
  onOpenForm,
  onCloseForm,
  onAddIssue,
  onToggleIssue,
  onDeleteIssue,
}: StoreDetailsProps) {
  const nearby = useMemo(() => nearestStores(store, stores), [store, stores]);
  const storeIssues = useMemo(
    () =>
      issues
        .filter((issue) => issue.storeNumber === store.storeNumber)
        .sort(
          (left, right) =>
            Number(left.status === "Resolved") -
              Number(right.status === "Resolved") ||
            priorityOrder[left.priority] - priorityOrder[right.priority] ||
            right.createdAt.localeCompare(left.createdAt),
        ),
    [issues, store.storeNumber],
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddress(store),
  )}`;

  return (
    <div className="store-detail">
      <button className="mobile-back" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        All stores
      </button>

      <div className="detail-heading">
        <div className="detail-tags">
          <span>Store #{store.storeNumber}</span>
          <span>{store.region.replaceAll("_", " ")}</span>
        </div>
        <h2>{store.mallName}</h2>
        <p>
          {store.city}, {store.state}
        </p>
      </div>

      <a className="maps-button" href={mapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={19} />
        Open in Google Maps
        <ExternalLink size={16} />
      </a>

      <div className="facts-card">
        <div className="fact">
          <MapPin size={18} />
          <div>
            <small>Address</small>
            <span>{store.address}</span>
            <span>
              {store.city}, {store.state} {store.zip}
            </span>
          </div>
        </div>
        <div className="fact">
          <Phone size={18} />
          <div>
            <small>Phone</small>
            <a href={`tel:${store.phone}`}>{store.phone}</a>
          </div>
        </div>
        <div className="fact">
          <Clock3 size={18} />
          <div>
            <small>Store hours</small>
            <span>{store.storeHours}</span>
          </div>
        </div>
        <div className="fact">
          <StoreIcon size={18} />
          <div>
            <small>District · Opened</small>
            <span>
              {store.district} · {formatDate(store.openDate)}
            </span>
          </div>
        </div>
      </div>

      <section className="issues-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Campaign log</p>
            <h3>Store issues</h3>
          </div>
          {!formOpen && (
            <button type="button" onClick={onOpenForm}>
              <Plus size={17} />
              Add issue
            </button>
          )}
        </div>

        {formOpen && (
          <form className="issue-form" onSubmit={onAddIssue}>
            <div className="form-heading">
              <strong>New issue</strong>
              <button
                type="button"
                onClick={onCloseForm}
                aria-label="Close issue form"
              >
                <X size={18} />
              </button>
            </div>
            <label>
              <span>What needs attention?</span>
              <input
                name="summary"
                required
                maxLength={90}
                placeholder="e.g. Window decal is peeling"
              />
            </label>
            <label>
              <span>Notes <small>(optional)</small></span>
              <textarea
                name="notes"
                rows={3}
                maxLength={500}
                placeholder="Add context, location, or next step"
              />
            </label>
            <label>
              <span>Priority</span>
              <select name="priority" defaultValue="Medium">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={onCloseForm}>
                Cancel
              </button>
              <button type="submit" className="primary">
                Save issue
              </button>
            </div>
          </form>
        )}

        <div className="issue-list">
          {storeIssues.length ? (
            storeIssues.map((issue) => (
              <article
                className={`issue-card ${
                  issue.status === "Resolved" ? "resolved" : ""
                }`}
                key={issue.id}
              >
                <button
                  className="status-toggle"
                  type="button"
                  onClick={() => onToggleIssue(issue.id)}
                  aria-label={
                    issue.status === "Open"
                      ? `Mark ${issue.summary} resolved`
                      : `Reopen ${issue.summary}`
                  }
                >
                  {issue.status === "Resolved" ? (
                    <Check size={16} />
                  ) : (
                    <CircleAlert size={16} />
                  )}
                </button>
                <div className="issue-copy">
                  <div className="issue-meta">
                    <span className={`priority ${issue.priority.toLowerCase()}`}>
                      {issue.priority}
                    </span>
                    <span>{issue.status}</span>
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                  <strong>{issue.summary}</strong>
                  {issue.notes && <p>{issue.notes}</p>}
                </div>
                <button
                  className="delete-issue"
                  type="button"
                  onClick={() => onDeleteIssue(issue.id)}
                  aria-label={`Delete ${issue.summary}`}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))
          ) : (
            !formOpen && (
              <button className="no-issues" type="button" onClick={onOpenForm}>
                <Check size={20} />
                <span>
                  <strong>No issues logged</strong>
                  <small>Tap to add the first one.</small>
                </span>
              </button>
            )
          )}
        </div>
      </section>

      <section className="nearby-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">In the neighborhood</p>
            <h3>Closest stores</h3>
          </div>
          <span className="five-badge">Next 5</span>
        </div>
        <div className="nearby-list">
          {nearby.map(({ store: nearbyStore, distance }) => (
            <button
              key={nearbyStore.storeNumber}
              type="button"
              onClick={() => onSelectStore(nearbyStore)}
            >
              <span className="nearby-distance">{formatDistance(distance)}</span>
              <span>
                <strong>{nearbyStore.mallName}</strong>
                <small>
                  #{nearbyStore.storeNumber} · {nearbyStore.city},{" "}
                  {nearbyStore.state}
                </small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <p className="coordinate-note">
          Distances use Census address coordinates when available and ZIP-area
          centers otherwise.
        </p>
      </section>
    </div>
  );
}

export default App;
