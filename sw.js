const CACHE='surah-compass-v1';
const FILES=['./','./index.html','./styles.css','./system.css','./reader.css','./learning.css','./visual.css','./mushaf.css','./core.js','./store.js','./app.js','./reader.js','./learning.js','./mushaf.js','./content.js','./sync.js','./config.js','./data/surahs.js','./data/quran.js','./data/study.js','./data/editions.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/home-islamic-bg.png','./assets/book-cover-photo.jpg','./assets/rehal-photo.png','./manifest.webmanifest'];
FILES.splice(FILES.indexOf('./assets/book-cover-photo.jpg'),2);
FILES.push('./assets/book-page-edges.svg','./brand.css','./layout.css','./layout.js','./logo-loader.js','./spin-audio.js','./assets/brand-logo.png','./assets/favicon.png');
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('surah-compass-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  // Refresh local assets while online; use the complete installed copy offline.
  const known=FILES.some(file=>new URL(file,self.location.href).href===event.request.url);
  event.respondWith(fetch(event.request).then(async response=>{
    if(response.ok&&known){try{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}catch{}}
    return response;
  }).catch(async()=>await caches.match(event.request)||new Response('This resource is not available offline.',{status:503})));
});
