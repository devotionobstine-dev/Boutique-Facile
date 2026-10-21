const V='bf-v5-48f6063468',A=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const q=e.request,u=new URL(q.url);
 if(q.method!=='GET'||u.origin!==location.origin)return;
 if(u.searchParams.has('chk')){e.respondWith(fetch(q).catch(()=>new Response('',{status:504})));return}
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(q,{ignoreSearch:true});
  const net=fetch(q).then(r=>{if(r.ok&&!r.redirected)c.put(q,r.clone());return r}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return (await net)||(await c.match('index.html'))||Response.error();
 }));
});
