const CACHE_VERSION = 2;
const CACHE = `wedding-v${CACHE_VERSION}`;
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

  // Never cache API calls or subscription endpoints
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) return;

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
  let data = { title: "Edwin & Yeimy", body: "(push recibido sin payload legible)" };
  if (e.data) {
    try { data = e.data.json(); }
    catch {
      try { data = { title: "Edwin & Yeimy", body: e.data.text() }; }
      catch { /* keep default */ }
    }
  }

  e.waitUntil(
    self.registration.showNotification(data.title ?? "Edwin & Yeimy", {
      body: data.body ?? "(sin cuerpo)",
      icon: data.icon ?? "/icons/icon-192.png",
      badge: data.badge ?? "/icons/icon-96.png",
      tag: `wedding-${Date.now()}`,
      data: { url: data.url ?? "/" },
      vibrate: [200, 100, 200],
      // Android-specific: ensure notification is shown even in background
      requireInteraction: false,
      renotify: true,
    })
  );
});

// Store the subscriber name so pushsubscriptionchange can refresh without a page open
let _subscriberName = null;
self.addEventListener("message", (e) => {
  if (e.data?.type === "STORE_NAME") _subscriberName = e.data.name;
});

// Handle subscription change (token rotation) — re-subscribe and update server
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: e.oldSubscription?.options?.applicationServerKey,
    }).then((newSub) => {
      const name = _subscriberName;
      if (!name) {
        console.warn("[sw] pushsubscriptionchange: no stored name, cannot update server");
        return;
      }
      console.log("[sw] pushsubscriptionchange: refreshing subscription for", name);
      return fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: newSub.toJSON(), name }),
      });
    }).catch((err) => {
      console.error("[sw] pushsubscriptionchange failed:", err);
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
