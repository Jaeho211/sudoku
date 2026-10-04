const CACHE='sudoku-shell-__BUILD_VERSION__';
const FILES=['/','/index.html','/style.css','/src/app.js','/src/engine.js','/src/stages.js','/manifest.webmanifest','/pwa.js','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-180.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(path=>new Request(path,{cache:'reload'}))).then(()=>self.skipWaiting())));});
// Activate the downloaded version; existing pages keep their running JS until reload.
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sudoku-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;}
 if(FILES.includes(url.pathname))event.respondWith(caches.open(CACHE).then(async cache=>{try{const response=await fetch(event.request,{cache:'no-cache'});if(response.ok)await cache.put(url.pathname,response.clone());return response;}catch(error){const saved=await cache.match(url.pathname);if(saved)return saved;throw error;}}));
});
