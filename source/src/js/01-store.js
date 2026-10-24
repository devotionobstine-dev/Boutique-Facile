// ---- état de l'application, enregistrement sûr, migration, sauvegardes
let S=null,DB=null,CU=1,storErr=null,dirty=false,saveT=0,flushQ=Promise.resolve(),lastSave=0,legacyLoaded=false,readFail=false;
const SKEY='bf5',LKEY='bf1',MEMPH={};
function newState(demo){
 const o={v:5,n:10,rn:0,bk:0,lx:0,
  shop:{id:uid(),name:'Ma boutique',addr:'',tel:'',nif:'',own:''},
  set:{lang:'fr',simple:0,big:0,mods:{ph:0,ag:0,tv:0},tva:18,round:0,sellMaxDisc:10,sellCost:0,reqOpen:0,rcw:80,dueDays:15,op:'om',type:'',setup:0,agRate:0,msg:'Merci de votre confiance !',expd:90,rdest:'c',rcm:'',ac:''},
  users:[{id:1,n:'Patron',r:'o',pin:null,on:1}],rc:null,
  p:[],s:[],rt:[],cl:[],ex:[],pu:[],sup:[],adj:[],ag:[],cx:[],cs:{},pl:[],tr:{},langs:[],br:{},hold:[]};
 if(demo)o.p=[
  {id:1,n:'Riz 25 kg',cat:'Alimentation',pr:280000,c:250000,q:12,m:3},
  {id:2,n:'Huile 5 L',cat:'Alimentation',pr:110000,c:95000,q:8,m:3},
  {id:3,n:'Sucre 1 kg',cat:'Alimentation',pr:15000,c:12500,q:30,m:10},
  {id:4,n:'Paracétamol 500 mg',cat:'Médicaments',pr:8000,c:5000,q:40,m:15},
  {id:5,n:'Savon',cat:'Hygiène',pr:5000,c:3500,q:4,m:5}].map(pdef);
 return o}
function pdef(p){return Object.assign({cat:'',bu:'',g:'',col:'',bc:'',us:[],pg:0,dec:0,fav:0,off:0,tva:1,du:-1,m:3,sup:'',rx:0,dci:'',lt:0,lots:[],c:0,pr:0,q:0},p)}
function ensure(o){const N=newState(false);
 for(const k in N)if(o[k]===undefined)o[k]=N[k];
 for(const k in N.set)if(o.set[k]===undefined)o.set[k]=N.set[k];
 for(const k in N.set.mods)if(o.set.mods[k]===undefined)o.set.mods[k]=N.set.mods[k];
 for(const k in N.shop)if(o.shop[k]===undefined)o.shop[k]=N.shop[k];
 o.p=o.p.map(pdef);
 // ventes mises en attente : on garde les 2 derniers jours, sans lignes cassées
 o.hold=(Array.isArray(o.hold)?o.hold:[]).filter(h=>h&&Array.isArray(h.lines)&&h.lines.length&&Date.now()-h.t<2*DAY);
 o.s.forEach(x=>{if(!x.pay)x.pay=[{m:x.m||'e',a:x.total,ref:x.ref||''}]});
 if(!o.users.length)o.users=N.users;
 // données reçues d'un fichier : on ne garde que des codes de langue simples et des textes sans balises
 o.langs=(Array.isArray(o.langs)?o.langs:[]).filter(l=>l&&typeof l.n=='string'&&/^[a-z0-9]{1,12}$/.test(l.c)&&l.c!='fr');
 const T0=(o.tr&&typeof o.tr=='object')?o.tr:{};o.tr={};
 o.langs.forEach(l=>{const t=T0[l.c];o.tr[l.c]={};if(t&&typeof t=='object')for(const k in t)if(typeof t[k]=='string'&&t[k])o.tr[l.c][k]=trClean(t[k])});
 return o}
// données de la version 4 -> version 5
function migrate(o){
 const ph={};
 if(o.v>=5)return{S:ensure(o),ph};
 const N=newState(false);
 N.n=o.n||10;N.bk=o.bk||0;N.users[0].pin=o.pin||null;N.set.setup=1;
 N.p=(o.p||[]).map(pdef);
 N.cl=(o.d||[]).map(d=>{const k=d.id||{};const c={id:uid(),n:d.cl,tel:k.tel||'',pi:k.pi||'',ph:'',a:d.a||0,h:(d.h||[]).map(h=>({t:h.t,v:h.v,x:h.x?1:0,m:'e'})),due:0,lim:0,t0:(d.h&&d.h[0]&&d.h[0].t)||Date.now()};
  if(k.img){c.ph='ph'+uid();ph[c.ph]=k.img}return c});
 N.s=(o.s||[]).map((x,i)=>{const c=N.cl.find(y=>x.cl&&y.n.toLowerCase()==x.cl.toLowerCase());
  return{id:'m'+i+'_'+x.t,t:x.t,no:i+1,by:1,items:(x.items||[]).map(it=>({id:it.id,n:it.n,u:'',f:1,q:it.q,pr:it.pr,pr0:it.pr,c:it.c,tv:1})),sub:x.sub||x.total,disc:x.disc||0,total:x.total,pay:[{m:x.m||'e',a:x.total,ref:x.ref||''}],cl:x.cl||'',cid:c?c.id:'',v:x.v?1:0}});
 N.rn=N.s.length;
 return{S:ensure(N),ph}}
// ---- stockage : IndexedDB, sinon localStorage, sinon mémoire
const idbOpen=()=>new Promise((res,rej)=>{try{const r=indexedDB.open('bf5db',1);r.onupgradeneeded=()=>{r.result.createObjectStore('kv');r.result.createObjectStore('ph')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'));setTimeout(()=>rej(new Error('timeout')),4000)}catch(e){rej(e)}});
const idbGet=(st,k)=>new Promise((res,rej)=>{const t=DB.transaction(st).objectStore(st).get(k);t.onsuccess=()=>res(t.result);t.onerror=()=>rej(t.error)});
const idbPut=(st,k,v)=>new Promise((res,rej)=>{const tx=DB.transaction(st,'readwrite');tx.objectStore(st).put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('abort'))});
const idbDel=(st,k)=>new Promise((res,rej)=>{const tx=DB.transaction(st,'readwrite');tx.objectStore(st).delete(k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)});
async function phPut(id,d){if(DB){try{await idbPut('ph',id,d);return}catch(e){}}try{localStorage.setItem('bf5p_'+id,d)}catch(e){MEMPH[id]=d}}
async function phGet(id){if(!id)return'';if(MEMPH[id])return MEMPH[id];if(DB){try{const v=await idbGet('ph',id);if(v)return v}catch(e){}}try{return localStorage.getItem('bf5p_'+id)||''}catch(e){return''}}
async function phDel(id){if(!id)return;delete MEMPH[id];if(DB){try{await idbDel('ph',id)}catch(e){}}try{localStorage.removeItem('bf5p_'+id)}catch(e){}}
async function allPhotos(){const out={};
 if(DB){try{await new Promise((res,rej)=>{const r=DB.transaction('ph').objectStore('ph').openCursor();r.onsuccess=()=>{const c=r.result;if(c){out[c.key]=c.value;c.continue()}else res()};r.onerror=()=>rej(r.error)})}catch(e){}}
 try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('bf5p_'))out[k.slice(5)]=localStorage.getItem(k)}}catch(e){}
 return Object.assign(out,MEMPH)}
async function loadState(){
 // un téléphone lent peut dépasser le délai d'ouverture : on réessaie une fois
 for(let i=0;i<2&&!DB;i++){try{DB=await idbOpen()}catch(e){DB=null}}
 // lecture ratée (et non « rien d'enregistré ») : on ne sait pas ce qu'il y a, donc on n'écrit rien par-dessus
 let raw=null,bad=false;
 if(DB){try{raw=await idbGet('kv','S')}catch(e){try{raw=await idbGet('kv','S')}catch(e2){bad=true}}}
 if(!raw){try{raw=localStorage.getItem(SKEY)}catch(e){}}
 let st=null;
 if(raw){try{st=JSON.parse(raw)}catch(e){st=null;bad=true}}
 let ph={};
 if(st&&st.p){const m=migrate(st);st=m.S}
 else if(bad){readFail=true;storErr='read';S=newState(false);return S}
 else{st=null;
  try{const l=localStorage.getItem(LKEY);if(l){const o=JSON.parse(l);if(o&&o.p){const m=migrate(o);st=m.S;ph=m.ph;legacyLoaded=true}}}catch(e){}}
 S=st||newState(true);
 for(const k in ph)await phPut(k,ph[k]);
 if(legacyLoaded||!st){dirty=true;await flush()}
 try{if(navigator.storage&&navigator.storage.persist)Promise.resolve(navigator.storage.persist()).catch(()=>{})}catch(e){}
 return S}
function save(now){dirty=true;clearTimeout(saveT);if(now)flush();else saveT=setTimeout(flush,250)}
function flush(){flushQ=flushQ.then(doFlush).catch(()=>{});return flushQ}
async function doFlush(){
 if(!dirty||!S||readFail)return;dirty=false;
 let js;try{js=JSON.stringify(S)}catch(e){storErr='x';dirty=true;return}
 if(DB){try{await idbPut('kv','S',js);storErr=null;lastSave=Date.now();try{localStorage.removeItem(SKEY)}catch(e){}return}catch(e){}}
 try{localStorage.setItem(SKEY,js);storErr=null;lastSave=Date.now();return}catch(e){}
 if(FR){storErr=null;return}
 storErr='full';dirty=true;if(typeof R=='function')R()}
addEventListener('pagehide',()=>{if(dirty)flush()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&dirty)flush()});
async function memInfo(){let used=0,quota=0;try{const e=await navigator.storage.estimate();used=e.usage||0;quota=e.quota||0}catch(e){}let js=0;try{js=JSON.stringify(S).length}catch(e){}return{used,quota,js}}
// ---- sauvegarde et restauration
async function makeBackup(o){o=o||{};const ph=o.photos===false?{}:await allPhotos();
 const keep=new Set(S.cl.map(c=>c.ph).filter(Boolean));for(const k in ph)if(!keep.has(k))delete ph[k];
 const txt=JSON.stringify({kind:'bf-backup',v:5,t:Date.now(),S,photos:ph});
 return o.pw?await encText(txt,o.pw):txt}
async function restoreFrom(text,pw){
 let o=JSON.parse(text);
 if(o.kind=='bf-backup-enc'){if(!pw)throw new Error('pw');try{o=JSON.parse(await decText(o,pw))}catch(e){throw new Error('badpw')}}
 let st,ph={};
 if(o.kind=='bf-backup'&&o.S){st=o.S;ph=o.photos||{}}else if(o.p&&o.s){st=o}else throw new Error('bad');
 const m=migrate(st);st=m.S;ph=Object.assign({},m.ph,ph);
 return{S:st,ph}}
async function applyRestore(r){
 const dev=S.users.find(u=>u.r=='o'),rc=S.rc,keep=dev&&dev.pin;
 const old=await allPhotos();for(const k in old)await phDel(k);
 S=r.S;
 if(keep){let o=S.users.find(u=>u.r=='o');if(o){o.pin=dev.pin;o.on=1}else{S.users.unshift(dev);o=dev}S.rc=rc;CU=o.id}
 for(const k in r.ph)await phPut(k,r.ph[k]);
 readFail=false;storErr=null;dirty=true;await flush()}
