const V='bf-v6-d8613e69d2',MUST=['./','index.html'],OPT=['manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
const get=u=>fetch(new Request(u,{cache:'reload'})).then(r=>{if(!r.ok)throw new Error(u);return r});
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(async c=>{
 await Promise.all(MUST.map(u=>get(u).then(r=>c.put(u,r))));
 await Promise.all(OPT.map(u=>get(u).then(r=>c.put(u,r)).catch(()=>{})));
}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const q=e.request,u=new URL(q.url);
 if(q.method!=='GET'||u.origin!==location.origin)return;
 if(u.searchParams.has('chk')){e.respondWith(fetch(q).catch(()=>new Response('',{status:504})));return}
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(q,{ignoreSearch:true});
  const net=fetch(q.url,{cache:'no-cache'}).then(r=>{if(r.ok&&!r.redirected)c.put(q,r.clone());return r}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return (await net)||(await c.match('index.html'))||Response.error();
 }));
});
