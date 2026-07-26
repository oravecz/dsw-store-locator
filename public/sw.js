const basePath = "/dsw-store-locator/";
const release = "__BUILD_VERSION__";
const cacheName = `dsw-activations-${release}`;
const appShell = [
  basePath,
  `${basePath}assets/app.js`,
  `${basePath}assets/index.css`,
  `${basePath}apple-touch-icon.png`,
  `${basePath}icon-192.png`,
  `${basePath}icon-512.png`,
  `${basePath}icon-maskable-512.png`,
  `${basePath}manifest.webmanifest`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .open(cacheName)
        .then((cache) =>
          cache.addAll(
            appShell.map((url) => new Request(url, { cache: "reload" })),
          ),
        ),
      self.skipWaiting(),
    ]),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== cacheName)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(cacheName).then((cache) => cache.put(basePath, copy));
          return response;
        })
        .catch(() => caches.match(basePath)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(cacheName).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
