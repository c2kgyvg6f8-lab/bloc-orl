/* Bloc ORL — ouverture sans connexion (v312)
   Page : réseau d'abord (nouvelle version dès qu'Internet répond), copie gardée sinon.
   Polices et bibliothèques externes : copie gardée, mise à jour en arrière-plan.
   Google Drive / Gmail (script.google.com) : jamais mis en cache. */
const CACHE = "bloc-orl-v1";
const PAGES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PAGES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(K => Promise.all(K.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("délai")), ms))]);
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || /script\.google(usercontent)?\.com|googleapis\.com\/(drive|upload)/.test(u.host + u.pathname)) return;
  const local = u.origin === self.location.origin;
  if (local && (r.mode === "navigate" || /\.(html|webmanifest|png)$/.test(u.pathname) || u.pathname.endsWith("/"))){
    if (!/\/(index\.html)?$/.test(u.pathname) && r.mode === "navigate" && !/bloc-orl\/?$/.test(u.pathname)) return;   // autres pages (démo, consentement…) : normales
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try { const res = await timeout(fetch(r, { cache: "no-store" }), 6000); if (res && res.ok){ c.put(r.mode === "navigate" ? "./index.html" : r, res.clone()); } return res; }
      catch (err){ return (await c.match(r.mode === "navigate" ? "./index.html" : r)) || (await c.match("./index.html")) || Response.error(); }
    })());
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.host)){
    e.respondWith((async () => { const c = await caches.open(CACHE), hit = await c.match(r);
      const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || net; })());
  }
});
