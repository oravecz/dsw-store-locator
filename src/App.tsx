import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardCopy,
  Clock3,
  ExternalLink,
  FilterX,
  Flag,
  ListFilter,
  LocateFixed,
  MapPin,
  Pencil,
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
  type PointerEvent,
  type TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import storesData from "./data/stores.json";
import {
  dateInputValue,
  groupCampaigns,
  loadCampaigns,
  saveCampaigns,
  selectInitialCampaign,
} from "./lib/campaigns";
import { isCampaignDrawerPull } from "./lib/campaign-drawer";
import { nearestStores } from "./lib/distance";
import {
  buildIssueExport,
  canonicalAttentionValue,
  filterStoresByAttention,
  getAttentionOptions,
  normalizeAttention,
  type AttentionOption,
} from "./lib/issue-tools";
import { loadIssues, saveIssues } from "./lib/issues";
import { searchStores } from "./lib/search";
import {
  isEdgeBackSwipe,
  openStoreNavigation,
  popStoreNavigation,
  pushStoreNavigation,
  type SwipePoint,
} from "./lib/store-navigation";
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
const storesByNumber = new Map(
  stores.map((store) => [store.storeNumber, store]),
);

function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-lockup ${className}`.trim()}>
      <img
        src={`${import.meta.env.BASE_URL}dsw-logo.png`}
        alt="DSW"
        width="142"
        height="47"
      />
      <span>Activations</span>
    </span>
  );
}

function CampaignOptionGroups({
  groups,
}: {
  groups: ReturnType<typeof groupCampaigns>;
}) {
  return (
    <>
      {groups.currentAndUpcoming.length > 0 && (
        <optgroup label="Current & upcoming">
          {groups.currentAndUpcoming.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </optgroup>
      )}
      {groups.archived.length > 0 && (
        <optgroup label="Archived">
          {groups.archived.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

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
  const [today] = useState(dateInputValue);
  const [initialCampaigns] = useState(loadCampaigns);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [campaignId, setCampaignId] = useState(() =>
    selectInitialCampaign(initialCampaigns, today),
  );
  const [query, setQuery] = useState("");
  const [storeHistory, setStoreHistory] = useState<string[]>([]);
  const [issues, setIssues] = useState<CampaignIssue[]>(loadIssues);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [attentionFilterOpen, setAttentionFilterOpen] = useState(false);
  const [selectedAttentionKeys, setSelectedAttentionKeys] = useState<string[]>(
    [],
  );
  const [exportStatus, setExportStatus] = useState("");
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [campaignDeleteOpen, setCampaignDeleteOpen] = useState(false);
  const [campaignPickerRevealed, setCampaignPickerRevealed] = useState(false);
  const detailPanelRef = useRef<HTMLElement>(null);
  const swipeStartRef = useRef<SwipePoint | null>(null);
  const campaignPullStartRef = useRef<SwipePoint | null>(null);

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
    saveCampaigns(campaigns);
  }, [campaigns]);

  useEffect(() => {
    if (!campaignFormOpen && !campaignDeleteOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [campaignDeleteOpen, campaignFormOpen]);

  useEffect(() => {
    setStoreHistory([]);
    setSelectedAttentionKeys([]);
    setAttentionFilterOpen(false);
    setEditingIssueId(null);
    setFormOpen(false);
    setCampaignDeleteOpen(false);
    setCampaignPickerRevealed(false);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignPickerRevealed) return;
    const hideOnScroll = () => {
      if (window.scrollY > 4) setCampaignPickerRevealed(false);
    };
    window.addEventListener("scroll", hideOnScroll, { passive: true });
    return () => window.removeEventListener("scroll", hideOnScroll);
  }, [campaignPickerRevealed]);

  const campaign = campaigns.find((item) => item.id === campaignId) ?? null;
  const selectedStoreNumber = storeHistory.at(-1);
  const selectedStore = selectedStoreNumber
    ? storesByNumber.get(selectedStoreNumber) ?? null
    : null;
  const previousStore =
    storeHistory.length > 1
      ? storesByNumber.get(storeHistory.at(-2) ?? "") ?? null
      : null;
  const campaignGroups = useMemo(
    () => groupCampaigns(campaigns, today),
    [campaigns, today],
  );
  const searchResults = useMemo(
    () => searchStores(stores, query, stores.length),
    [query],
  );
  const campaignIssues = useMemo(
    () => issues.filter((issue) => issue.campaignId === campaignId),
    [campaignId, issues],
  );
  const attentionSuggestions = useMemo(
    () => getAttentionOptions(issues),
    [issues],
  );
  const campaignAttentionOptions = useMemo(
    () => getAttentionOptions(campaignIssues),
    [campaignIssues],
  );
  const results = useMemo(
    () =>
      filterStoresByAttention(
        searchResults,
        campaignIssues,
        selectedAttentionKeys,
      ),
    [campaignIssues, searchResults, selectedAttentionKeys],
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
  const editingIssue =
    issues.find((issue) => issue.id === editingIssueId) ?? null;

  const scrollStoreViewTop = () => {
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const openStore = (store: Store) => {
    setStoreHistory(openStoreNavigation(store.storeNumber));
    setFormOpen(false);
    setEditingIssueId(null);
    scrollStoreViewTop();
  };

  const pushStore = (store: Store) => {
    setStoreHistory((current) =>
      pushStoreNavigation(current, store.storeNumber),
    );
    setFormOpen(false);
    setEditingIssueId(null);
    scrollStoreViewTop();
  };

  const navigateBack = () => {
    setStoreHistory(popStoreNavigation);
    setFormOpen(false);
    setEditingIssueId(null);
    scrollStoreViewTop();
  };

  const handleDetailTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    swipeStartRef.current = touch
      ? { x: touch.clientX, y: touch.clientY }
      : null;
  };

  const handleDetailTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = swipeStartRef.current;
    const touch = event.changedTouches[0];
    swipeStartRef.current = null;
    if (
      start &&
      touch &&
      isEdgeBackSwipe(start, { x: touch.clientX, y: touch.clientY })
    ) {
      navigateBack();
    }
  };

  const openIssueForm = (issue?: CampaignIssue) => {
    setEditingIssueId(issue?.id ?? null);
    setFormOpen(true);
  };

  const closeIssueForm = () => {
    setEditingIssueId(null);
    setFormOpen(false);
  };

  const saveIssue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStore || !campaign) return;

    const data = new FormData(event.currentTarget);
    const summary = canonicalAttentionValue(
      String(data.get("summary") ?? ""),
      attentionSuggestions,
    );
    const notes = String(data.get("notes") ?? "").trim();
    const priority = String(data.get("priority") ?? "Medium") as IssuePriority;
    if (!summary) return;

    setIssues((current) => {
      if (editingIssueId) {
        return current.map((issue) =>
          issue.id === editingIssueId
            ? { ...issue, summary, notes, priority }
            : issue,
        );
      }

      return [
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
      ];
    });
    event.currentTarget.reset();
    closeIssueForm();
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
    if (editingIssueId === id) closeIssueForm();
  };

  const addCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("campaign-name") ?? "").trim();
    const startDate = String(data.get("campaign-start-date") ?? "");
    if (!name || !startDate) return;

    const newCampaign: Campaign = {
      id: crypto.randomUUID(),
      name,
      startDate,
    };
    setCampaigns((current) => [...current, newCampaign]);
    setCampaignId(newCampaign.id);
    setCampaignPickerRevealed(false);
    setCampaignFormOpen(false);
    event.currentTarget.reset();
  };

  const confirmDeleteCampaign = () => {
    if (!campaign) return;

    const remaining = campaigns.filter((item) => item.id !== campaign.id);
    setCampaigns(remaining);
    setIssues((current) =>
      current.filter((issue) => issue.campaignId !== campaign.id),
    );
    setCampaignDeleteOpen(false);
    setCampaignId(selectInitialCampaign(remaining, today));
  };

  const campaignIssueCount = campaign
    ? issues.filter((issue) => issue.campaignId === campaign.id).length
    : 0;

  const toggleAttentionFilter = (key: string) => {
    setSelectedAttentionKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const exportFilteredStores = async () => {
    const selected = new Set(selectedAttentionKeys);
    const exportIssues = campaignIssues.filter(
      (issue) =>
        selected.size === 0 || selected.has(normalizeAttention(issue.summary)),
    );

    try {
      await navigator.clipboard.writeText(
        buildIssueExport(results, exportIssues),
      );
      setExportStatus(`Copied ${results.length}`);
    } catch {
      setExportStatus("Copy failed");
    }

    window.setTimeout(() => setExportStatus(""), 2400);
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleCampaignPullStart = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !campaign ||
      campaignPickerRevealed ||
      campaignFormOpen ||
      campaignDeleteOpen ||
      window.scrollY > 1
    ) {
      campaignPullStartRef.current = null;
      return;
    }
    campaignPullStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleCampaignPullEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = campaignPullStartRef.current;
    campaignPullStartRef.current = null;
    if (
      start &&
      isCampaignDrawerPull(
        start,
        { x: event.clientX, y: event.clientY },
        window.scrollY,
      )
    ) {
      setCampaignPickerRevealed(true);
    }
  };

  return (
    <div
      className="app-shell"
      onPointerDown={handleCampaignPullStart}
      onPointerUp={handleCampaignPullEnd}
      onPointerCancel={() => {
        campaignPullStartRef.current = null;
      }}
    >
      <header className="app-header">
        <a className="brand" href="#top" aria-label="DSW Activations">
          <BrandLockup className="header-lockup" />
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

      <section
        className={`campaign-strip ${
          campaign ? "campaign-strip-collapsible" : ""
        } ${campaignPickerRevealed ? "revealed" : ""}`}
        id="top"
        onFocusCapture={() => {
          if (campaign) setCampaignPickerRevealed(true);
        }}
      >
        <label htmlFor="campaign">Active campaign</label>
        <div className="campaign-picker">
          <div className="select-wrap">
            <Flag size={18} aria-hidden="true" />
            <select
              id="campaign"
              value={campaignId}
              onChange={(event) => {
                setCampaignId(event.target.value);
                setCampaignPickerRevealed(false);
              }}
            >
              <option value="">Choose a campaign</option>
              <CampaignOptionGroups groups={campaignGroups} />
            </select>
            <ChevronRight size={18} aria-hidden="true" />
          </div>
          <button
            className="add-campaign-button"
            type="button"
            onClick={() => {
              setCampaignPickerRevealed(false);
              setCampaignFormOpen((current) => !current);
            }}
            aria-label="Add campaign"
            aria-expanded={campaignFormOpen}
            aria-controls="campaign-form"
          >
            <Plus size={19} />
          </button>
        </div>
        {campaign && (
          <div className="campaign-stats">
            <span>{stores.length} stores</span>
            <span>{campaignIssues.filter((issue) => issue.status === "Open").length} open issues</span>
          </div>
        )}
      </section>

      {campaignFormOpen && (
        <div className="campaign-form-backdrop">
          <section
            className="campaign-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-form-title"
          >
            <form id="campaign-form" onSubmit={addCampaign}>
              <div className="campaign-form-heading">
                <div>
                  <p className="eyebrow">New activation</p>
                  <h2 id="campaign-form-title">Add campaign</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCampaignFormOpen(false)}
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
                  autoFocus
                />
              </label>
              <label>
                <span>Start date</span>
                <input
                  name="campaign-start-date"
                  type="date"
                  required
                  defaultValue={today}
                />
              </label>
              <div className="campaign-form-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setCampaignFormOpen(false)}
                >
                  Cancel
                </button>
                <button className="primary" type="submit">
                  Add campaign
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {!campaign ? (
        <main className="welcome">
          <BrandLockup className="welcome-lockup" />
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
              <CampaignOptionGroups groups={campaignGroups} />
            </select>
          </label>
        </main>
      ) : (
        <>
          <section className="campaign-heading">
            <h1>{campaign.name}</h1>
            <div className="campaign-subtitle">
              <span>
                <CalendarDays size={16} />
                Starts {formatDate(campaign.startDate)}
              </span>
              <button
                type="button"
                onClick={() => setCampaignDeleteOpen(true)}
              >
                <Trash2 size={15} />
                Delete campaign
              </button>
            </div>
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
                <div className="directory-tools">
                  <button
                    className={`attention-filter-button ${
                      selectedAttentionKeys.length ? "active" : ""
                    }`}
                    type="button"
                    onClick={() =>
                      setAttentionFilterOpen((current) => !current)
                    }
                    disabled={!campaignAttentionOptions.length}
                    aria-expanded={attentionFilterOpen}
                    aria-controls="attention-filter-panel"
                  >
                    <ListFilter size={17} />
                    <span>Attention</span>
                    {selectedAttentionKeys.length > 0 && (
                      <strong>{selectedAttentionKeys.length}</strong>
                    )}
                  </button>
                  {selectedAttentionKeys.length > 0 && (
                    <button
                      className="clear-filter-button"
                      type="button"
                      onClick={() => setSelectedAttentionKeys([])}
                      aria-label="Clear attention filters"
                      title="Clear filters"
                    >
                      <FilterX size={17} />
                    </button>
                  )}
                  <button
                    className="export-button"
                    type="button"
                    onClick={exportFilteredStores}
                    disabled={!results.length}
                    aria-label="Copy filtered stores and issues to clipboard"
                    title="Copy filtered stores and issues"
                  >
                    <ClipboardCopy size={17} />
                    <span>{exportStatus || "Export"}</span>
                  </button>
                </div>
                {attentionFilterOpen && (
                  <div
                    className="attention-filter-panel"
                    id="attention-filter-panel"
                    aria-label="Filter by what needs attention"
                  >
                    <div>
                      <strong>What needs attention</strong>
                      <small>Matches any selected value</small>
                    </div>
                    <div className="attention-options">
                      {campaignAttentionOptions.map((option) => (
                        <label key={option.key}>
                          <input
                            type="checkbox"
                            checked={selectedAttentionKeys.includes(option.key)}
                            onChange={() => toggleAttentionFilter(option.key)}
                          />
                          <span>{option.label}</span>
                          <small>{option.count}</small>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="result-summary" aria-live="polite">
                  <span>
                    {results.length} {results.length === 1 ? "match" : "matches"}
                  </span>
                  {(query || selectedAttentionKeys.length > 0) && (
                    <span>
                      {selectedAttentionKeys.length > 0
                        ? "Attention filters applied"
                        : "Field-ranked partial matches first"}
                    </span>
                  )}
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
                        onClick={() => openStore(store)}
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

            <section
              className="detail-panel"
              aria-label="Selected store details"
              ref={detailPanelRef}
              onTouchStart={handleDetailTouchStart}
              onTouchEnd={handleDetailTouchEnd}
              onTouchCancel={() => {
                swipeStartRef.current = null;
              }}
            >
              {selectedStore ? (
                <StoreDetails
                  store={selectedStore}
                  stores={stores}
                  issues={campaignIssues}
                  formOpen={formOpen}
                  editingIssue={editingIssue}
                  attentionSuggestions={attentionSuggestions}
                  backLabel={previousStore?.mallName ?? "All stores"}
                  onBack={navigateBack}
                  onSelectStore={pushStore}
                  onOpenForm={openIssueForm}
                  onCloseForm={closeIssueForm}
                  onSaveIssue={saveIssue}
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

      {campaign && campaignDeleteOpen && (
        <div className="confirm-backdrop">
          <section
            className="campaign-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-campaign-title"
            aria-describedby="delete-campaign-description"
          >
            <div className="confirm-icon">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-campaign-title">Delete {campaign.name}?</h2>
            <p id="delete-campaign-description">
              This cannot be undone.
              {campaignIssueCount > 0 &&
                ` ${campaignIssueCount} campaign log ${
                  campaignIssueCount === 1 ? "entry" : "entries"
                } will also be deleted.`}
            </p>
            <div className="confirm-actions">
              <button
                className="secondary"
                type="button"
                onClick={() => setCampaignDeleteOpen(false)}
                autoFocus
              >
                Cancel
              </button>
              <button
                className="danger"
                type="button"
                onClick={confirmDeleteCampaign}
              >
                Delete campaign
              </button>
            </div>
          </section>
        </div>
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
  backLabel: string;
  formOpen: boolean;
  editingIssue: CampaignIssue | null;
  attentionSuggestions: AttentionOption[];
  onBack: () => void;
  onSelectStore: (store: Store) => void;
  onOpenForm: (issue?: CampaignIssue) => void;
  onCloseForm: () => void;
  onSaveIssue: (event: FormEvent<HTMLFormElement>) => void;
  onToggleIssue: (id: string) => void;
  onDeleteIssue: (id: string) => void;
}

function StoreDetails({
  store,
  stores,
  issues,
  backLabel,
  formOpen,
  editingIssue,
  attentionSuggestions,
  onBack,
  onSelectStore,
  onOpenForm,
  onCloseForm,
  onSaveIssue,
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
      <button
        className="detail-back"
        type="button"
        onClick={onBack}
        aria-label={`Back to ${
          backLabel === "All stores" ? "all stores" : backLabel
        }`}
      >
        <ArrowLeft size={18} />
        <span>{backLabel}</span>
      </button>

      <section className="issues-section campaign-log">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Campaign log</p>
            <h3>Store issues</h3>
          </div>
          {!formOpen && (
            <button type="button" onClick={() => onOpenForm()}>
              <Plus size={17} />
              Add issue
            </button>
          )}
        </div>

        {formOpen && (
          <form
            className="issue-form"
            key={editingIssue?.id ?? "new"}
            onSubmit={onSaveIssue}
          >
            <div className="form-heading">
              <strong>{editingIssue ? "Edit issue" : "New issue"}</strong>
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
                list="attention-suggestions"
                defaultValue={editingIssue?.summary ?? ""}
                placeholder="e.g. Window decal is peeling"
              />
              <datalist id="attention-suggestions">
                {attentionSuggestions.map((option) => (
                  <option value={option.label} key={option.key} />
                ))}
              </datalist>
            </label>
            <label>
              <span>Notes <small>(optional)</small></span>
              <textarea
                name="notes"
                rows={3}
                maxLength={500}
                defaultValue={editingIssue?.notes ?? ""}
                placeholder="Add context, location, or next step"
              />
            </label>
            <label>
              <span>Priority</span>
              <select
                name="priority"
                defaultValue={editingIssue?.priority ?? "Medium"}
              >
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
                {editingIssue ? "Update issue" : "Save issue"}
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
                <div className="issue-actions">
                  <button
                    className="edit-issue"
                    type="button"
                    onClick={() => onOpenForm(issue)}
                    aria-label={`Edit ${issue.summary}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="delete-issue"
                    type="button"
                    onClick={() => onDeleteIssue(issue.id)}
                    aria-label={`Delete ${issue.summary}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            !formOpen && (
              <button
                className="no-issues"
                type="button"
                onClick={() => onOpenForm()}
              >
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

      <section className="store-information">
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
              <small className="fact-secondary-label">Store · Region</small>
              <span>
                #{store.storeNumber} · {store.region.replaceAll("_", " ")}
              </span>
            </div>
          </div>
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
