// ---- stock : liste, fiche produit, inventaire, prix en bloc, péremption
let sq0='',sf0='';
function expInfo(p){
 if(!p.lt||!p.lots.length)return{exp:false,soon:false,eq:0,sq:0,d:null};
 const t0=D0(Date.now()),lim=S.set.expd*DAY;let eq=0,sqn=0,dmin=null;
 p.lots.forEach(l=>{if(!l.exp||l.q<=0)return;const d=pd(l.exp)-t0;if(d<0)eq+=l.q;else if(d<=lim)sqn+=l.q;if(dmin===null||d<dmin)dmin=d});
 return{exp:eq>0,soon:sqn>0,eq:rq(eq),sq:rq(sqn),d:dmin===null?null:Math.round(dmin/DAY)}}
function nExp(){return S.set.mods.ph?S.p.filter(p=>{if(p.off)return false;const e=expInfo(p);return e.exp||e.soon}).length:0}
const stockVal=()=>S.p.reduce((a,p)=>a+Math.max(p.q,0)*p.c,0);
function T(){
 const nq=nz(sq0);let L=S.p.filter(p=>sf0=='off'?p.off:!p.off);
 if(sf0=='low')L=L.filter(isLow);
 if(sf0=='exp')L=L.filter(p=>{const e=expInfo(p);return e.exp||e.soon});
 if(nq)L=L.filter(p=>nz([p.n,p.g,p.bc,p.cat,p.dci,p.col].join(' ')).includes(nq));
 L=L.slice().sort((a,b)=>a.n.localeCompare(b.n,'fr'));
 const low=S.p.filter(p=>isLow(p)).length;
 return `<div class="srch"><input class="in" id="stq" placeholder="${_('Rechercher un produit…')}" value="${esc(sq0)}" oninput="stq(this.value)" autocomplete="off"><button class="b ol sm" onclick="scanFor('stock')" style="display:${typeof camOK=='function'&&camOK()?'':'none'}">📷</button></div>
<div class="chips">${chip(_('Tous'),!sf0,"stf('')")}${chip(_('À recommander')+(low?' ('+low+')':''),sf0=='low',"stf('low')",low?'r':'')}${S.set.mods.ph?chip(_('Péremption'),sf0=='exp',"stf('exp')"):''}${isO()?chip(_('Archivés'),sf0=='off',"stf('off')"):''}</div>
${isO()?`<div class="top"><button class="b gr" onclick="pf()">＋ ${_('Ajouter un produit')}</button></div>
<div class="btns adv"><button class="b ol sm" onclick="go('s','inv')">📋 ${_('Inventaire')}</button><button class="b ol sm" onclick="go('s','bulk')">％ ${_('Prix en bloc')}</button><button class="b ol sm" onclick="go('s','buy')">🚚 ${_('Achats')}</button></div>`:''}
${seeCost()&&!S.set.simple?`<div class="sum"><small>${_('Valeur du stock (prix d\'achat)')}</small><div class="tot s">${f(stockVal())}</div></div>`:''}
<div class="card" id="stl">${stlist(L)}</div>`}
function stlist(L){
 if(!L.length)return`<p class="hint">${S.p.length?_('Aucun produit dans cette liste.'):_('Aucun produit. Touchez « Ajouter un produit ».')}</p>`;
 return L.map(p=>{const lo=isLow(p),e=S.set.mods.ph?expInfo(p):{};
  const bd=(p.rx&&S.set.mods.ph?'<span class="bd">Rx</span>':'')+(e.exp?`<span class="bd">${_('Périmé')} (${fq(e.eq)})</span>`:e.soon?`<span class="bd y">${_('Expire dans {n} j',{n:e.d})}</span>`:'')+(p.lt?`<span class="bd b">${p.lots.length} ${_('lot(s)')}</span>`:'');
  return `<div class="row"><div class="gr1"><b>${esc(p.n)} ${esc(p.g||'')}</b><small>${[p.cat,p.col].filter(Boolean).map(esc).join(', ')}${p.cat||p.col?' · ':''}${_('Vente')} ${f(p.pr)}${seeCost()?', '+_('achat')+' '+f(p.c):''}${p.us.length?' · '+p.us.map(u=>esc(u.n)).join('/'):''}</small>${p.bc?`<small>${_('Code')} ${esc(p.bc)}</small>`:''}${bd?'<div>'+bd+'</div>':''}</div>
<div class="qty${lo?' low':''}">${fq(p.q)}${p.bu?`<small>${esc(p.bu)}</small>`:''}${lo?`<small>${_('À recommander')}</small>`:''}</div>
${isO()?`<div style="display:flex;flex-direction:column;gap:4px">${p.off?`<button class="b xs ol" onclick="pfOff(${p.id},0)">${_('Réactiver')}</button>`:`<button class="b xs gr" onclick="quickBuy(${p.id})">＋ ${_('Stock')}</button>`}<button class="b xs ol" onclick="pf(${p.id})">${_('Modifier')}</button></div>`:''}</div>`}).join('')}
function stq(v){sq0=v;const e=$('#stl');if(e){const nq=nz(v);let L=S.p.filter(p=>sf0=='off'?p.off:!p.off);if(sf0=='low')L=L.filter(isLow);if(sf0=='exp')L=L.filter(p=>{const x=expInfo(p);return x.exp||x.soon});if(nq)L=L.filter(p=>nz([p.n,p.g,p.bc,p.cat,p.dci,p.col].join(' ')).includes(nq));e.innerHTML=stlist(L.slice().sort((a,b)=>a.n.localeCompare(b.n,'fr')))}}
function stf(k){sf0=k;R()}
function pfOff(id,v){P(id).off=v;save();R()}
// ---- fiche produit
let PF=null;
function pf(id){
 if(!isO())return needOwner(()=>pf(id));
 const p=id?P(id):null;
 PF=p?JSON.parse(JSON.stringify(p)):pdef({id:0,n:'',m:5,tva:1});
 PF.isNew=!p;PF.q0='';PF.lot0='';PF.exp0='';PF.adv=!S.set.simple;pfUI()}
function pfRead(){
 if(!$('#fn'))return;
 const g=id=>$('#'+id),v=id=>g(id)?g(id).value:'',ck=id=>g(id)&&g(id).checked?1:0;
 Object.assign(PF,{n:v('fn').trim(),g:v('fg').trim(),cat:v('fcat').trim(),pr:v('fv'),c:v('fa'),q0:v('fq')});
 if(g('fcol')){Object.assign(PF,{col:v('fcol').trim(),bc:v('fb').trim(),bu:v('fbu').trim(),pg:v('fgs'),m:v('fm'),dec:ck('fdec'),fav:ck('ffav'),tva:g('ftva')?ck('ftva'):PF.tva,sup:v('fsup'),du:+v('fdu'),rx:g('frx')?ck('frx'):PF.rx,dci:g('fdci')?v('fdci').trim():PF.dci,lt:g('flt')?ck('flt'):PF.lt,lot0:v('flot'),exp0:v('fexp')});
  PF.us=$$('.ur').map(r=>({n:r.querySelector('.un').value.trim(),f:r.querySelector('.uf').value,pr:r.querySelector('.up').value,pg:r.querySelector('.ug').value}))}}
function pfUI(skip){
 if(!skip)pfRead();
 const p=PF,ph=S.set.mods.ph,cats=[...new Set(S.p.map(x=>x.cat).filter(Boolean))];
 const nv=x=>x===''||x==null?'':(typeof x=='number'?(x===0&&p.isNew?'':fm(x)):x);
 const adv=p.adv?`
<div class="eq"><div><label>${_('Couleur (facultatif)')}</label><input class="in" id="fcol" value="${esc(p.col)}"></div><div><label>${_('Unité de base')}</label><input class="in" id="fbu" list="bul" value="${esc(p.bu)}" placeholder="${_('pièce, kg, boîte…')}"><datalist id="bul">${['pièce','boîte','kg','litre','mètre','sachet','comprimé','plaquette','carton','sac'].map(x=>`<option value="${x}">`).join('')}</datalist></div></div>
<label>${_('Code-barres (à taper, avec une douchette ou la caméra)')}</label><div class="srch" style="padding:0"><input class="in" id="fb" inputmode="numeric" value="${esc(p.bc)}"><button class="b ol sm" onclick="scanFor('pf')" style="display:${typeof camOK=='function'&&camOK()?'':'none'}">📷</button></div>
<div class="eq"><div><label>${_('Prix de gros (facultatif)')}</label><input class="in nm" id="fgs" inputmode="numeric" value="${nv(p.pg)}"></div><div><label>${_('Alerte quand il reste moins de')}</label><input class="in" id="fm" inputmode="decimal" value="${p.m}"></div></div>
<label>${_('Autres formats de vente (carton, boîte, plaquette…)')}</label>
${p.us.map((u,i)=>`<div class="card pl ur" style="margin:6px 0"><div class="eq"><div><label>${_('Nom du format')}</label><input class="in un" value="${esc(u.n)}"></div><div><label>${_('Contient (en unités de base)')}</label><input class="in uf" inputmode="decimal" value="${u.f}"></div></div><div class="eq"><div><label>${_('Prix de vente')}</label><input class="in nm up" inputmode="numeric" value="${nv(u.pr)}"></div><div><label>${_('Prix de gros')}</label><input class="in nm ug" inputmode="numeric" value="${nv(u.pg)}"></div></div><button class="b xs ol" onclick="pfRmU(${i})">✕ ${_('Retirer ce format')}</button></div>`).join('')}
<button class="b sm ol" onclick="pfAddU()">＋ ${_('Ajouter un format')}</button>
${p.us.length?`<label>${_('Format vendu par défaut')}</label><select class="in" id="fdu"><option value="-1"${p.du<0?' selected':''}>${esc(p.bu||_('Unité de base'))}</option>${p.us.map((u,i)=>`<option value="${i}"${p.du==i?' selected':''}>${esc(u.n)}</option>`).join('')}</select>`:'<input type="hidden" id="fdu" value="-1">'}
<label class="tg"><input type="checkbox" id="fdec"${p.dec?' checked':''}><span>${_('Vendu au poids ou à la mesure (quantités avec virgule)')}</span></label>
<label class="tg"><input type="checkbox" id="ffav"${p.fav?' checked':''}><span>★ ${_('Favori (affiché en premier à la caisse)')}</span></label>
${S.set.mods.tv?`<label class="tg"><input type="checkbox" id="ftva"${p.tva?' checked':''}><span>${_('TVA applicable à ce produit')}</span></label>`:''}
<label>${_('Fournisseur habituel')}</label><select class="in" id="fsup"><option value="">—</option>${S.sup.map(s=>`<option value="${s.id}"${p.sup==s.id?' selected':''}>${esc(s.n)}</option>`).join('')}</select>
${ph?`<div class="bn b"><b>${_('Pharmacie')}</b>
<label class="tg"><input type="checkbox" id="frx"${p.rx?' checked':''}><span>${_('Vendu sur ordonnance')}</span></label>
<label>${_('Substance active (DCI) — pour trouver les équivalents')}</label><input class="in" id="fdci" value="${esc(p.dci)}">
<label class="tg"><input type="checkbox" id="flt" onchange="pfUI()"${p.lt?' checked':''}><span>${_('Suivre les lots et les dates de péremption')}</span></label>
${p.lt&&p.isNew?`<div class="eq"><div><label>${_('N° de lot')}</label><input class="in" id="flot" value="${esc(p.lot0)}"></div><div><label>${_('Péremption')}</label><input class="in" id="fexp" type="date" value="${esc(p.exp0)}"></div></div>`:''}</div>`:''}`
 :`<button class="lnk" onclick="PF.adv=1;pfUI()">＋ ${_('Plus d\'options')}</button>`;
 M(`<h2>${p.isNew?_('Nouveau produit'):_('Modifier le produit')}</h2>
<label>${_('Nom du produit')}</label><input class="in" id="fn" value="${esc(p.n)}">
<label>${_('Format (ex. 500 g, 1 L)')}</label><input class="in" id="fg" value="${esc(p.g)}">
<label>${_('Catégorie (ex. boissons, médicaments)')}</label><input class="in" id="fcat" list="fcl" value="${esc(p.cat)}"><datalist id="fcl">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist>
<div class="eq"><div><label>${_('Prix d\'achat (GNF)')}</label><input class="in nm" id="fa" inputmode="numeric" value="${nv(p.c)}"></div><div><label>${_('Prix de vente (GNF)')}</label><input class="in nm" id="fv" inputmode="numeric" value="${nv(p.pr)}"></div></div>
${p.isNew?`<label>${_('Quantité en stock au départ')}</label><input class="in" id="fq" inputmode="decimal" value="${esc(p.q0)}">`:`<div class="kv"><span>${_('Stock actuel')}</span><b>${stockTxt(p0(p))}</b></div><div class="btns" style="padding:6px 0 0"><button class="b sm ol" onclick="M();quickBuy(${p.id})">＋ ${_('Ajouter du stock')}</button><button class="b sm ol" onclick="M();adjust(${p.id})">✎ ${_('Corriger le stock')}</button></div>`}
${adv}
<div class="pay2">${p.isNew?`<button class="b ol" onclick="M()">${_('Retour')}</button>`:`<button class="b ol" onclick="pfOff(${p.id},1);M()">${_('Archiver')}</button>`}<button class="b gr" onclick="pfSave()">${_('Enregistrer')}</button></div>`)}
const p0=p=>P(p.id)||p;
function pfAddU(){pfRead();PF.us.push({n:'',f:'',pr:'',pg:''});pfUI(1)}
function pfRmU(i){pfRead();PF.us.splice(i,1);if(PF.du==i)PF.du=-1;else if(PF.du>i)PF.du--;pfUI(1)}
function pfSave(){
 pfRead();const p=PF;
 const c=num(p.c),pr=num(p.pr);
 if(!p.n||isNaN(c)||isNaN(pr))return toast(_('Le nom et les prix sont nécessaires'));
 const us=[];
 for(const u of p.us){if(!u.n&&u.f===''&&u.pr==='')continue;const f1=dec(u.f),up=num(u.pr);if(!u.n||!(f1>0)||isNaN(up))return toast(_('Chaque format a un nom, un contenu et un prix'));us.push({n:u.n,f:f1,pr:up,pg:num(u.pg)||0})}
 if(p.bc){const d=S.p.find(x=>x.bc==p.bc&&x.id!=p.id);if(d&&!PF.dupOk){PF.dupOk=1;return toast(_('Ce code-barres est déjà utilisé par « {n} ». Touchez Enregistrer pour confirmer.',{n:d.n}),4000)}}
 const m=dec(p.m);const v={n:p.n,g:p.g,cat:p.cat,col:p.col||'',bc:p.bc||'',bu:p.bu||'',c,pr,pg:num(p.pg)||0,m:isNaN(m)?3:m,dec:p.dec?1:0,fav:p.fav?1:0,tva:p.tva?1:0,sup:p.sup||'',rx:p.rx?1:0,dci:p.dci||'',us,du:us.length&&p.du>=0&&p.du<us.length?p.du:-1};
 if(p.isNew){
  const q=Math.max(0,dec(p.q0)||0);Object.assign(v,{id:++S.n,q:0,lt:p.lt?1:0,lots:[]});const np=pdef(v);
  if(np.lt&&q>0)np.lots=[{no:p.lot0||'-',exp:p.exp0||'',q}];
  np.q=np.lt?lotQ(np):q;S.p.push(np);
  if(q>0)S.adj.push({id:uid(),t:Date.now(),by:CU,pid:np.id,d:q,why:'init',c:np.c,note:''})}
 else{const o=P(p.id);const lt=p.lt?1:0;Object.assign(o,v);
  if(lt&&!o.lt){o.lt=1;o.lots=o.q>0?[{no:'-',exp:'',q:o.q}]:[]}
  if(!lt&&o.lt){o.lt=0;o.lots=[]}}
 save(true);M();toast(_('Produit enregistré ✓'));R()}
// ---- correction de stock et inventaire
const WHY={count:X('Écart de comptage'),casse:X('Casse'),vol:X('Vol ou perte'),perime:X('Périmé'),don:X('Don ou échantillon'),autre:X('Autre'),init:X('Stock de départ'),retour:X('Retour abîmé')};
function adjust(id){
 if(!isO())return needOwner(()=>adjust(id));
 const p=P(id);
 M(`<h2>${_('Corriger le stock')}</h2><p><b>${esc(p.n)} ${esc(p.g||'')}</b> — ${_('stock actuel')} : ${stockTxt(p)}</p>
${p.lt?`<label>${_('Lot')}</label><select class="in" id="alot">${p.lots.map((l,i)=>`<option value="${i}">${esc(l.no)} ${l.exp?'· '+fdate(pd(l.exp)):''} (${fq(l.q)})</option>`).join('')}</select>`:''}
<label>${_('Quantité réellement comptée')}</label><input class="in" id="aq" inputmode="decimal">
<label>${_('Motif')}</label><select class="in" id="aw">${['count','casse','vol','perime','don','autre'].map(k=>`<option value="${k}">${_(WHY[k])}</option>`).join('')}</select>
<label>${_('Note (facultatif)')}</label><input class="in" id="an">${acts(_('Enregistrer'),'adjOk('+id+')')}`)}
function adjOk(id){
 const p=P(id),q=dec($('#aq').value);if(isNaN(q)||q<0)return toast(_('Quantité invalide'));
 const why=$('#aw').value,note=$('#an').value.trim();let d;
 if(p.lt){const l=p.lots[+$('#alot').value];d=rq(q-l.q);l.q=q;p.lots=p.lots.filter(x=>Math.abs(x.q)>1e-9);p.q=lotQ(p)}
 else{d=rq(q-p.q);p.q=q}
 if(d!==0)S.adj.push({id:uid(),t:Date.now(),by:CU,pid:id,d,why,c:p.c,note});
 save(true);M();toast(_('Stock corrigé ✓'));R()}
let INV={q:'',cnt:{}};
function invRows(){const nq=nz(INV.q);let L=S.p.filter(p=>!p.off);if(nq)L=L.filter(p=>nz([p.n,p.g,p.cat,p.bc].join(' ')).includes(nq));
 const rows=[];L.sort((a,b)=>a.n.localeCompare(b.n,'fr')).forEach(p=>{if(p.lt&&p.lots.length)p.lots.forEach((l,i)=>rows.push({k:p.id+'|'+i,p,l,i,exp:l.q}));else rows.push({k:p.id+'|-',p,exp:p.q})});return rows}
SUB.inv=()=>{
 const rows=invRows(),n=Object.keys(INV.cnt).filter(k=>INV.cnt[k]!=='').length;
 return `${backBtn('go(\'s\')')}<h3>📋 ${_('Inventaire')}</h3><p class="hint" style="margin-top:0">${_('Comptez ce qu\'il y a sur les étagères et notez la quantité. Laissez vide les produits que vous ne comptez pas.')}</p>
<div class="srch"><input class="in" placeholder="${_('Rechercher…')}" value="${esc(INV.q)}" oninput="INV.q=this.value;$('#invl').innerHTML=invList()" autocomplete="off"></div>
<div class="card" id="invl">${invList()}</div>
<div class="top"><button class="b gr" onclick="invApply()">${_('Voir les écarts')} (${n})</button></div>`};
function invList(){return invRows().map(r=>`<div class="row"><div class="gr1"><b>${esc(r.p.n)} ${esc(r.p.g||'')}</b><small>${r.l?_('Lot')+' '+esc(r.l.no)+(r.l.exp?' · '+fdate(pd(r.l.exp)):'')+' · ':''}${_('Dans l\'appli')} : ${fq(r.exp)}${r.p.bu?' '+esc(r.p.bu):''}</small></div><input class="in" style="width:92px;text-align:right" inputmode="decimal" data-k="${r.k}" value="${esc(INV.cnt[r.k]==null?'':INV.cnt[r.k])}" placeholder="${_('Compté')}" oninput="INV.cnt[this.dataset.k]=this.value"></div>`).join('')||`<p class="hint">${_('Aucun produit.')}</p>`}
function invApply(){
 const rows=invRows().filter(r=>INV.cnt[r.k]!==undefined&&INV.cnt[r.k]!==''&&!isNaN(dec(INV.cnt[r.k])));
 const dif=rows.map(r=>({r,q:dec(INV.cnt[r.k]),d:rq(dec(INV.cnt[r.k])-r.exp)})).filter(x=>x.d!==0);
 if(!rows.length)return toast(_('Aucune quantité comptée'));
 const val=dif.reduce((a,x)=>a+x.d*x.r.p.c,0);
 M(`<h2>${_('Écarts trouvés')}</h2>${dif.length?dif.map(x=>rowh(esc(x.r.p.n)+(x.r.l?' ('+esc(x.r.l.no)+')':''),(x.d>0?'+':'')+fq(x.d),_('Dans l\'appli')+' '+fq(x.r.exp)+' → '+_('compté')+' '+fq(x.q),x.d<0?'neg':'pos')).join('')+(seeCost()?kv(_('Valeur des écarts'),f(val),val<0?'neg':'pos'):''):`<p>${_('Aucun écart : le stock est exact. Bravo !')}</p>`}
<label>${_('Motif des écarts')}</label><select class="in" id="iw">${['count','casse','vol','perime','don','autre'].map(k=>`<option value="${k}">${_(WHY[k])}</option>`).join('')}</select>${acts(_('Appliquer'),'invOk()',_('Retour'))}`);
 INV.dif=dif}
function invOk(){
 const why=$('#iw').value,touched=new Set();
 (INV.dif||[]).forEach(x=>{const p=x.r.p;
  if(x.r.l)x.r.l.q=x.q;else p.q=x.q;touched.add(p);
  S.adj.push({id:uid(),t:Date.now(),by:CU,pid:p.id,d:x.d,why,c:p.c,note:'inventaire'+(x.r.l?' lot '+x.r.l.no:'')})});
 touched.forEach(p=>{if(p.lt){p.lots=p.lots.filter(z=>Math.abs(z.q)>1e-9);p.q=lotQ(p)}});
 INV={q:'',cnt:{}};save(true);M();toast(_('Inventaire enregistré ✓'));go('s')}
// ---- prix en bloc
let BK={scope:'all',cat:'',op:'p+',val:'',rnd:0,pr:1,pg:0,sel:{}};
function bkRead(){if(!$('#bv'))return;BK.scope=$('#bs').value;BK.cat=$('#bc')?$('#bc').value:BK.cat;BK.op=$('#bo').value;BK.val=$('#bv').value;BK.rnd=+$('#br').value;BK.pr=$('#bpr').checked?1:0;BK.pg=$('#bpg').checked?1:0}
function bkNew(p,old){const v=dec(BK.val);if(isNaN(v)||old<=0&&BK.op[0]=='p')return old;let n=BK.op=='p+'?old*(1+v/100):BK.op=='p-'?old*(1-v/100):BK.op=='g+'?old+v:old-v;if(BK.rnd>0)n=Math.round(n/BK.rnd)*BK.rnd;return Math.max(0,Math.round(n))}
function bkList(){return S.p.filter(p=>!p.off&&(BK.scope=='all'||(BK.scope=='cat'&&p.cat==BK.cat)||(BK.scope=='sel'&&BK.sel[p.id])))}
function bkChanges(){const ch=[];bkList().forEach(p=>{
 const add=(k,u,old,fac)=>{if(!(old>0))return;const base=BK.op[0]=='g'?old:old;let n;
  if(BK.op[0]=='g'){const v=dec(BK.val);if(isNaN(v))return;n=Math.max(0,Math.round((BK.op=='g+'?old+v*fac:old-v*fac)/(BK.rnd||1))*(BK.rnd||1))}else n=bkNew(p,old);
  if(n!==old)ch.push({id:p.id,u,k,old,n})};
 if(BK.pr){add('pr',-1,p.pr,1);p.us.forEach((u,i)=>add('pr',i,u.pr,u.f))}
 if(BK.pg){add('pg',-1,p.pg,1);p.us.forEach((u,i)=>add('pg',i,u.pg,u.f))}});return ch}
SUB.bulk=()=>{
 const cats=[...new Set(S.p.filter(p=>!p.off).map(p=>p.cat).filter(Boolean))];
 return `${backBtn('go(\'s\')')}<h3>％ ${_('Changer les prix en bloc')}</h3>
<div class="card pl"><label>${_('Quels produits ?')}</label><select class="in" id="bs" onchange="bkRead();R()"><option value="all"${BK.scope=='all'?' selected':''}>${_('Tous les produits')}</option><option value="cat"${BK.scope=='cat'?' selected':''}>${_('Une catégorie')}</option><option value="sel"${BK.scope=='sel'?' selected':''}>${_('Je choisis les produits')}</option></select>
${BK.scope=='cat'?`<select class="in" id="bc" onchange="bkRead();bkPrev()">${cats.map(c=>`<option${BK.cat==c?' selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
${BK.scope=='sel'?`<div class="sc" style="max-height:180px;overflow:auto">${S.p.filter(p=>!p.off).map(p=>`<label class="tg"><input type="checkbox" ${BK.sel[p.id]?'checked':''} onchange="BK.sel[${p.id}]=this.checked;bkPrev()"><span>${esc(p.n)}</span></label>`).join('')}</div>`:''}
<label>${_('Changement')}</label><div class="two"><select class="in" id="bo" onchange="bkRead();bkPrev()">${[['p+','Augmenter de (%)'],['p-','Baisser de (%)'],['g+','Ajouter (GNF)'],['g-','Retirer (GNF)']].map(([k,l])=>`<option value="${k}"${BK.op==k?' selected':''}>${_(l)}</option>`).join('')}</select><input class="in" id="bv" inputmode="decimal" placeholder="5" value="${esc(BK.val)}" oninput="bkRead();bkPrev()"></div>
<label>${_('Arrondir à')}</label><select class="in" id="br" onchange="bkRead();bkPrev()">${[0,100,500,1000].map(k=>`<option value="${k}"${BK.rnd==k?' selected':''}>${k?k+' GNF':_('Pas d\'arrondi')}</option>`).join('')}</select>
<label class="tg"><input type="checkbox" id="bpr" ${BK.pr?'checked':''} onchange="bkRead();bkPrev()"><span>${_('Prix de vente (détail)')}</span></label><label class="tg"><input type="checkbox" id="bpg" ${BK.pg?'checked':''} onchange="bkRead();bkPrev()"><span>${_('Prix de gros')}</span></label></div>
<div id="bpv">${bkPrevHTML()}</div>`};
function bkPrev(){const e=$('#bpv');if(e)e.innerHTML=bkPrevHTML()}
function bkPrevHTML(){
 const ch=BK.val===''?[]:bkChanges(),last=S.pl[S.pl.length-1];
 return (ch.length?`<div class="card pl"><b>${ch.length} ${_('prix vont changer')}</b>${ch.slice(0,12).map(c=>{const p=P(c.id);return rowh(esc(p.n)+(c.u>=0?' ('+esc(p.us[c.u].n)+')':'')+(c.k=='pg'?' — '+_('gros'):''),f(c.old)+' → '+f(c.n),c.k=='pr'&&c.u<0&&c.n<p.c&&seeCost()?'⚠ '+_('sous le prix d\'achat'):'')}).join('')}${ch.length>12?`<small class="sm2">… +${ch.length-12}</small>`:''}</div><div class="top"><button class="b gr" onclick="bkApply()">${_('Appliquer ces prix')}</button></div>`:(BK.val!==''?`<p class="hint">${_('Aucun prix ne change avec ces réglages.')}</p>`:''))
 +(last?`<div class="top"><button class="b ol" onclick="bkUndo()">↩ ${_('Annuler le dernier changement de prix')} (${fdt(last.t)})</button></div>`:'')}
function bkApply(){bkRead();const ch=bkChanges();if(!ch.length)return;
 sure(_('Changer {n} prix ?',{n:ch.length}),()=>{ch.forEach(c=>{const p=P(c.id);if(c.u<0)p[c.k]=c.n;else p.us[c.u][c.k]=c.n});S.pl.push({id:uid(),t:Date.now(),by:CU,ch});if(S.pl.length>10)S.pl.shift();BK.val='';save(true);toast(_('Prix modifiés ✓'));R()},_('Appliquer'))}
function bkUndo(){const l=S.pl[S.pl.length-1];if(!l)return;sure(_('Remettre les anciens prix ?'),()=>{l.ch.forEach(c=>{const p=P(c.id);if(!p)return;if(c.u<0)p[c.k]=c.old;else if(p.us[c.u])p.us[c.u][c.k]=c.old});S.pl.pop();save(true);toast(_('Anciens prix remis ✓'));R()},_('Remettre'))}
SCR.s=T;
