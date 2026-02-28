// sw.js
// ============================================
// オフライン用 Service Worker（都度更新型）
// - 反映されない時は CACHE_NAME を +1
// ============================================

const CACHE_NAME = "araji-v8"; // ←更新したらここを増やす
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./engine.js",
  "./machine_config.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => {
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached || caches.match("./index.html"));
    })
  );
});