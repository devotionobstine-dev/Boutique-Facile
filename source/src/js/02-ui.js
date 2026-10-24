// ---- affichage : fenêtres internes, navigation, bandeaux
let tab='v',sub='',cb=null,newVer=false,memWarn='';
const SCR={},SUB={},AR=[];
const FR=(()=>{try{return window.top!==window.self}catch(e){return true}})();
if(FR)document.documentElement.classList.add('inframe');
const chip=(l,on,js,c)=>`<button class="chip${on?' on':''}${c?' '+c:''}" onclick="${js}">${l}</button>`;
const kv=(a,b,c)=>`<div class="kv"><span>${a}</span><b${c?' class="'+c+'"':''}>${b}</b></div>`;
const rowh=(a,b,s,c)=>`<div class="row"><div class="gr1">${a}${s?`<small>${s}</small>`:''}</div><b${c?' class="'+c+'"':''}>${b}</b></div>`;
const back=()=>{sub='';R();scrollTo(0,0)};
const backBtn=(to)=>`<div class="back"><button onclick="${to||'back()'}">‹ ${_('Retour')}</button></div>`;
function toast(m,ms){const t=$('#t');t.textContent=m;t.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.opacity=0,ms||2400)}
let mBusy=0,mQ=null;
function M(h){
 if(mBusy){mQ={h};return}
 mBusy=1;try{
  const m=$('#m');m.innerHTML=h?`<div class="ov"><div class="sh"><div class="sb">${h}</div></div></div>`:'';
  // la barre de boutons du bas reste visible : elle sort de la zone qui défile
  if(h){const sh=m.querySelector('.sh'),bars=[...m.querySelector('.sb').children].filter(x=>x.classList.contains('pay2')||x.classList.contains('kpf'));
   if(bars.length){const f=document.createElement('div');f.className='sf';bars.forEach(b=>f.appendChild(b));sh.appendChild(f)}}
 }finally{mBusy=0}
 document.body.classList.toggle('noscroll',!!h);
 if(mQ){const q=mQ;mQ=null;M(q.h)}}
const acts=(yes,js,no,njs)=>`<div class="pay2"><button class="b ol" onclick="${njs||'M()'}">${no||_('Annuler')}</button><button class="b gr" onclick="${js}">${yes}</button></div>`;
function ask(t,lb,fn,o){o=o||{};cb=fn;
 M(`<h2>${t}</h2><label>${lb}</label><input class="in${o.nm?' nm':''}" id="ai" ${o.pw?'type="password" maxlength="4" ':o.pwl?'type="password" ':''}${o.txt||o.pwl?'':'inputmode="numeric" '}autocomplete="off" value="${esc(o.val||'')}" onkeydown="if(event.key=='Enter')askok()">${acts(o.yes||_('Valider'),'askok()')}`);
 setTimeout(()=>{const e=$('#ai');if(e)e.focus()},60)}
function askok(){const v=$('#ai').value,fn=cb;M();if(fn)fn(v)}
function sure(t,fn,yes,body){cb=fn;M(`<h2>${t}</h2>${body||''}${acts(yes||_('Oui'),'sureok()',_('Non'))}`)}
function sureok(){const fn=cb;M();if(fn)fn()}
function info(t,body,close){M(`<h2>${t}</h2>${body}<div class="pay2 o"><button class="b gr" onclick="M()">${close||_('Fermer')}</button></div>`)}
function hdr(){
 const u=me();
 return `<div><h1>${esc(S.shop.name||'Boutique Facile')}</h1><small>${esc(u.n)} · ${FR?_('Version d\'essai en ligne'):_("Tout est enregistré sur ce téléphone")}</small></div><div style="display:flex;gap:6px;align-items:center"><span class="pill${navigator.onLine?'':' off'}">${navigator.onLine?_('En ligne'):_('Hors ligne')}</span>${FR?'':`<button class="ib" onclick="lock()" aria-label="${_('Verrouiller')}">🔒</button>`}</div>`}
function navItems(){
 const low=S.p.filter(p=>isLow(p)).length+(typeof nExp=='function'?nExp():0);
 const od=S.cl.filter(c=>c.a>0&&c.due&&c.due<Date.now()).length;
 return[['v','🛒',_('Vendre'),0],['s','📦',_('Stock'),low],['c','👥',_('Clients'),od],['k','💰',_('Caisse'),0],['p','☰',_('Plus'),0]]}
function nav(){return navItems().map(([k,i,l,n])=>`<button class="${tab==k?'on':''}" onclick="go('${k}')"><i>${i}</i>${l}${n?`<em>${n>99?'99+':n}</em>`:''}</button>`).join('')}
function banners(){
 let h='';
 if(storErr=='read')h+=`<div class="bn r"><b>⚠ ${_('Vos données n\'ont pas pu être lues.')}</b> ${_('Rien n\'est enregistré. Fermez puis rouvrez l\'application.')}</div>`;
 else if(storErr)h+=`<div class="bn r"><b>⚠ ${_('Les données ne sont pas enregistrées.')}</b> ${_('La mémoire est pleine ou bloquée. Faites une sauvegarde tout de suite.')}<br><button class="b sm gr" onclick="go('p','bak')">${_('Sauvegarder')}</button></div>`;
 if(newVer)h+=`<div class="bn b">${_('Une nouvelle version est prête. Fermez puis rouvrez l\'application pour l\'utiliser.')}</div>`;
 if(memWarn)h+=`<div class="bn y">${memWarn} <button class="lnk" onclick="go('p','bak')">${_('Voir')}</button></div>`;
 if((tab=='k'||tab=='p')&&!sub){
  if(FR)h+=`<div class="bn b">${_('Version d\'essai en ligne : vos données ne sont pas garanties ici, et la caméra, l\'impression et l\'enregistrement de fichiers sont bloqués. Pour garder vos données et travailler sans internet, utilisez la version installée sur le téléphone.')}</div>`;
  else if(isO()&&(S.s.length||S.cl.length)){const d=S.bk?Math.floor((Date.now()-S.bk)/DAY):-1;
   if(d<0||d>=7)h+=`<div class="bn y"><b>${d<0?_('Aucune sauvegarde pour le moment.'):_('Dernière sauvegarde il y a {n} jours.',{n:d})}</b> ${_('Sauvegardez chaque semaine pour ne rien perdre.')}<br><button class="b sm gr" onclick="go('p','bak')">${_('Sauvegarder maintenant')}</button></div>`}}
 return h}
function go(t,s){tab=t;sub=s||'';R();scrollTo(0,0)}
let rBusy=0,rAgain=0;
function R(){
 if(!S)return;
 if(rBusy){rAgain=1;return}
 rBusy=1;try{R0()}finally{rBusy=0}
 if(rAgain){rAgain=0;R()}}
function R0(){
 applyAccent();
 document.documentElement.classList.toggle('big',!!S.set.big);
 document.body.classList.toggle('v',tab=='v'&&!sub);
 document.body.classList.toggle('simple',!!S.set.simple);
 $('#hd').innerHTML=hdr();$('#nv').innerHTML=nav();
 const fn=sub?SUB[sub]:SCR[tab];let h='';
 try{h=fn?fn():''}catch(e){console.error(e);h=`<p class="hint">Erreur : ${esc(e.message)}</p>`}
 $('#app').innerHTML=banners()+h;
 AR.forEach(g=>{try{g()}catch(e){console.error(e)}})}
function setLang(c){LANG=c||'fr';TR=(S.tr&&S.tr[LANG])||{};document.documentElement.lang=/^[a-z]{2,3}$/.test(LANG)?LANG:'fr';S.set.lang=LANG}
async function checkMem(){const m=await memInfo();let w='';
 if(m.quota&&m.used/m.quota>0.8)w=_('La mémoire du téléphone est presque pleine. Faites une sauvegarde et libérez de la place.');
 else if(m.js>3.5e6&&!DB)w=_('La mémoire de l\'application est presque pleine. Faites une sauvegarde.');
 if(w!==memWarn){memWarn=w;R()}}
function checkUpdate(){if(FR||!navigator.onLine)return;fetch('index.html?chk='+Date.now(),{cache:'no-store'}).then(r=>r.text()).then(t=>{const m=/const BUILD='([^']+)'/.exec(t);if(m&&m[1]!==BUILD&&BUILD!='__BUILD__'){newVer=true;R()}}).catch(()=>{})}
addEventListener('online',R);addEventListener('offline',R);
