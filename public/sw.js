const CACHE = "wedding-v1";
const STATIC = ["/", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)));
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
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: "Edwin & Yeimy", body: e.data.text() }; }

  e.waitUntil(
    self.registration.showNotification(data.title ?? "Edwin & Yeimy", {
      body: data.body,
      icon: data.icon ?? "/icons/icon-192.png",
      badge: data.badge ?? "/icons/icon-96.png",
      tag: "wedding-countdown",
      renotify: true,
      requireInteraction: true,
      data: { url: data.url ?? "/" },
      vibrate: [200, 100, 200],
    })
  );
});

// Store the subscriber name so pushsubscriptionchange can refresh without a page open
let _subscriberName = null;
self.addEventListener("message", (e) => {
  if (e.data?.type === "STORE_NAME") _subscriberName = e.data.name;
});

self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: e.oldSubscription?.options?.applicationServerKey,
    }).then((newSub) => {
      const name = _subscriberName;
      if (!name) return;
      return fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: newSub.toJSON(), name }),
      });
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url ?? "/";
  const origin = self.location.origin;
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const appWin = wins.find((w) => w.url.startsWith(origin));
      if (appWin) {
        return appWin.focus().then(() => appWin.navigate(target));
      }
      return clients.openWindow(target);
    })
  );
});
