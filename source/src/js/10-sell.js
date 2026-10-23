// ---- unités, stock par lots, vente, paiement, reçus
const unit=(p,i)=>i<0||!p.us[i]?{i:-1,n:p.bu||'',f:1,pr:p.pr,pg:p.pg||0}:{i,n:p.us[i].n,f:p.us[i].f,pr:p.us[i].pr,pg:p.us[i].pg||0};
const uprice=(p,i,tier)=>{const u=unit(p,i);return(tier=='g'&&u.pg>0)?u.pg:u.pr};
const lotOk=l=>!l.exp||pd(l.exp)>=D0(Date.now());
const lotQ=p=>rq(p.lots.reduce((a,l)=>a+l.q,0));
const avail=p=>p.lt?rq(p.lots.filter(lotOk).reduce((a,l)=>a+l.q,0)):p.q;
function takeStock(p,bq){
 if(!p.lt){p.q=rq(p.q-bq);return[]}
 const al=[];let need=bq;
 const ls=p.lots.filter(lotOk).sort((a,b)=>(a.exp||'9999')<(b.exp||'9999')?-1:1);
 for(const l of ls){if(need<=0)break;const t=Math.min(Math.max(l.q,0),need);if(t>0){l.q=rq(l.q-t);need=rq(need-t);al.push({no:l.no,exp:l.exp,q:t})}}
 if(need>0){let l=ls[0];if(!l){l=p.lots.find(x=>x.no=='-'&&!x.exp);if(!l){l={no:'-',exp:'',q:0};p.lots.push(l)}}l.q=rq(l.q-need);al.push({no:l.no,exp:l.exp,q:need})}
 p.lots=p.lots.filter(l=>Math.abs(l.q)>1e-9);p.q=lotQ(p);return al}
function giveStock(p,bq,al){
 if(!p.lt){p.q=rq(p.q+bq);return}
 let rest=bq;const parts=[];
 (al||[]).forEach(a=>{const t=Math.min(rest,a.q);if(t>0){parts.push({no:a.no,exp:a.exp||'',q:t});rest=rq(rest-t)}});
 if(rest>0)parts.push({no:'-',exp:'',q:rest});
 parts.forEach(a=>{let l=p.lots.find(x=>x.no==a.no&&(x.exp||'')==(a.exp||''));if(!l){l={no:a.no,exp:a.exp||'',q:0};p.lots.push(l)}l.q=rq(l.q+a.q)});
 p.lots=p.lots.filter(l=>Math.abs(l.q)>1e-9);p.q=lotQ(p)}
function stockTxt(p,q){q=q==null?p.q:q;let s=fq(q)+(p.bu?' '+p.bu:'');const u=unit(p,p.du);if(u.f>1)s+=' ≈ '+fq(q/u.f)+' '+u.n;return s}
const isLow=p=>!p.off&&avail(p)<=p.m;
const hasGros=()=>S.p.some(p=>!p.off&&(p.pg>0||(p.us||[]).some(u=>u.pg>0)));
// ---- panier
let cart=[],tier='r',vq0='',vcat0='';
const lp=l=>{const p=P(l.id);return l.pr!=null?l.pr:uprice(p,l.u,tier)};
const lt=l=>Math.round(l.q*lp(l));
const ctotal=()=>cart.reduce((a,l)=>a+lt(l),0);
const baseQ=id=>rq(cart.filter(l=>l.id==id).reduce((a,l)=>a+l.q*unit(P(l.id),l.u).f,0));
function V(){
 const cats=[...new Set(S.p.filter(p=>!p.off&&p.cat).map(p=>p.cat))].sort();
 const fav=S.p.some(p=>!p.off&&p.fav);
 return `<div class="srch"><input class="in" id="sq" placeholder="${_('Rechercher ou scanner un code…')}" value="${esc(vq0)}" oninput="vq(this.value)" onkeydown="vkey(event)" autocomplete="off" enterkeyhint="search"><button class="b ol sm" id="scb" onclick="scanFor('sell')" style="display:${typeof camOK=='function'&&camOK()?'':'none'}">📷</button></div>
${(cats.length||fav)?`<div class="chips">${chip(_('Tout'),!vcat0,"vcat('')")}${fav?chip('★ '+_('Favoris'),vcat0=='*',"vcat('*')"):''}${cats.map(c=>`<button class="chip${vcat0==c?' on':''}" data-c="${esc(c)}" onclick="vcat(this.dataset.c)">${esc(c)}</button>`).join('')}</div>`:''}
${hasGros()?`<div class="seg"><button class="${tier=='r'?'on':''}" onclick="vtier('r')">${_('Détail')}</button><button class="${tier=='g'?'on':''}" onclick="vtier('g')">${_('Gros')}</button></div>`:''}
<div class="chips" id="hold">${holdChips()}</div><div class="g" id="grid">${vgrid()}</div><div id="cbar">${cartBar()}</div>`}
// les produits les plus vendus (30 derniers jours, sans aujourd'hui) passent en premier : l'ordre reste stable pendant la journée
let POPK='',POPM={};
function popMap(){
 const k=ymd(Date.now())+'|'+S.s.length+'|'+S.p.length;
 if(k==POPK)return POPM;
 const t0=D0(Date.now()),cut=t0-30*DAY,m={};
 for(let i=S.s.length-1;i>=0;i--){const s=S.s[i];if(s.t<cut-7*DAY)break;if(s.v||s.t>=t0||s.t<cut)continue;for(const it of s.items)m[it.id]=(m[it.id]||0)+1}
 POPK=k;POPM=m;return m}
function tileH(p){
 const inCart=baseQ(p.id),av=rq(avail(p)-inCart),u=unit(p,p.du),pr=uprice(p,p.du,tier);
 const bd=[];if(S.set.mods.ph){if(p.rx)bd.push('<span class="bd">Rx</span>');const e=expInfo(p);if(e.exp)bd.push('<span class="bd">'+_('Périmé')+'</span>');else if(e.soon)bd.push('<span class="bd y">'+_('Bientôt périmé')+'</span>')}
 return `<button class="t${av<=0?' o':''}${inCart?' inc':''}" data-id="${p.id}" onpointerdown="vdown(${p.id})" onpointerup="vup()" onpointerleave="vup()" onpointercancel="vup()" oncontextmenu="return false" onclick="vtap(${p.id})">${p.fav?'<span class="st">★</span>':''}<b>${esc(p.n)}</b>${[p.g,p.col].filter(Boolean).length?`<small>${esc([p.g,p.col].filter(Boolean).join(', '))}</small>`:''}<span>${f(pr)}${u.f>1?' / '+esc(u.n):''}</span><small>${fq(av)}${p.bu?' '+esc(p.bu):''} ${_('en stock')}</small>${bd.join('')}${inCart?`<small class="n">${fq(cart.filter(l=>l.id==p.id).reduce((a,l)=>a+l.q,0))} ${_('au panier')}</small>`:''}</button>`}
function vgrid(){
 const nq=nz(vq0);let L=S.p.filter(p=>!p.off);
 if(vcat0=='*')L=L.filter(p=>p.fav);else if(vcat0)L=L.filter(p=>p.cat==vcat0);
 if(nq)L=L.filter(p=>nz([p.n,p.g,p.bc,p.dci,p.cat,p.col].join(' ')).includes(nq));
 const pm=popMap();
 L=L.slice().sort((a,b)=>(b.fav?1:0)-(a.fav?1:0)||(pm[b.id]||0)-(pm[a.id]||0)||COL.compare(a.n,b.n));
 if(!L.length){let eq='';
  if(nq&&S.set.mods.ph){const ds=[...new Set(S.p.filter(p=>!p.off&&p.dci&&nz(p.dci).includes(nq)).map(p=>p.id))];eq=ds.length?`<p class="hint">${_('Même substance :')} ${ds.map(id=>esc(P(id).n)).join(', ')}</p>`:''}
  return `<p class="hint" style="grid-column:1/3">${S.p.length?_('Aucun produit trouvé.'):_('Aucun produit. Ajoutez-en dans l\'onglet Stock.')}</p>${eq}`}
 return L.map(tileH).join('')}
function cartBar(){
 if(!cart.length)return lsBar();
 return `<div class="cart"><div class="chips">${cart.map((l,i)=>{const p=P(l.id),u=unit(p,l.u);return `<button class="chip" onclick="cdec(${i})">${esc(p.n)} ×${fq(l.q)}${u.f!=1||l.u>=0?' '+esc(u.n):''} −</button>`}).join('')}<button class="chip" onclick="cedit()">✎ ${_('Modifier')}</button><button class="chip" onclick="holdPut()">${_('Mettre en attente')}</button><button class="chip" onclick="cclear()">${_('Vider')}</button></div><div class="tot">${f(ctotal())}</div><div class="pay"><button class="b gr" onclick="pay('e')">${_('Espèces')}</button><button class="b yl" onclick="pay('m')">Mobile Money</button><button class="b ol" onclick="pay('c')">${_('À crédit')}</button></div></div>`}
function vupd(){const g=$('#grid');if(g)g.innerHTML=vgrid();const c=$('#cbar');if(c)c.innerHTML=cartBar();const h=$('#hold');if(h)h.innerHTML=holdChips()}
// un seul produit touché : on ne refait que sa case et la barre du panier
function vupd1(id){
 const p=P(id),e=document.querySelector('#grid .t[data-id="'+id+'"]');
 if(!p||!e)return vupd();
 const t=document.createElement('div');t.innerHTML=tileH(p);e.replaceWith(t.firstChild);
 const c=$('#cbar');if(c)c.innerHTML=cartBar()}
function vq(v){vq0=v;vupd()}
function vcat(c){vcat0=c;R()}
function vtier(t){tier=t;R()}
function vkey(e){
 if(e.key!='Enter')return;
 const v=vq0.trim();if(!v)return;
 let p=S.p.find(x=>!x.off&&x.bc&&x.bc==v);
 if(!p){const nq=nz(v);const L=S.p.filter(x=>!x.off&&nz([x.n,x.g,x.bc,x.dci].join(' ')).includes(nq));if(L.length==1)p=L[0]}
 if(!p){toast(_('Aucun produit pour « {q} »',{q:v}));return}
 vq0='';$('#sq').value='';vadd(p.id);const s=$('#sq');if(s)s.focus()}
// appui long sur un produit = choisir la quantité ; appui court = ajouter 1
const LP={t:0,fired:false};
function vdown(id){LP.fired=false;clearTimeout(LP.t);LP.t=setTimeout(()=>{LP.t=0;LP.fired=true;qtyUI(id)},520)}
function vup(){clearTimeout(LP.t);LP.t=0}
function vtap(id){if(LP.fired){LP.fired=false;return}vadd(id)}
function vadd(id,u,force,step){
 const p=P(id);if(!p)return;if(u==null)u=p.du;step=step||1;
 const un=unit(p,u);
 const go1=()=>{const l=cart.find(x=>x.id==id&&x.u==u);if(l)l.q=rq(l.q+step);else cart.push({id,u,q:step,pr:null});vupd1(id);if(typeof beep=='function')beep()};
 const need=rq(baseQ(id)+un.f*step);
 if(need>avail(p)&&!force&&!cart.some(x=>x.id==id&&x.ok)){
  return sure(_('Stock insuffisant pour {n} : il reste {q}. Ajouter quand même ?',{n:esc(p.n),q:fq(avail(p)-baseQ(id))}),()=>{go1();cart.forEach(x=>{if(x.id==id)x.ok=1});vupd()},_('Ajouter'))}
 go1()}
// ---- clavier de quantité
let QY=null;
const KP=(fn,last)=>{const b=k=>`<button onclick="${fn}('${k}')">${k}</button>`;return `<div class="kp">${['7','8','9'].map(b).join('')}<button onclick="${fn}('b')" aria-label="${_('Effacer')}">⌫</button>${['4','5','6'].map(b).join('')}${last?b(last):'<span></span>'}${['1','2','3','0'].map(b).join('')}</div>`};
function qtyUI(id){
 const p=P(id);if(!p)return;
 QY={id,u:p.du,g:''};
 const us=[unit(p,-1)].concat((p.us||[]).map((x,k)=>unit(p,k)));
 M(`<h2>${esc(p.n)}</h2><label>${_('Quantité')}</label><div class="gv" id="qgv"><span id="qgt"></span></div>${us.length>1?`<div class="chips" id="qun" style="padding:6px 0 0">${us.map(u=>`<button class="chip${u.i==QY.u?' on':''}" data-i="${u.i}" onclick="qtyU(${u.i})">${esc(u.n||_('unité'))}</button>`).join('')}</div>`:''}${KP('qtyK',p.dec?',':'')}
<div class="pay2"><button class="b ol" onclick="M()">${_('Annuler')}</button><button class="b gr" onclick="qtyOk()">${_('Ajouter au panier')}</button></div>`);
 qtyShow()}
function qtyShow(){const e=$('#qgt');if(e)e.innerHTML=QY.g===''?'<span class="ph">1</span>':esc(QY.g)}
function qtyK(k){
 let g=QY.g;
 if(k=='b')g=g.slice(0,-1);
 else if(k==','){if(g.includes(','))return;g=(g===''?'0':g)+','}
 else{g=(g+k).replace(/^0+(?=\d)/,'');if(g.replace(',','').length>6)return}
 QY.g=g;qtyShow()}
function qtyU(i){QY.u=i;$$('#qun .chip').forEach(b=>b.classList.toggle('on',+b.dataset.i==i))}
function qtyOk(){
 const q=QY.g===''?1:dec(QY.g),p=P(QY.id);
 if(!(q>0)||!p)return toast(_('Quantité invalide'));
 const id=QY.id,u=QY.u;M();vadd(id,u,false,p.dec?q:Math.max(1,Math.round(q)))}
// ---- ventes en attente : on met le panier de côté pour servir un autre client
const holdTot=h=>h.lines.reduce((a,l)=>{const p=P(l.id);return p?a+Math.round(l.q*(l.pr!=null?l.pr:uprice(p,l.u,h.tier||'r'))):a},0);
const holdLines=()=>cart.map(l=>({id:l.id,u:l.u,q:l.q,pr:l.pr}));
function holdChips(){return S.hold.map(h=>`<button class="chip" onclick="holdGet('${h.id}')">${_('En attente')} ${hm(h.t)} · ${h.lines.length} ${_('art.')} · ${fm(holdTot(h))}</button>`).join('')}
function holdPut(){
 if(!cart.length)return;
 S.hold.push({id:uid(),t:Date.now(),tier,lines:holdLines()});
 cart=[];save();vupd();toast(_('Vente mise en attente. Touchez-la en haut pour la reprendre.'),3200)}
function holdGet(id){
 const i=S.hold.findIndex(h=>h.id==id);if(i<0)return;
 const h=S.hold.splice(i,1)[0];
 if(cart.length)S.hold.push({id:uid(),t:Date.now(),tier,lines:holdLines()});
 cart=h.lines.filter(l=>{const p=P(l.id);return p&&!p.off}).map(l=>({id:l.id,u:l.u,q:l.q,pr:l.pr}));tier=h.tier||'r';
 save();R()}
function cdec(i){const l=cart[i];l.q=rq(l.q-1);if(l.q<=0)cart.splice(i,1);vupd();if($('#m').innerHTML)cedit()}
function cclear(){cart=[];vupd()}
function cwarn(l){
 const p=P(l.id),cost=Math.round(p.c*unit(p,l.u).f);
 return (l.pr!=null&&l.pr!=uprice(p,l.u,tier)?`<small class="sm2">${_('Prix du tarif')} ${f(uprice(p,l.u,tier))} — ${_('prix négocié')}</small>`:'')+(seeCost()&&lp(l)<cost?`<small class="neg">⚠ ${_('Sous le prix d\'achat')} (${f(cost)})</small>`:'')}
function cline(l,i){
 const p=P(l.id),us=[unit(p,-1)].concat((p.us||[]).map((x,k)=>unit(p,k))),u=unit(p,l.u);
 return `<div class="card pl" style="margin:8px 0"><div class="row" style="border:0;padding:0"><div class="gr1"><b>${esc(p.n)}</b><small>${esc([p.g,p.col].filter(Boolean).join(', '))}</small></div><button class="b xs ol" onclick="crm(${i})">✕</button></div>
<div class="tri"><div><label>${_('Quantité')}</label><input class="in" id="cqi${i}" inputmode="decimal" value="${fq(l.q)}" onchange="cq(${i},this.value)"></div>
<div><label>${_('Format')}</label>${us.length>1?`<select class="in" onchange="cu(${i},this.value)">${us.map(x=>`<option value="${x.i}"${x.i==l.u?' selected':''}>${esc(x.n||_('unité'))}</option>`).join('')}</select>`:`<input class="in" value="${esc(u.n||_('unité'))}" disabled>`}</div>
<div><label>${_('Prix unitaire')}</label><input class="in nm" id="cpi${i}" inputmode="numeric" value="${fm(lp(l))}" onchange="cp1(${i},this.value)"></div></div>
<div id="cwr${i}">${cwarn(l)}</div><div class="kv"><span>${_('Total')}</span><b id="clt${i}">${f(lt(l))}</b></div></div>`}
function cedit(){
 if(!cart.length)return M();
 M(`<h2>${_('Modifier le panier')}</h2>${cart.map(cline).join('')}<div class="row"><div class="gr1">${_('Total du panier')}</div><div class="tot s" id="ctt">${f(ctotal())}</div></div><div class="pay2 o"><button class="b gr" onclick="M();R()">${_('OK')}</button></div>`)}
// mise à jour sans refaire la fenêtre (sinon le toucher suivant est perdu)
function cupd(i){
 const l=cart[i];if(!l)return;
 const a=$('#clt'+i),w=$('#cwr'+i),t=$('#ctt');
 if(a)a.textContent=f(lt(l));if(w)w.innerHTML=cwarn(l);if(t)t.textContent=f(ctotal());
 vupd()}
function cq(i,v){const l=cart[i],p=P(l.id);let q=dec(v);if(!(q>0)){const e=$('#cqi'+i);if(e)e.value=rq(l.q);return}if(!p.dec)q=Math.max(1,Math.round(q));l.q=rq(q);const e=$('#cqi'+i);if(e)e.value=rq(l.q);cupd(i)}
function cu(i,v){const l=cart[i];l.u=+v;l.pr=null;const e=$('#cpi'+i);if(e)e.value=fm(lp(l));cupd(i)}
function cp1(i,v){const l=cart[i],p=P(l.id),n=num(v);l.pr=(isNaN(n)||n==uprice(p,l.u,tier))?null:n;const e=$('#cpi'+i);if(e)e.value=fm(lp(l));cupd(i)}
function crm(i){cart.splice(i,1);cedit();vupd()}
// ---- paiement : le vendeur dit combien le client donne ; la monnaie ou le reste se calcule tout de suite
let PY=null,LS=null;
const roundT=x=>S.set.round>0?Math.floor(x/S.set.round)*S.set.round:x;
function discOf(sub){const a=$('#dv'),b=$('#dm');if(!a||!b)return 0;const v=dec(a.value)||0;const d=b.value=='p'?Math.round(sub*v/100):Math.round(v);return Math.max(0,Math.min(d,sub))}
const DEST=[['c',X('À crédit')],['om','Orange Money'],['mtn','MTN MoMo'],['ot',X('Autre')]];
const destName=k=>{const d=DEST.find(x=>x[0]==k);return d?_(d[1]):''};
// billets proposés au-dessus du total (le client donne souvent un billet plus gros)
function paySug(T){
 const c=[],up=s=>{const v=Math.ceil(T/s)*s;if(v>T)c.push(v)};
 [5000,10000,20000,50000,100000].forEach(up);
 [100000,500000].forEach(s=>c.push((Math.floor(T/s)+1)*s));
 return[...new Set(c)].sort((a,b)=>a-b).slice(0,3)}
const cLast=c=>(c.h&&c.h.length?c.h[c.h.length-1].t:0)||c.t0||0;
const recentCl=()=>S.cl.slice().sort((a,b)=>cLast(b)-cLast(a)).slice(0,6);
function pay(m0){
 if(!cart.length)return;
 if(S.set.reqOpen&&!S.cs[CU])return sure(_('La caisse est fermée. L\'ouvrir maintenant ?'),()=>{go('k')},_('Ouvrir la caisse'));
 const op=S.set.op||'om';
 PY={m0,man:0,g:'',kp:m0=='e',cash:m0=='e',dest:m0=='c'?'c':m0=='m'?op:(S.set.rdest||'c'),op,idp:'',A:null};
 payUI()}
function payUI(){
 const rx=S.set.mods.ph&&cart.some(l=>P(l.id).rx),n=cart.length;
 const lines=cart.map(l=>{const p=P(l.id),u=unit(p,l.u);return rowh(`${fq(l.q)}${u.f!=1||l.u>=0?' '+esc(u.n):''} × ${esc(p.n)}`,f(lt(l)),l.pr!=null?_('Prix négocié')+' '+f(l.pr):'')}).join('');
 M(`<h2>${_('Encaisser')}</h2>
<details class="dt"><summary>${_('{n} article(s)',{n})}</summary>${lines}</details>
<div class="row" style="border:0;padding:4px 0 0"><div class="gr1">${_('Total à payer')}<small id="pdn"></small><button class="lnk sm" id="pdl" onclick="payDisc()">＋ ${_('Remise')}</button></div><div class="tot" id="tt"></div></div>
<div id="pdisc" style="display:none"><div class="two"><input class="in nm" id="dv" inputmode="decimal" placeholder="0" oninput="payCalc()"><select class="in" id="dm" onchange="payCalc()"><option value="p">%</option><option value="g">GNF</option></select></div></div>
<div id="pauto"><div id="pcb"><label id="pgl"></label>
<div class="gv" id="pgv" onclick="payKp(!PY.kp)"><span id="pgt"></span></div>
<div class="chips" id="psug" style="padding:6px 0 0"></div>
<div id="pchg"></div></div>
<button class="lnk" id="pcl2" onclick="payCash()">＋ ${_('Le client donne aussi des espèces')}</button>
<label id="pdl2"></label>
<div class="chips" id="pdst" style="padding:2px 0 0">${DEST.map(([k,l])=>`<button class="chip" data-k="${k}" onclick="payD('${k}')">${_(l)}</button>`).join('')}</div></div>
<div id="pman" style="display:none">
<div class="eq"><div><label>💵 ${_('Espèces')}</label><input class="in nm" id="pe" inputmode="numeric" oninput="payCalc()"></div><div><label>📱 Mobile Money</label><input class="in nm" id="pm" inputmode="numeric" oninput="payCalc()"></div></div>
<label>🧾 ${_('À crédit (dette du client)')}</label><input class="in nm" id="pc" inputmode="numeric" oninput="payCalc()">
<div id="pmcash" style="display:none"><label>${_('Montant donné par le client')}</label><input class="in nm" id="pt" inputmode="numeric" oninput="payCalc()"><div class="row"><div class="gr1">${_('Monnaie à rendre')}</div><b id="pch">0</b></div></div>
<div id="prest" class="sm2"></div>
<button class="lnk" onclick="payMan(0)">↩ ${_('Revenir au calcul automatique')}</button></div>
<div id="pmob" style="display:none">
<div class="chips" id="pmop" style="padding:4px 0;display:none">${[['om','Orange Money'],['mtn','MTN MoMo'],['ot',_('Autre')]].map(([k,l])=>`<button class="chip" data-k="${k}" onclick="payOp(this.dataset.k)">${l}</button>`).join('')}</div>
<label>${_('Numéro de transaction du SMS (facultatif)')}</label><input class="in" id="rf" autocomplete="off" oninput="paySms()">
<label>${_('Coller le SMS reçu pour le contrôler (facultatif)')}</label><textarea class="in" id="psm" rows="2" oninput="paySms()"></textarea><div id="psr" class="sm2"></div></div>
<div id="pcre" style="display:none"><label>${_('Nom du client')}</label>
<div class="chips" id="pcl" style="padding:2px 0 4px">${recentCl().map(c=>`<button class="chip" data-id="${esc(c.id)}" onclick="payPick(this.dataset.id)">${esc(c.n)}${c.a>0?' · '+fm(c.a):''}</button>`).join('')}</div>
<input class="in" id="cn" list="cll" autocomplete="off" enterkeyhint="done" oninput="payCl()" onkeydown="if(event.key=='Enter')this.blur()"><datalist id="cll">${S.cl.map(c=>`<option value="${esc(c.n)}">`).join('')}</datalist><div id="cinf" class="sm2"></div>
<details id="pcd" open><summary>${_('Détails du crédit (téléphone, échéance, pièce d\'identité)')}</summary>
<div class="eq"><div><label>${_('Téléphone')}</label><input class="in" id="cp" inputmode="tel"></div><div><label>${_('Échéance')}</label><select class="in" id="cd" onchange="$('#cdd').style.display=this.value=='x'?'':'none'"><option value="${S.set.dueDays}">${_('Dans {n} jours',{n:S.set.dueDays})}</option><option value="7">${_('Dans 7 jours')}</option><option value="30">${_('Dans 30 jours')}</option><option value="0">${_('Pas de date')}</option><option value="x">${_('Autre date…')}</option></select></div></div>
<input class="in" id="cdd" type="date" style="display:none">
<label>${_('N° de carte d\'identité ou de passeport')}</label><input class="in" id="ci"><label>${_('Photo de la pièce (facultatif)')}</label><input class="in" id="cf" type="file" accept="image/*" capture="environment" onchange="photo(this)">
<label class="tg"><input type="checkbox" id="cc"><span>${_('Le client accepte l\'enregistrement de sa pièce d\'identité.')}</span></label></details></div>
${rx?`<label>${_('Ordonnance (n° ou nom du médecin, facultatif)')}</label><input class="in" id="rxn">`:''}
<button class="lnk" id="pml" onclick="payMan(1)">${_('Répartir autrement')}</button>
<div class="kpf" id="pkw">${KP('payK','000')}</div>
<div class="pay2"><button class="b ol" onclick="M()">${_('Retour')}</button><button class="b gr" id="pok" onclick="payOk()">${_('Valider la vente')}</button></div>`);
 payCalc()}
function payDisc(){const d=$('#pdisc');d.style.display=d.style.display=='none'?'':'none'}
// montants de la vente : total, ce que le client donne, monnaie, et où va le reste
function payNums(){
 const sub=ctotal(),T=roundT(sub-discOf(sub));
 const A={sub,d:sub-T,T,e:0,mo:0,c:0,op:PY.op,tend:0,chg:0,r:0,un:0,g:0};
 if(PY.man){
  A.e=num($('#pe').value)||0;A.mo=num($('#pm').value)||0;A.c=num($('#pc').value)||0;
  A.un=T-A.e-A.mo-A.c;
  const td=num($('#pt').value)||0;if(A.e>0&&td>A.e){A.tend=td;A.chg=td-A.e}
  return A}
 const g=PY.g===''?(PY.m0=='e'?T:0):(num(PY.g)||0);
 A.g=g;
 if(g>=T){A.e=T;if(g>T){A.tend=g;A.chg=g-T}}
 else{A.e=g;A.r=T-g;if(PY.dest=='c')A.c=A.r;else{A.mo=A.r;A.op=PY.dest}}
 return A}
function payCalc(){
 const A=payNums();PY.A=A;const man=PY.man;
 $('#tt').textContent=f(A.T);
 $('#pdn').textContent=A.d>0?_('Remise')+' −'+fm(A.d):'';
 $('#pauto').style.display=man?'none':'';$('#pman').style.display=man?'':'none';$('#pml').style.display=man?'none':'';if(man)$('#pkw').style.display='none';
 if(!man){
  const blank=PY.g==='';
  $('#pcb').style.display=PY.cash?'':'none';$('#pcl2').style.display=PY.cash?'none':'';
  $('#pgl').textContent=_('Le client donne (espèces)');
  $('#pgt').innerHTML=blank?`<span class="ph">${PY.m0=='e'?fm(A.T):'0'}</span>`:fm(A.g);
  $('#pkw').style.display=PY.cash&&PY.kp?'':'none';
  $('#psug').innerHTML=(PY.m0=='e'?chip(_('Exact'),blank,"payG('')"):chip(_('Exact'),!blank&&A.g==A.T,'payG('+A.T+')'))+paySug(A.T).map(v=>chip(fm(v),!blank&&A.g==v,'payG('+v+')')).join('');
  $('#pchg').innerHTML=A.chg>0?`<div class="bn g chg"><span>${_('Monnaie à rendre')}</span><b>${f(A.chg)}</b></div>`:(A.r>0?`<div class="bn y chg"><span>${_('Reste à payer')} : <b>${f(A.r)}</b></span><b>→ ${esc(destName(PY.dest))}</b></div>`:'');
  $('#pdl2').textContent=PY.m0=='e'?_('Si le client donne moins, le reste va sur :'):_('À payer avec :');
  $$('#pdst .chip').forEach(b=>b.classList.toggle('on',b.dataset.k==PY.dest));
 }else{
  $('#pmcash').style.display=A.e>0?'':'none';
  const td=num($('#pt').value)||0;$('#pch').textContent=td>A.e?f(td-A.e):f(0);
  $('#prest').innerHTML=A.un==0?(A.c>0&&A.e+A.mo>0?`<div class="bn g">${_('Acompte reçu : {a}. Reste dû par le client : {b}.',{a:f(A.e+A.mo),b:f(A.c)})}</div>`:''):`<div class="bn ${A.un>0?'y':'r'}">${A.un>0?_('Reste à répartir : {n}',{n:f(A.un)}):_('Trop payé de {n}',{n:f(-A.un)})}${A.un>0?`<div class="chips" style="padding:6px 0 0"><button class="chip" onclick="payRest('pe')">→ ${_('Espèces')}</button><button class="chip" onclick="payRest('pm')">→ Mobile Money</button><button class="chip" onclick="payRest('pc')">→ ${_('Crédit')}</button></div>`:''}</div>`}
 $('#pmob').style.display=A.mo>0?'':'none';$('#pmop').style.display=man?'flex':'none';
 $$('#pmop .chip').forEach(b=>b.classList.toggle('on',b.dataset.k==PY.op));
 $('#pcre').style.display=A.c>0?'':'none';
 if(A.mo>0)paySms()}
function payK(k){
 let g=PY.g;
 if(k=='b')g=g.slice(0,-1);
 else{g=(g+k).replace(/^0+(?=\d)/,'');if(g.length>12)return}
 PY.g=g;payCalc()}
function payG(v){PY.g=String(v);payCalc()}
function payKp(on){PY.kp=!!on;payCalc()}
function payCash(){PY.cash=true;PY.kp=true;payCalc()}
function payD(k){PY.dest=k;if(k!='c')PY.op=k;if(PY.m0=='e'){S.set.rdest=k;save()}payCalc()}
function payOp(k){PY.op=k;payCalc()}
function payMan(on){
 if(on){const A=PY.A||payNums();PY.man=1;PY.op=A.op;
  $('#pe').value=A.e?fm(A.e):'';$('#pm').value=A.mo?fm(A.mo):'';$('#pc').value=A.c?fm(A.c):'';$('#pt').value=A.tend?fm(A.tend):''}
 else PY.man=0;
 payCalc()}
function payRest(id){const r=payNums().un;if(r<=0)return;const el=$('#'+id);el.value=fm((num(el.value)||0)+r);payCalc()}
function payCl(){
 const n=$('#cn').value.trim().toLowerCase(),c=S.cl.find(x=>x.n.toLowerCase()==n);const i=$('#cinf');
 if(c){$('#cp').value=c.tel||'';$('#ci').value=c.pi||'';
  i.textContent=(c.a>0?_('Dette actuelle : {n}',{n:f(c.a)}):_('Client connu, aucune dette'))+(c.lim?' · '+_('Plafond : {n}',{n:f(c.lim)}):'')+(c.ph?' · '+_('pièce déjà enregistrée'):'')}
 else i.textContent=''}
function payPick(id){const c=CLI(id);if(!c)return;$('#cn').value=c.n;payCl();$('#pcd').open=false}
function photo(i){const fl=i.files[0];if(!fl)return;const im=new Image();im.onload=()=>{const k=Math.min(1,520/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);PY.idp=c.toDataURL('image/jpeg',.6);toast(_('Photo prête ✓'))};im.src=URL.createObjectURL(fl)}
// clavier physique (ordinateur, clavier Bluetooth) : chiffres, effacer, entrée
document.addEventListener('keydown',e=>{
 if(!PY||PY.man)return;
 const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
 if($('#pgv')){if(/^\d$/.test(e.key))payK(e.key);else if(e.key=='Backspace'){e.preventDefault();payK('b')}else if(e.key=='Enter'&&(!t||t===document.body))payOk()}
 else if($('#qgv')&&QY){if(/^\d$/.test(e.key))qtyK(e.key);else if(e.key=='Backspace'){e.preventDefault();qtyK('b')}else if(e.key=='Enter'&&(!t||t===document.body))qtyOk()}});
// ---- contrôle d'un SMS Mobile Money collé : montant, numéro de transaction, numéro déjà utilisé
function smsParse(t){
 t=String(t||'');
 const out={amts:[],id:''};
 const re=/(\d[\d.,\u00a0\u202f ]*\d|\d)/g;let m;
 while((m=re.exec(t))){
  const a=m.index,b=a+m[1].length;
  const before=t.slice(Math.max(0,a-24),a).toLowerCase(),after=t.slice(b,b+8).toLowerCase();
  let s=m[1].replace(/[\u00a0\u202f ]/g,'');
  const dm=/^(.*\d)[.,]\d{2}$/.exec(s);if(dm)s=dm[1]; // 50 000,00 -> 50 000 (centimes enlevés)
  const v=parseInt(s.replace(/[.,]/g,''),10);
  if(isNaN(v)||v<100)continue;
  const cur=/^\s*(gnf|fg|gf|f\b|francs?)/.test(after)||/(gnf|fg|gf)\s*[:\-]?\s*$/.test(before);
  const nope=/(solde|balance|frais|fees?|commission|taxe|tax)\W*(gnf|fg)?\W*$/.test(before);
  if(cur&&!nope)out.amts.push(v)}
 const id=/(?:transaction|trans\.?|txn|r[ée]f(?:[ée]rence)?|\bid\b|n°)[\s:#=\-]*(?:(?:id|ref|n°|no|number|num[ée]ro)[\s:#=\-]*)?((?=[A-Za-z0-9._\-]*\d)[A-Za-z0-9][A-Za-z0-9._\-]{5,})/i.exec(t);
 if(id)out.id=id[1].replace(/[.\-]+$/,'');
 return out}
function refUsed(ref){
 if(!ref)return null;const r=String(ref).trim().toLowerCase();if(!r)return null;
 for(let i=S.s.length-1;i>=0;i--){const s=S.s[i];if(!s.v&&s.pay.some(p=>p.m=='m'&&p.ref&&String(p.ref).trim().toLowerCase()==r))return s}
 return null}
function paySms(){
 const box=$('#psr'),rf=$('#rf'),sm=$('#psm');if(!box||!rf||!sm||!PY||!PY.A)return;
 const need=PY.A.mo,txt=sm.value.trim();let h='';
 if(txt){
  const o=smsParse(txt);
  if(o.id&&!rf.value.trim())rf.value=o.id;
  if(!o.amts.length)h+=`<div class="bn y chg"><span>${_('Aucun montant trouvé dans ce SMS. Vérifiez le texte collé.')}</span></div>`;
  else if(o.amts.includes(need))h+=`<div class="bn g chg"><span>✓ ${_('Le SMS indique {n}, comme le montant à payer.',{n:f(need)})}</span></div>`;
  else h+=`<div class="bn r chg"><span>⚠ ${_('Le SMS indique {a} mais cette vente demande {b} en Mobile Money.',{a:f(Math.max(...o.amts)),b:f(need)})}</span></div>`}
 const d=refUsed(rf.value);
 if(d)h+=`<div class="bn r chg"><span>⚠ ${_('Ce numéro de transaction a déjà servi pour la vente n° {n}.',{n:rcNo(d)})}</span></div>`;
 if(txt||rf.value.trim())h+=`<div class="sm2">${_('Ce contrôle lit seulement le texte collé. Vérifiez aussi votre solde Orange Money / MTN.')}</div>`;
 box.innerHTML=h}
function payOk(){
 const A=payNums();
 if(PY.man&&A.un!=0)return toast(_('Le total payé doit être égal à {n}',{n:f(A.T)}));
 let cl=null;
 if(A.c>0){
  const n=$('#cn').value.trim();if(!n)return toast(_('Le nom du client est nécessaire'));
  const ex=S.cl.find(x=>x.n.toLowerCase()==n.toLowerCase());
  const tel=$('#cp').value.trim(),pi=$('#ci').value.trim();
  if((pi||PY.idp)&&!$('#cc').checked)return toast(_('Le client doit accepter l\'enregistrement de sa pièce'));
  cl={n,tel,pi,ex,due:$('#cd').value=='x'?pd($('#cdd').value):(+$('#cd').value>0?D0(Date.now())+(+$('#cd').value)*DAY:0)};
  if($('#cd').value=='x'&&isNaN(cl.due))return toast(_('Choisissez la date d\'échéance'))}
 const a={sub:A.sub,d:A.d,T:A.T,e:A.e,mo:A.mo,c:A.c};
 const args={a,cl,op:A.op,ref:(($('#rf')||{}).value||'').trim(),tend:A.tend,rx:$('#rxn')?$('#rxn').value.trim():'',idp:PY.idp,ap:0};
 const step2=()=>{
  const eff=a.sub?(a.sub-a.T)*100/a.sub:0;
  if(!isO()&&!args.ap&&eff>S.set.sellMaxDisc+1e-9)return needOwner(ap=>{args.ap=ap;commitSale(args,ap)},_('Remise de {n} % : le patron doit autoriser.',{n:Math.round(eff*10)/10}));
  commitSale(args,args.ap)};
 const step1=()=>{
  const ex=cl&&cl.ex;
  if(ex&&ex.lim>0&&ex.a+a.c>ex.lim)return sure(_('Plafond de crédit dépassé : {a} + {b} dépasse {l}. Autoriser quand même ?',{a:f(ex.a),b:f(a.c),l:f(ex.lim)}),()=>needOwner(ap=>{args.ap=ap;step2()},_('Le patron doit autoriser un dépassement du plafond.')),_('Autoriser'));
  step2()};
 const dup=a.mo>0&&args.ref?refUsed(args.ref):null;
 if(dup)return sure(_('Ce numéro de transaction a déjà servi pour la vente n° {n}. Continuer quand même ?',{n:rcNo(dup)}),step1,_('Continuer'));
 step1()}
function commitSale(g,ap){
 const t=Date.now(),a=g.a;
 const items=cart.map(l=>{const p=P(l.id),u=unit(p,l.u),bq=rq(l.q*u.f),list=uprice(p,l.u,tier);const al=takeStock(p,bq);
  return{id:p.id,n:p.n,g:p.g||'',u:u.n,f:u.f,q:l.q,pr:l.pr!=null?l.pr:list,pr0:list,c:Math.round(p.c*u.f),tv:p.tva?1:0,cat:p.cat||'',lots:al}});
 const sub=items.reduce((x,i)=>x+Math.round(i.q*i.pr),0);
 const sale={id:uid(),t,no:++S.rn,by:CU,items,sub,disc:sub-a.T,total:a.T,pay:[],cl:'',cid:''};
 if(ap&&ap!=CU)sale.ap=ap;if(g.rx)sale.rx=g.rx;
 if(a.e>0)sale.pay.push({m:'e',a:a.e});
 if(a.mo>0){sale.pay.push({m:'m',a:a.mo,op:g.op,ref:g.ref.trim()});S.set.op=g.op}
 if(a.c>0)sale.pay.push({m:'c',a:a.c});
 if(!sale.pay.length)sale.pay.push({m:'e',a:0});
 if(a.e>0&&g.tend>a.e){sale.tend=g.tend;sale.chg=g.tend-a.e}
 if(g.cl){
  let c=g.cl.ex;if(!c){c={id:uid(),n:g.cl.n,tel:'',pi:'',ph:'',a:0,h:[],due:0,lim:0,t0:t};S.cl.push(c)}
  if(g.cl.tel)c.tel=g.cl.tel;if(g.cl.pi)c.pi=g.cl.pi;
  if(g.idp){const old=c.ph;c.ph='ph'+uid();phPut(c.ph,g.idp);if(old)phDel(old)}
  c.a+=a.c;c.h.push({t,v:a.c,sid:sale.id,no:sale.no});if(g.cl.due)c.due=g.cl.due;
  sale.cl=c.n;sale.cid=c.id}
 S.s.push(sale);cart=[];vq0='';
 saleDone(sale)}
// après la vente : un bandeau en bas (monnaie à rendre, reçu, annuler) et on peut servir le client suivant ; l'enregistrement se fait juste après l'affichage
function saleDone(s){
 LS={id:s.id,t:Date.now()};
 const full=S.set.rcm=='full'||s.pay.some(p=>p.m=='c'&&p.a>0);
 if(full)rcDone(s);else{M();vupd()}
 const nv=$('#nv');if(nv)nv.innerHTML=nav();
 clearTimeout(saleDone.h);saleDone.h=setTimeout(()=>{if(LS&&Date.now()-LS.t>=119000){LS=null;if(!cart.length)vupd()}},120000);
 dirty=true;requestAnimationFrame(()=>setTimeout(()=>save(true),0))}
function lsBar(){
 if(!LS)return'';
 const s=S.s.find(x=>x.id==LS.id);
 if(!s||s.v||Date.now()-LS.t>120000){LS=null;return''}
 const left=s.chg?`<div class="lsm">✓ ${_('Vente enregistrée')} · ${f(s.total)}</div><div class="chg2">${_('Monnaie à rendre')} : ${f(s.chg)}</div>`:`<b>✓ ${_('Vente enregistrée')}</b><div class="lsm">${f(s.total)}</div>`;
 return `<div class="cart ls"><div class="gr1">${left}</div><button class="b sm ol" onclick="rcOpen('${s.id}')">${_('Reçu')}</button><button class="b sm ol" onclick="lsUndo('${s.id}')">${_('Annuler')}</button></div>`}
function rcOpen(id){const s=S.s.find(x=>x.id==id);if(s)rcDone(s)}
function lsUndo(id){
 const s=S.s.find(x=>x.id==id);if(!s||s.v)return;
 if(Date.now()-s.t>5*60000||!S.s.length||S.s[S.s.length-1].id!=id)return info(_('Trop tard pour annuler ici'),`<p>${_('Pour annuler une ancienne vente, allez dans Plus > Ventes.')}</p>`);
 sure(_('Annuler cette vente ? Le stock sera remis.'),()=>{voidDo(s,CU);LS=null;toast(_('Vente annulée'));R()},_('Annuler la vente'))}
// ---- reçus
function shopLines(){const s=S.shop;return[s.name,[s.addr,s.tel?_('Tél.')+' '+s.tel:''].filter(Boolean).join(' · '),s.nif?'NIF '+s.nif:''].filter(Boolean)}
function rcNo(s){return String(s.no||0).padStart(6,'0')}
function payLbl(p){return p.m=='e'?_('Espèces'):p.m=='m'?'Mobile Money'+(p.op=='om'?' (Orange)':p.op=='mtn'?' (MTN)':''):_('À crédit')}
function rcText(s){
 const L=[];shopLines().forEach((x,i)=>L.push(i?x:'*'+x+'*'));
 L.push(_('Reçu n° {n}',{n:rcNo(s)})+' — '+fdt(s.t));if(s.by)L.push(_('Vendeur : {n}',{n:UN(s.by)}));L.push('------------------------');
 s.items.forEach(i=>L.push(`${fq(i.q)}${i.f!=1||i.u?' '+i.u:''} × ${i.n}${i.g?' '+i.g:''}  ${fm(Math.round(i.q*i.pr))}`));
 L.push('------------------------');
 if(s.disc)L.push(_('Remise')+' : -'+fm(s.disc));
 L.push('*'+_('TOTAL')+' : '+f(s.total)+'*');
 s.pay.filter(p=>p.a>0).forEach(p=>L.push(payLbl(p)+' : '+f(p.a)));
 if(s.chg)L.push(_('Donné')+' : '+f(s.tend)+' · '+_('Rendu')+' : '+f(s.chg));
 const c=s.cid&&CLI(s.cid);if(c&&c.a>0)L.push(_('Reste dû par {n} : {a}',{n:c.n,a:f(c.a)}));
 if(S.set.msg)L.push('',S.set.msg);
 return L.join('\n')}
function rcHTML(s){
 const sl=shopLines();
 return `<div class="rc w${S.set.rcw==58?58:80}"><div style="text-align:center"><b>${esc(sl[0]||'')}</b>${sl.slice(1).map(x=>'<br>'+esc(x)).join('')}</div><hr>${esc(_('Reçu n° {n}',{n:rcNo(s)}))}<br>${fdt(s.t)}${s.by?'<br>'+esc(_('Vendeur : {n}',{n:UN(s.by)})):''}<hr>${s.items.map(i=>`<div class="rr"><span>${fq(i.q)}${i.f!=1||i.u?' '+esc(i.u):''} × ${esc(i.n)}${i.g?' '+esc(i.g):''}</span><span>${fm(Math.round(i.q*i.pr))}</span></div>`).join('')}<hr>${s.disc?`<div class="rr"><span>${_('Remise')}</span><span>-${fm(s.disc)}</span></div>`:''}<div class="rr"><b>${_('TOTAL')}</b><b>${f(s.total)}</b></div>${s.pay.filter(p=>p.a>0).map(p=>`<div class="rr"><span>${esc(payLbl(p))}</span><span>${fm(p.a)}</span></div>`).join('')}${s.chg?`<div class="rr"><span>${_('Donné')}</span><span>${fm(s.tend)}</span></div><div class="rr"><span>${_('Rendu')}</span><span>${fm(s.chg)}</span></div>`:''}<hr><div style="text-align:center">${esc(S.set.msg||'')}</div></div>`}
function rcDone(s){
 M(`<h2>✓ ${_('Vente enregistrée')}</h2><div class="kv"><span>${_('Reçu n° {n}',{n:rcNo(s)})}</span><b>${f(s.total)}</b></div>${s.chg?`<div class="bn g"><b>${_('Monnaie à rendre')} : ${f(s.chg)}</b></div>`:''}
<div class="btns" style="padding:10px 0 0"><button class="b gr" onclick="rcShare('${s.id}')">${_('Envoyer le reçu')}</button><button class="b ol nf" onclick="rcPrint('${s.id}')">${_('Imprimer')}</button></div>
<div class="pay2 o"><button class="b ol" onclick="M();R()">${_('Nouvelle vente')}</button></div>`);vupd()}
function rcShare(id){const s=S.s.find(x=>x.id==id);if(!s)return;const c=s.cid&&CLI(s.cid);
 M(`<h2>${_('Envoyer le reçu')}</h2><div class="btns" style="padding:0"><button class="b gr" onclick="rcSend('${id}','w')">WhatsApp</button><button class="b ol" onclick="rcSend('${id}','s')">SMS</button><button class="b ol" onclick="rcSend('${id}','x')">${_('Autre application')}</button></div><label>${_('Numéro du client (facultatif)')}</label><input class="in" id="rtel" inputmode="tel" value="${esc(c?c.tel:'')}"><div class="pay2 o"><button class="b ol" onclick="M();R()">${_('Fermer')}</button></div>`)}
function rcSend(id,k){const s=S.s.find(x=>x.id==id),tel=$('#rtel')?$('#rtel').value:'',tx=rcText(s);
 if(k=='w')ext(waLink(tel,tx));else if(k=='s')sms(tel,tx);else share(tx,tel)}
function rcPrint(id){const s=S.s.find(x=>x.id==id);if(s)printHTML(rcHTML(s))}
function printHTML(h){if(FR)return frNo();$('#pr').innerHTML=h;setTimeout(()=>{try{window.print()}catch(e){toast(_('Impression impossible ici'))}},50)}
SCR.v=V;
