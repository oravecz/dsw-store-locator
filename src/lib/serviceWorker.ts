export const serviceWorkerUpdateIntervalMs = 15 * 60 * 1000;

interface ServiceWorkerUpdateOptions {
  serviceWorker?: ServiceWorkerContainer;
  baseUrl?: string;
  reload?: () => void;
  addFocusListener?: (listener: () => void) => void;
  addVisibilityListener?: (listener: () => void) => void;
  schedule?: (listener: () => void, interval: number) => unknown;
  isVisible?: () => boolean;
  isOnline?: () => boolean;
}

export async function registerServiceWorkerUpdates({
  serviceWorker = navigator.serviceWorker,
  baseUrl = import.meta.env.BASE_URL,
  reload = () => window.location.reload(),
  addFocusListener = (listener) => window.addEventListener("focus", listener),
  addVisibilityListener = (listener) =>
    document.addEventListener("visibilitychange", listener),
  schedule = (listener, interval) => window.setInterval(listener, interval),
  isVisible = () => document.visibilityState === "visible",
  isOnline = () => navigator.onLine,
}: ServiceWorkerUpdateOptions = {}) {
  let hasController = Boolean(serviceWorker.controller);
  let isReloading = false;

  serviceWorker.addEventListener("controllerchange", () => {
    if (!hasController) {
      hasController = true;
      return;
    }
    if (isReloading) return;
    isReloading = true;
    reload();
  });

  const registration = await serviceWorker.register(`${baseUrl}sw.js`, {
    scope: baseUrl,
    updateViaCache: "none",
  });

  const checkForUpdate = () => {
    if (!isOnline()) return;
    void registration.update().catch(() => undefined);
  };

  checkForUpdate();
  addFocusListener(checkForUpdate);
  addVisibilityListener(() => {
    if (isVisible()) checkForUpdate();
  });
  schedule(checkForUpdate, serviceWorkerUpdateIntervalMs);
}
