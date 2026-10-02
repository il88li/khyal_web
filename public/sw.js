const CACHE = "khiyal-v2";
const ASSETS = ["/", "/enhance", "/profile", "/settings", "/offline", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return caches.match("/offline");
        }
        return new Response("offline", { status: 503 });
      })
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = { title: "خيال", body: "إشعار جديد" };
  try {
    data = event.data.json();
  } catch {
    data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "خيال", {
      body: data.body,
      icon: "/icons/icon-192.png",
      dir: "rtl",
      lang: "ar",
    })
  );
});
