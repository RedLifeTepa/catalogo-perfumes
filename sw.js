const CACHE="auraerp-v1.5.3";
const CORE=["./","./index.html","./confi.html","./css/app.css","./css/catalogo.css","./manifest.json"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener("activate",e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.hostname.includes("googleapis.com")||u.hostname.includes("firebase")||u.hostname.includes("gstatic.com"))return;
 if(e.request.mode==="navigate"){
  e.respondWith(fetch(e.request).then(r=>{let x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{if(r.ok){let x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x))}return r})));
});