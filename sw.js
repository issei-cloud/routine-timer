// ルーティンタイマー Service Worker
// アプリ本体をキャッシュし、オフラインでも起動できるようにする。
// YouTube等の外部リソースはキャッシュせず、常にネットワークへ。

const CACHE = "routine-timer-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // 自分のオリジンのGETだけを扱う。YouTube等の外部は素通し。
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // アプリシェルはキャッシュ優先、無ければネットワーク
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
