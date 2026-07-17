// Minimal service worker — exists mainly so the browser considers the
// site installable as a PWA. Deliberately conservative:
//
// - Only caches truly static, immutable assets (icons, the Stockfish
//   engine files). Both already ship with long-lived Cache-Control
//   headers from next.config.ts, so this just adds an offline fallback.
// - Never caches HTML documents, API routes, or anything else — those
//   must always hit the network. Caching pages here previously caused a
//   painful bug where a security-header fix wasn't visible on repeat
//   visits; this worker is written to never repeat that.

const CACHE_NAME = "chessdeeper-static-v1";
const CACHEABLE_PATH_PREFIXES = ["/icons/", "/engine/"];

function isCacheable(url) {
  return CACHEABLE_PATH_PREFIXES.some((p) => url.pathname.startsWith(p));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return; // let the browser handle it normally
  }
  if (!isCacheable(url)) {
    return; // documents, API routes, everything else: always network
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }),
  );
});
