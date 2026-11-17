const BUILD=__BUILD__,FILES=__FILES__,CACHE='wispbound-'+BUILD;
// Installation is atomic: missing or changed assets reject the new worker.
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const staged=[];for(const file of FILES){const response=await fetch(new URL(file.source||file.url,self.registration.scope),{cache:'no-store'});if(!response.ok||response.redirected)throw Error('Incomplete release');const bytes=await response.clone().arrayBuffer();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==file.sha256)throw Error('Content mismatch');staged.push([file.url,file.contentType?new Response(bytes,{headers:{'Content-Type':file.contentType}}):response]);}
 const cache=await caches.open(CACHE);for(const [url,response] of staged)await cache.put(new URL(url,self.registration.scope),response);
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();/* Previous caches are intentionally retained for already-open older clients. */})()));
self.addEventListener('message',event=>{if(event.data?.type==='VERSION')event.ports[0]?.postMessage({build:BUILD});if(event.data?.type==='APPLY')self.skipWaiting();});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;const relative=url.pathname.slice(new URL(self.registration.scope).pathname.length);if(relative==='release.json'||relative.endsWith('.apk')||relative.endsWith('.zip')||relative==='atsisiusti.html')return;
 const filename=event.request.mode==='navigate'?'index.html':relative;if(!FILES.some(f=>f.url===filename))return;event.respondWith((async()=>{const cache=await caches.open(CACHE),match=await cache.match(new URL(filename,self.registration.scope));return match||fetch(event.request);})());});
