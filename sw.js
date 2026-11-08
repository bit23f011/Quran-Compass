const CACHE='surah-compass-v1';
const FILES=['./','./index.html','./styles.css','./system.css','./reader.css','./learning.css','./visual.css','./mushaf.css','./core.js','./store.js','./app.js','./reader.js','./learning.js','./mushaf.js','./content.js','./sync.js','./config.js','./data/surahs.js','./data/quran.js','./data/study.js','./data/editions.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/home-islamic-bg.webp','./manifest.webmanifest'];
FILES.push('./assets/book-page-edges.svg','./brand.css','./layout.css','./layout.js','./logo-loader.js','./spin-audio.js','./book-audio.js','./analytics.js','./assets/brand-mark.png','./assets/favicon.png','./assets/social-preview.png');
/* SEO_CACHE_FILES */
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('surah-compass-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const requested=new URL(event.request.url);
  if(event.request.method!=='GET'||requested.origin!==self.location.origin||requested.pathname.startsWith('/_vercel/'))return;
  // Refresh local assets while online; use the complete installed copy offline.
  const known=FILES.some(file=>new URL(file,self.location.href).href===event.request.url);
  event.respondWith(fetch(event.request).then(async response=>{
    if(response.ok&&known){try{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}catch{}}
    return response;
  }).catch(async()=>await caches.match(event.request)||new Response('This resource is not available offline.',{status:503})));
});
