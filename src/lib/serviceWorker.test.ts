import { describe, expect, it, vi } from "vitest";
import {
  registerServiceWorkerUpdates,
  serviceWorkerUpdateIntervalMs,
} from "./serviceWorker";

function serviceWorkerMock(hasController: boolean) {
  let controllerChange: () => void = () => undefined;
  const update = vi.fn().mockResolvedValue(undefined);
  const register = vi.fn().mockResolvedValue({ update });
  const serviceWorker = {
    controller: hasController ? {} : null,
    addEventListener: vi.fn(
      (_type: string, listener: () => void) => {
        controllerChange = listener;
      },
    ),
    register,
  } as unknown as ServiceWorkerContainer;

  return {
    serviceWorker,
    register,
    update,
    changeController: () => controllerChange(),
  };
}

describe("service worker updates", () => {
  it("checks on startup, focus, visibility, and the update interval", async () => {
    const worker = serviceWorkerMock(true);
    let onFocus: () => void = () => undefined;
    let onVisibility: () => void = () => undefined;
    let onInterval: () => void = () => undefined;

    await registerServiceWorkerUpdates({
      serviceWorker: worker.serviceWorker,
      baseUrl: "/dsw-store-locator/",
      addFocusListener: (listener) => {
        onFocus = listener;
      },
      addVisibilityListener: (listener) => {
        onVisibility = listener;
      },
      schedule: (listener, interval) => {
        expect(interval).toBe(serviceWorkerUpdateIntervalMs);
        onInterval = listener;
      },
      isVisible: () => true,
      isOnline: () => true,
    });

    expect(worker.register).toHaveBeenCalledWith(
      "/dsw-store-locator/sw.js",
      {
        scope: "/dsw-store-locator/",
        updateViaCache: "none",
      },
    );
    expect(worker.update).toHaveBeenCalledTimes(1);

    onFocus();
    onVisibility();
    onInterval();
    expect(worker.update).toHaveBeenCalledTimes(4);
  });

  it("reloads once when an updated worker takes control", async () => {
    const worker = serviceWorkerMock(true);
    const reload = vi.fn();

    await registerServiceWorkerUpdates({
      serviceWorker: worker.serviceWorker,
      reload,
      addFocusListener: () => undefined,
      addVisibilityListener: () => undefined,
      schedule: () => undefined,
    });

    worker.changeController();
    worker.changeController();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("skips the first-install reload but refreshes for a later update", async () => {
    const worker = serviceWorkerMock(false);
    const reload = vi.fn();

    await registerServiceWorkerUpdates({
      serviceWorker: worker.serviceWorker,
      reload,
      addFocusListener: () => undefined,
      addVisibilityListener: () => undefined,
      schedule: () => undefined,
    });

    worker.changeController();
    expect(reload).not.toHaveBeenCalled();

    worker.changeController();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
