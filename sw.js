// Service worker for AK SUPER CLASSES PWA.
// Strategy:
//   - Precache the core app shell on install.
//   - Network-first for same-origin GET requests (so users always get fresh
//     content when online), falling back to cache when offline.
//   - Never intercept cross-origin requests (Firebase, CDNs) or non-GET
//     requests — they pass straight through to the network.

const CACHE = "aksc-cache-v1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./academics.html",
  "./contact.html",
  "./course.html",
  "./demo.html",
  "./login.html",
  "./register.html",
  "./dashboard.html",
  "./admin-dashboard.html",
  "./styles.css",
  "./script.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GET requests. Everything else (Firebase, CDNs,
  // POST/PUT, etc.) goes straight to the network untouched.
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache a copy of successful responses for offline fallback.
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
