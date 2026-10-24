// ---- plusieurs boutiques : chaque boutique reste indépendante, les chiffres se regroupent par fichiers
function brPack(days){
 const now=Date.now(),a=days?now-days*DAY:0,f1=x=>x.t>=a,s=situation();
 const D={s:S.s.filter(f1),rt:S.rt.filter(f1),ex:S.ex.filter(f1),adj:S.adj.filter(f1),ag:S.ag.filter(f1),pu:S.pu.filter(f1),
  cl:S.cl.map(c=>({id:c.id,n:c.n,a:c.a,due:c.due,h:c.h.filter(h=>h.t>=a&&h.v<0&&!h.x).map(h=>({t:h.t,v:h.v,by:h.by}))})),sup:[]};
 return{kind:'bf-branch',v:5,shop:{id:S.shop.id,name:S.shop.name},t:now,from:a,sv:s.sv,cr:s.cr,sd:s.sd,D}}
let BR={n:'BR',k:'m',from:'',to:'',days:90};
SUB.shops=()=>{
 const ids=Object.keys(S.br);
 return `${backBtn()}<h3>🏬 ${_('Plusieurs boutiques')}</h3>
<div class="bn b">${_('Chaque boutique garde ses données sur son propre téléphone. Pour voir toutes vos boutiques ensemble, chaque gérant envoie un « rapport de boutique » (un petit fichier) et vous l\'importez ici. Le fichier ne contient ni photos, ni pièces d\'identité.')}</div>
<div class="card pl"><b>${_('Envoyer le rapport de cette boutique')}</b><label>${_('Période à envoyer')}</label><select class="in" id="brd"><option value="30"${BR.days==30?' selected':''}>${_('30 derniers jours')}</option><option value="90"${BR.days==90?' selected':''}>${_('3 derniers mois')}</option><option value="365"${BR.days==365?' selected':''}>${_('12 derniers mois')}</option></select>
<button class="b gr" style="width:100%;margin-top:8px" onclick="brExport()">${_('Créer et envoyer le rapport')}</button></div>
<div class="card pl"><b>${_('Importer le rapport d\'une autre boutique')}</b><input class="in" type="file" accept=".json,application/json" multiple onchange="brImport(this)"></div>
<h3>${_('Boutiques importées')}</h3>
<div class="card">${ids.length?ids.map(id=>{const p=S.br[id];return `<div class="row"><div class="gr1"><b>${esc(p.name)}</b><small>${_('Rapport du {d}',{d:fdate(p.t)})}${p.from?' · '+_('depuis le {d}',{d:fdate(p.from)}):''}</small></div><button class="b xs ol" onclick="brDel('${id}')">✕</button></div>`}).join(''):`<p class="hint">${_('Aucune boutique importée.')}</p>`}</div>
<div class="top"><button class="b ol" onclick="go('p','cons')">📊 ${_('Voir toutes les boutiques ensemble')}</button></div>`};
async function brExport(){
 if(FR)return frNo();
 BR.days=+$('#brd').value;
 const p=brPack(BR.days);
 await outFile('rapport-'+nz(S.shop.name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+ymd(Date.now())+'.json',JSON.stringify(p),'application/json');
 toast(_('Rapport créé ✓'))}
// fichier reçu d'un autre téléphone : identifiant simple (il sert dans un onclick) et listes attendues par les calculs
const brValid=p=>!!(p&&p.kind=='bf-branch'&&p.shop&&typeof p.shop.id=='string'&&/^[a-z0-9]{1,40}$/i.test(p.shop.id)&&p.D&&['s','rt','ex','adj','ag','pu','cl'].every(k=>Array.isArray(p.D[k])));
function brImport(inp){
 const fls=[...inp.files];if(!fls.length)return;let ok=0,bad=0,own=0,done=0;
 fls.forEach(fl=>{const rd=new FileReader();
  rd.onload=()=>{
   try{const p=JSON.parse(String(rd.result));
    if(!brValid(p))throw new Error('bad');
    if(p.shop.id==S.shop.id){own++}
    else{const o=S.br[p.shop.id];if(!o||o.t<=p.t){S.br[p.shop.id]={name:String(p.shop.name||''),t:+p.t||0,from:+p.from||0,sv:+p.sv||0,cr:+p.cr||0,sd:+p.sd||0,D:p.D}}ok++}
   }catch(e){bad++}
   if(++done==fls.length){save(true);R();toast((ok?_('{n} rapport(s) importé(s) ✓',{n:ok}):'')+(own?' '+_('Ce rapport vient de cette boutique.'):'')+(bad?' '+_('{n} fichier(s) non reconnu(s)',{n:bad}):''),3800)}};
  rd.onerror=()=>{bad++;if(++done==fls.length){R()}};
  rd.readAsText(fl)})}
function brDel(id){sure(_('Retirer cette boutique de la liste ?'),()=>{delete S.br[id];save(true);R()},_('Retirer'))}
SUB.cons=()=>{
 const [a,b,lab]=per(BR);
 const rows=[{n:S.shop.name,own:1,r:agg(DS(),a,b,0),sv:situation().sv,cr:situation().cr,sd:supDebt()}];
 Object.keys(S.br).forEach(id=>{const p=S.br[id];rows.push({n:p.name,r:agg(p.D,a,b,0),sv:p.sv||0,cr:p.cr||0,sd:p.sd||0,t:p.t,from:p.from})});
 const T=rows.reduce((o,x)=>({net:o.net+x.r.net,exp:o.exp+x.r.exp,pr:o.pr+x.r.profit,n:o.n+x.r.n,sv:o.sv+x.sv,cr:o.cr+x.cr,sd:o.sd+x.sd}),{net:0,exp:0,pr:0,n:0,sv:0,cr:0,sd:0});
 const mx=Math.max(1,...rows.map(x=>x.r.net));
 return `${backBtn("go('p','shops')")}<h3>📊 ${_('Toutes les boutiques')}</h3>${perUI(BR)}
<div class="sum"><small>${esc(lab)}</small><div class="tot">${f(T.net)}</div><small>${T.n} ${_('vente(s)')} · ${_('résultat estimé')} ${f(T.pr)}</small></div>
<div class="card pl">${rows.map(x=>hbar(esc(x.n)+(x.own?' ★':''),x.r.net,mx,f(x.r.net))).join('')}</div>
<div class="card pl sc"><table class="tb"><tr><th>${_('Boutique')}</th><th>${_('Ventes')}</th><th>${_('Dépenses')}</th><th>${_('Résultat')}</th><th>${_('Stock')}</th><th>${_('Clients doivent')}</th></tr>
${rows.map(x=>`<tr><td>${esc(x.n)}${x.t&&x.from&&a<x.from?'<br><small class="neg">'+_('données incomplètes')+'</small>':''}${x.t?'<br><small>'+_('rapport du {d}',{d:fdate(x.t)})+'</small>':''}</td><td>${fm(x.r.net)}</td><td>${fm(x.r.exp)}</td><td class="${x.r.profit<0?'neg':''}">${fm(x.r.profit)}</td><td>${fm(x.sv)}</td><td>${fm(x.cr)}</td></tr>`).join('')}
<tr><td><b>${_('Total')}</b></td><td><b>${fm(T.net)}</b></td><td><b>${fm(T.exp)}</b></td><td><b>${fm(T.pr)}</b></td><td><b>${fm(T.sv)}</b></td><td><b>${fm(T.cr)}</b></td></tr></table></div>
<p class="sm2" style="margin:6px 16px">${_('Les rapports importés sont des photos prises à leur date. Demandez de nouveaux rapports pour mettre à jour.')}</p>
<div class="btns"><button class="b ol sm nf" onclick="consPrint()">🖨 ${_('Imprimer / PDF')}</button></div>`};
function consPrint(){
 const [a,b,lab]=per(BR);
 const rows=[{n:S.shop.name,r:agg(DS(),a,b,0),sv:situation().sv}];
 Object.keys(S.br).forEach(id=>{const p=S.br[id];rows.push({n:p.name,r:agg(p.D,a,b,0),sv:p.sv||0})});
 const tn=rows.reduce((s,x)=>s+x.r.net,0),te=rows.reduce((s,x)=>s+x.r.exp,0),tp=rows.reduce((s,x)=>s+x.r.profit,0),ts=rows.reduce((s,x)=>s+x.sv,0);
 printHTML(docHead(_('Rapport de toutes les boutiques'),lab)+tbl([_('Boutique'),_('Ventes'),_('Dépenses'),_('Résultat estimé'),_('Valeur du stock')],rows.map(x=>[esc(x.n),fm(x.r.net),fm(x.r.exp),fm(x.r.profit),fm(x.sv)]).concat([['<b>'+esc(_('Total'))+'</b>','<b>'+fm(tn)+'</b>','<b>'+fm(te)+'</b>','<b>'+fm(tp)+'</b>','<b>'+fm(ts)+'</b>']]))+docTail())}
