// ルーティンタイマー Service Worker
// 方針：ネットワーク優先（更新を取りこぼさない）。
//   - オンライン時は常に最新を取得し、キャッシュも更新
//   - オフライン時だけキャッシュから返す（オフライン起動を担保）
//   - YouTube等の外部リソースはキャッシュせず素通し

const CACHE = "routine-timer-v2";
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
  self.skipWaiting();   // 新しいSWをすぐ有効化
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())   // 既存タブもすぐ新SWの管理下へ
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // 自分のオリジンのGETだけを扱う。YouTube等の外部は素通し。
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // ネットワーク優先：取れたらキャッシュを更新して返す。失敗時のみキャッシュ。
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
  );
});
