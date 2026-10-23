// ---- fournisseurs, achats (prix de revient moyen), produits à recommander
const SUP=id=>S.sup.find(x=>x.id==id);
const supN=id=>{const s=SUP(id);return s?s.n:''};
const supDebt=()=>S.sup.reduce((a,s)=>a+Math.max(s.a,0),0);
// quantités vendues (en unité de base) sur les n derniers jours, retours déduits
function soldMap(days){
 const cut=Date.now()-days*DAY,m={},ix=new Map();
 for(const s of S.s){ix.set(s.id,s);if(s.v||s.t<cut)continue;for(const i of s.items)m[i.id]=(m[i.id]||0)+i.q*(i.f||1)}
 for(const r of S.rt){if(r.t<cut)continue;const s=ix.get(r.sid);if(!s||s.v||s.t<cut)continue;r.lines.forEach(l=>{const i=s.items[l.li];if(i)m[i.id]=(m[i.id]||0)-l.q*(i.f||1)})}
 for(const k in m)if(m[k]<0)m[k]=0;
 return m}
function sugQ(p,sm){const v=((sm||{})[p.id]||0)/30;const need=Math.max(p.m*2,v*14)-Math.max(avail(p),0);return p.dec?rq(Math.max(need,p.m||1)):Math.ceil(Math.max(need,1))}
// ---- liste des achats
SUB.buy=()=>{
 const L=S.pu.slice().sort((a,b)=>b.t-a.t).slice(0,60),low=S.p.filter(p=>isLow(p)).length;
 return `${backBtn("go('s')")}<h3>🚚 ${_('Achats et fournisseurs')}</h3>
<div class="btns"><button class="b gr" onclick="buyNew()">＋ ${_('Nouvel achat')}</button></div>
<div class="btns"><button class="b ol sm" onclick="go('s','sup')">🏭 ${_('Fournisseurs')}${supDebt()?' · '+f(supDebt()):''}</button><button class="b ol sm" onclick="go('s','reo')">📝 ${_('À recommander')}${low?' ('+low+')':''}</button></div>
<div class="card">${L.length?L.map(u=>`<div class="row tap" onclick="buyDetail('${u.id}')"><div class="gr1"><b${u.v?' style="text-decoration:line-through"':''}>${esc(u.supn||_('Achat comptant'))}</b><small>${fdt(u.t)} · ${u.lines.length} ${_('produit(s)')}${u.inv?' · '+esc(u.inv):''}${u.v?' · '+_('annulé'):''}</small></div><div style="text-align:right"><b>${f(u.tot)}</b>${u.pd<u.tot&&!u.v?`<small class="neg">${_('dû')} ${f(u.tot-u.pd)}</small>`:''}</div></div>`).join(''):`<p class="hint">${_('Aucun achat enregistré. Touchez « Nouvel achat » quand vous recevez de la marchandise.')}</p>`}</div>`};
function buyDetail(id){
 const u=S.pu.find(x=>x.id==id);if(!u)return;
 M(`<h2>${esc(u.supn||_('Achat comptant'))}</h2><p class="sm2">${fdt(u.t)}${u.inv?' · '+esc(u.inv):''}${u.by?' · '+esc(UN(u.by)):''}${u.v?' · <b class="neg">'+_('annulé')+'</b>':''}</p>
${u.lines.map(l=>rowh(`${fq(l.uq)}${l.un?' '+esc(l.un):''} × ${esc(l.n)}`,f(Math.round(l.uq*l.uc)),(l.uf>1?'= '+fq(l.q)+' · ':'')+(l.lot&&l.lot!='-'?_('Lot')+' '+esc(l.lot)+' · ':'')+(l.exp?fdate(pd(l.exp)):''))).join('')}
${kv(_('Total'),f(u.tot))}${kv(_('Payé'),f(u.pd)+(u.pd>0?' ('+(u.pm=='m'?(u.op=='om'?'Orange Money':u.op=='mtn'?'MTN MoMo':'Mobile Money'):_('Espèces'))+')':''))}${u.tot>u.pd?kv(_('Reste à payer'),f(u.tot-u.pd),'neg'):''}
<div class="btns" style="padding:8px 0 0">${u.v||!isO()?'':`<button class="b ol" onclick="buyVoid('${id}')">${_('Annuler cet achat')}</button>`}</div><div class="pay2 o"><button class="b ol" onclick="M()">${_('Fermer')}</button></div>`)}
function unbuy(p,l){
 if(!p.lt){p.q=rq(p.q-l.q);return}
 let need=l.q;const lot=p.lots.find(x=>x.no==(l.lot||'-')&&(x.exp||'')==(l.exp||''));
 if(lot){const t=Math.min(Math.max(lot.q,0),need);lot.q=rq(lot.q-t);need=rq(need-t)}
 if(need>0)takeStock(p,need);
 p.lots=p.lots.filter(x=>Math.abs(x.q)>1e-9);p.q=lotQ(p)}
function buyVoid(id){
 const u=S.pu.find(x=>x.id==id);if(!u||u.v)return;
 needOwner(()=>sure(_('Annuler cet achat ? Le stock ajouté sera retiré et la dette au fournisseur corrigée.'),()=>{
  u.lines.forEach(l=>{const p=P(l.pid);if(!p)return;unbuy(p,l);if(l.c1!=null&&p.c==l.c1&&l.c0!=null)p.c=l.c0});
  const cr=u.tot-u.pd,sp=u.sid?SUP(u.sid):null;
  if(sp&&cr>0){sp.a=Math.max(0,sp.a-cr);sp.h.push({t:Date.now(),v:-cr,x:1,by:CU})}
  u.v=1;u.vt=Date.now();save(true);M();toast(_('Achat annulé'));R()},_('Annuler l\'achat')))}
// ---- nouvel achat
let BU=null;
function buyNew(pid,sid){
 BU={sid:sid||'',inv:'',lines:[],pd:'',pm:'e',op:S.set.op||'om',ref:'',pq:'',auto:1};
 if(pid)buyAdd(pid,1);
 go('s','buyn')}
const quickBuy=id=>buyNew(id);
function buyAdd(id,nr){
 const p=P(id);if(!p)return;if(!BU.sid&&p.sup)BU.sid=p.sup;
 BU.lines.push({pid:id,uq:'',u:-1,uc:p.c||0,lot:'',exp:''});BU.pq='';
 if(!nr){buyRead();R();setTimeout(()=>{const e=$$('.bqq');if(e.length)e[e.length-1].focus()},40)}}
function buyRm(i){buyRead();BU.lines.splice(i,1);R()}
const buyLT=l=>Math.round((+l.uq||0)*(+l.uc||0));
const buyTotal=()=>BU.lines.reduce((a,l)=>a+buyLT(l),0);
const buyNote=l=>{const p=P(l.pid),u=unit(p,l.u),q=(+l.uq||0)*u.f;return q&&u.f!=1?'= '+fq(q)+(p.bu?' '+p.bu:''):''};
function buyRead(){if(!BU||!$('#bs'))return;BU.sid=$('#bs').value;BU.inv=$('#bi').value;if($('#brf'))BU.ref=$('#brf').value}
function buyL(i,k,v){
 const l=BU.lines[i],p=P(l.pid);
 if(k=='uq'){const q=dec(v);l.uq=isNaN(q)?'':q}
 else if(k=='uc'){const n=num(v);l.uc=isNaN(n)?0:n}
 else if(k=='u'){l.u=+v;l.uc=Math.round(p.c*unit(p,l.u).f);buyRead();return R()}
 else l[k]=v;
 buyTot()}
function buyPM(k){BU.pm=k=='e'?'e':'m';if(k!='e')BU.op=k;$$('#bpm .chip').forEach(b=>b.classList.toggle('on',b.dataset.k==k))}
function buyTot(){
 BU.lines.forEach((l,i)=>{const a=$('#bu_t'+i),b=$('#bu_n'+i);if(a)a.textContent=f(buyLT(l));if(b)b.textContent=buyNote(l)});
 const T=buyTotal();if(BU.auto&&$('#bp'))$('#bp').value=fm(T);
 const pd=BU.auto?T:(num($('#bp')?$('#bp').value:'')||0);
 if($('#btt'))$('#btt').textContent=f(T);
 if($('#brest'))$('#brest').innerHTML=pd>T?`<span class="neg">${_('Le montant payé dépasse le total')}</span>`:pd<T?`<span class="neg">${_('Reste à payer au fournisseur : {n}',{n:f(T-pd)})}</span>`:''}
function buyQ(v){
 BU.pq=v;const nq=nz(v),e=$('#bres');if(!e)return;
 if(!nq){e.innerHTML='';return}
 const L=S.p.filter(p=>!p.off&&nz([p.n,p.g,p.bc,p.cat,p.dci].join(' ')).includes(nq)).slice(0,8);
 e.innerHTML=L.length?L.map(p=>`<div class="row tap" onclick="buyAdd(${p.id})"><div class="gr1"><b>${esc(p.n)} ${esc(p.g||'')}</b><small>${_('En stock')} ${stockTxt(p)}</small></div><span>＋</span></div>`).join(''):`<p class="hint" style="margin:6px 0">${_('Aucun produit. Ajoutez-le d\'abord dans le Stock.')}</p>`}
SUB.buyn=()=>{
 if(!BU)return`${backBtn("go('s','buy')")}<p class="hint">${_('Aucun achat en cours.')}</p>`;
 const T=buyTotal();
 return `${backBtn("buyBack()")}<h3>🚚 ${_('Nouvel achat')}</h3>
<div class="card pl"><label>${_('Fournisseur')}</label><select class="in" id="bs" onchange="buyRead()"><option value="">${_('Achat comptant (sans fournisseur)')}</option>${S.sup.map(s=>`<option value="${s.id}"${BU.sid==s.id?' selected':''}>${esc(s.n)}</option>`).join('')}</select><button class="lnk" onclick="buyRead();supForm()">＋ ${_('Nouveau fournisseur')}</button>
<label>${_('N° de facture ou bon de livraison (facultatif)')}</label><input class="in" id="bi" value="${esc(BU.inv)}"></div>
<div class="srch"><input class="in" id="bq" placeholder="${_('Ajouter un produit reçu…')}" value="${esc(BU.pq)}" oninput="buyQ(this.value)" autocomplete="off"><button class="b ol sm" onclick="scanFor('buy')" style="display:${typeof camOK=='function'&&camOK()?'':'none'}">📷</button></div>
<div class="card" id="bres" style="margin-top:6px"></div>
${BU.lines.map(buyLine).join('')}
<div class="card pl"><div class="row" style="border:0;padding:0"><div class="gr1">${_('Total de l\'achat')}</div><div class="tot s" id="btt">${f(T)}</div></div>
<label>${_('Payé maintenant (GNF)')}</label><input class="in nm" id="bp" inputmode="numeric" value="${fm(BU.auto?T:(num(BU.pd)||0))}" oninput="BU.auto=0;buyTot()">
<div class="chips" style="padding:6px 0" id="bpm">${[['e','💵 '+_('Espèces')],['om','📱 Orange Money'],['mtn','📱 MTN MoMo']].map(([k,l])=>`<button class="chip${(BU.pm=='e'&&k=='e')||(BU.pm=='m'&&BU.op==k)?' on':''}" data-k="${k}" onclick="buyPM(this.dataset.k)">${l}</button>`).join('')}</div>
<div id="brest" class="sm2"></div></div>
<div class="top"><button class="b gr" onclick="buyOk()">${_('Enregistrer l\'achat')}</button></div>`};
function buyLine(l,i){
 const p=P(l.pid),us=[unit(p,-1)].concat((p.us||[]).map((x,k)=>unit(p,k))),u=unit(p,l.u);
 return `<div class="card pl" style="margin:8px 16px"><div class="row" style="border:0;padding:0"><div class="gr1"><b>${esc(p.n)} ${esc(p.g||'')}</b><small>${_('En stock')} : ${stockTxt(p)}${seeCost()?' · '+_('prix d\'achat actuel')+' '+f(p.c):''}</small></div><button class="b xs ol" onclick="buyRm(${i})">✕</button></div>
<div class="tri"><div><label>${_('Quantité')}</label><input class="in bqq" inputmode="decimal" value="${l.uq===''?'':fq(l.uq)}" oninput="buyL(${i},'uq',this.value)"></div>
<div><label>${_('Format')}</label>${us.length>1?`<select class="in" onchange="buyL(${i},'u',this.value)">${us.map(x=>`<option value="${x.i}"${x.i==l.u?' selected':''}>${esc(x.n||_('unité'))}</option>`).join('')}</select>`:`<input class="in" value="${esc(u.n||_('unité'))}" disabled>`}</div>
<div><label>${_('Prix d\'achat unitaire')}</label><input class="in nm" inputmode="numeric" value="${fm(l.uc)}" oninput="buyL(${i},'uc',this.value)"></div></div>
${p.lt?`<div class="eq"><div><label>${_('N° de lot')}</label><input class="in" value="${esc(l.lot)}" oninput="buyL(${i},'lot',this.value)"></div><div><label>${_('Péremption')}</label><input class="in" type="date" value="${esc(l.exp)}" onchange="buyL(${i},'exp',this.value)"></div></div>`:''}
<div class="kv"><span id="bu_n${i}">${buyNote(l)}</span><b id="bu_t${i}">${f(buyLT(l))}</b></div></div>`}
function buyBack(){if(BU&&BU.lines.length)return sure(_('Abandonner cet achat ?'),()=>{BU=null;go('s','buy')},_('Abandonner'));BU=null;go('s','buy')}
function buyOk(){
 buyRead();const ls=BU.lines;
 if(!ls.length)return toast(_('Ajoutez au moins un produit'));
 for(const l of ls){
  if(!(+l.uq>0))return toast(_('Indiquez la quantité de chaque produit'));
  const p=P(l.pid),bq=rq(l.uq*unit(p,l.u).f);
  if(!p.dec&&Math.abs(bq-Math.round(bq))>1e-9)return toast(_('« {n} » se compte en entier',{n:p.n}))}
 const T=buyTotal(),pd=BU.auto?T:(num($('#bp').value)||0);
 if(pd>T)return toast(_('Le montant payé dépasse le total'));
 if(pd<T&&!BU.sid)return toast(_('Choisissez le fournisseur pour acheter à crédit'));
 const sp=BU.sid?SUP(BU.sid):null,t=Date.now(),warn=[];
 const lines=ls.map(l=>{
  const p=P(l.pid),u=unit(p,l.u),bq=rq(l.uq*u.f),cb1=(+l.uc||0)/u.f,c0=p.c,oldQ=Math.max(p.q,0);
  p.c=oldQ+bq>0?Math.round((oldQ*p.c+bq*cb1)/(oldQ+bq)):Math.round(cb1);
  giveStock(p,bq,p.lt?[{no:l.lot||'-',exp:l.exp||'',q:bq}]:null);
  if(!p.sup&&BU.sid)p.sup=BU.sid;
  if(c0>0&&cb1>c0*1.03)warn.push({n:p.n,a:Math.round(c0*u.f),b:Math.round(cb1*u.f),pr:uprice(p,l.u,'r'),un:u.n});
  return{pid:p.id,n:p.n+(p.g?' '+p.g:''),uq:+l.uq,un:u.n,uf:u.f,uc:+l.uc||0,q:bq,c:cb1,c0,c1:p.c,tv:p.tva?1:0,lot:l.lot||'',exp:l.exp||''}});
 const rec={id:uid(),t,by:CU,sid:BU.sid||'',supn:sp?sp.n:'',inv:BU.inv.trim(),lines,tot:T,pd,pm:BU.pm,op:BU.pm=='m'?BU.op:'',ref:'',note:''};
 S.pu.push(rec);
 if(sp&&T>pd){sp.a+=T-pd;sp.h.push({t,v:T-pd,by:CU,pu:rec.id})}
 if(BU.pm=='m')S.set.op=BU.op;
 BU=null;save(true);
 if(warn.length&&seeCost()){go('s','buy');M(`<h2>${_('Achat enregistré ✓')}</h2><div class="bn y"><b>${_('Attention : le prix d\'achat a augmenté')}</b></div>${warn.map(w=>rowh(esc(w.n),f(w.a)+' → '+f(w.b),w.pr<w.b?'⚠ '+_('vendu {p}, moins cher que l\'achat',{p:f(w.pr)}):_('vendu {p}',{p:f(w.pr)}),w.pr<w.b?'neg':'')).join('')}<p class="hint" style="margin:8px 0">${_('Pensez à ajuster vos prix de vente (Stock → Prix en bloc).')}</p><div class="pay2 o"><button class="b gr" onclick="M();R()">${_('Compris')}</button></div>`)}
 else{toast(_('Achat enregistré ✓'));go('s','buy')}}
// ---- fournisseurs
SUB.sup=()=>{
 const L=S.sup.slice().sort((a,b)=>(b.a>0?1:0)-(a.a>0?1:0)||a.n.localeCompare(b.n,'fr'));
 return `${backBtn("go('s','buy')")}<h3>🏭 ${_('Fournisseurs')}</h3>
<div class="sum"><small>${_('Ce que vous devez aux fournisseurs')}</small><div class="tot">${f(supDebt())}</div></div>
<div class="top"><button class="b ol" onclick="supForm()">＋ ${_('Ajouter un fournisseur')}</button></div>
<div class="card">${L.length?L.map(s=>`<div class="row tap" onclick="supInfo('${s.id}')"><div class="gr1"><b>${esc(s.n)}</b><small>${esc(s.tel||'')}</small></div>${s.a>0?`<div class="owe">${f(s.a)}</div>`:`<small>${_('Rien à payer')}</small>`}</div>`).join(''):`<p class="hint">${_('Aucun fournisseur. Ajoutez celui qui vous livre.')}</p>`}</div>`};
function supForm(id){
 const s=id?SUP(id):{n:'',tel:'',note:''};
 M(`<h2>${id?_('Modifier le fournisseur'):_('Nouveau fournisseur')}</h2><label>${_('Nom')}</label><input class="in" id="sn" value="${esc(s.n)}"><label>${_('Téléphone (WhatsApp)')}</label><input class="in" id="st" inputmode="tel" value="${esc(s.tel)}"><label>${_('Note (facultatif)')}</label><input class="in" id="so" value="${esc(s.note||'')}">${acts(_('Enregistrer'),'supSave('+(id?"'"+id+"'":'null')+')')}`)}
function supSave(id){
 const n=$('#sn').value.trim();if(!n)return toast(_('Le nom est nécessaire'));
 if(S.sup.some(x=>x.n.toLowerCase()==n.toLowerCase()&&x.id!=id))return toast(_('Ce nom existe déjà'));
 let s=id?SUP(id):null;if(!s){s={id:uid(),n,tel:'',note:'',a:0,h:[]};S.sup.push(s)}
 s.n=n;s.tel=$('#st').value.trim();s.note=$('#so').value.trim();
 if(BU&&sub=='buyn')BU.sid=s.id;
 save(true);M();toast(_('Fournisseur enregistré ✓'));R()}
function supInfo(id){
 const s=SUP(id);if(!s)return;
 const pu=S.pu.filter(u=>u.sid==id&&!u.v),tot=pu.reduce((a,u)=>a+u.tot,0);
 const hist=s.h.filter(h=>!h.x).slice(-15).reverse().map(h=>rowh(h.v>0?_('Achat à crédit'):_('Paiement')+(h.m=='m'?' Mobile Money':' · '+_('Espèces')),(h.v>0?'+':'')+f(h.v),fdt(h.t),h.v>0?'owe':'pos')).join('');
 M(`<h2>${esc(s.n)}</h2>${s.tel?`<p class="sm2">${esc(s.tel)}</p>`:''}${kv(_('Dette actuelle'),f(s.a),s.a>0?'owe':'')}${kv(_('Achats enregistrés'),pu.length+' · '+f(tot))}${kv(_('Produits liés'),S.p.filter(p=>p.sup==id&&!p.off).length)}
<div class="btns" style="padding:8px 0 0">${s.a>0?`<button class="b gr" onclick="supPay('${id}')">${_('Payer')}</button>`:''}<button class="b ol" onclick="M();buyNew(0,'${id}')">${_('Nouvel achat')}</button><button class="b ol" onclick="supForm('${id}')">${_('Modifier')}</button></div>
<h3 style="margin:14px 0 4px">${_('Historique de la dette')}</h3>${hist||`<p class="hint">${_('Rien pour le moment.')}</p>`}<div class="pay2 o"><button class="b ol" onclick="M()">${_('Fermer')}</button></div>`)}
let SP=null;
function supPay(id){
 const s=SUP(id);SP={id,m:'e',op:S.set.op||'om'};
 M(`<h2>${_('Payer')} ${esc(s.n)}</h2>${kv(_('Dette actuelle'),f(s.a),'owe')}<label>${_('Montant payé')}</label><input class="in nm" id="spa" inputmode="numeric" value="${fm(s.a)}">
<div class="chips" style="padding:6px 0" id="spm">${[['e','💵 '+_('Espèces')],['om','📱 Orange Money'],['mtn','📱 MTN MoMo']].map(([k,l])=>`<button class="chip${k=='e'?' on':''}" data-k="${k}" onclick="SP.m=this.dataset.k=='e'?'e':'m';SP.op=this.dataset.k;$$('#spm .chip').forEach(b=>b.classList.toggle('on',b==this))">${l}</button>`).join('')}</div>${acts(_('Valider'),'supPayOk()')}`)}
function supPayOk(){
 const s=SUP(SP.id),v=num($('#spa').value);
 if(!(v>0))return toast(_('Montant invalide'));if(v>s.a)return toast(_('Montant trop élevé'));
 s.a-=v;s.h.push({t:Date.now(),v:-v,m:SP.m,op:SP.m=='m'?SP.op:'',by:CU});if(SP.m=='m')S.set.op=SP.op;
 save(true);M();toast(_('Paiement enregistré ✓'));R()}
// ---- produits à recommander
let REO={q:{},off:{}};
function reoLines(k){const sm=soldMap(30);return S.p.filter(p=>isLow(p)&&(p.sup||'')==k&&!REO.off[p.id]).map(p=>({p,q:REO.q[p.id]!==undefined?REO.q[p.id]:sugQ(p,sm)}))}
SUB.reo=()=>{
 const sm=soldMap(30),L=S.p.filter(p=>isLow(p)),g={};
 L.forEach(p=>{(g[p.sup||'']=g[p.sup||'']||[]).push(p)});
 const ks=Object.keys(g).sort((a,b)=>(a?0:1)-(b?0:1)||supN(a).localeCompare(supN(b),'fr'));
 return `${backBtn("go('s','buy')")}<h3>📝 ${_('Produits à recommander')}</h3><p class="hint" style="margin-top:0">${_('Les quantités proposées couvrent environ 2 semaines de ventes. Vous pouvez les changer.')}</p>
${L.length?ks.map(k=>`<div class="card pl"><div class="row" style="border:0;padding:0 0 6px"><div class="gr1"><b>${k?esc(supN(k)):_('Sans fournisseur')}</b></div></div>
${g[k].map(p=>`<div class="row"><label class="tg" style="margin:0"><input type="checkbox" ${REO.off[p.id]?'':'checked'} onchange="REO.off[${p.id}]=!this.checked"><span></span></label><div class="gr1"><b>${esc(p.n)} ${esc(p.g||'')}</b><small>${_('Reste')} ${fq(p.q)}${p.bu?' '+esc(p.bu):''} · ${_('alerte à')} ${fq(p.m)}</small></div><input class="in" style="width:78px;text-align:right" inputmode="decimal" value="${fq(REO.q[p.id]!==undefined?REO.q[p.id]:sugQ(p,sm))}" oninput="REO.q[${p.id}]=dec(this.value)||0"></div>`).join('')}
<div class="btns" style="padding:8px 0 0"><button class="b gr sm" onclick="reoSend('${k}','w')">WhatsApp</button><button class="b ol sm" onclick="reoSend('${k}','s')">SMS</button><button class="b ol sm" onclick="reoSend('${k}','x')">${_('Autre')}</button><button class="b ol sm" onclick="reoBuy('${k}')">${_('Acheter')}</button></div></div>`).join(''):`<p class="hint">${_('Rien à recommander pour le moment. Tout est en stock.')}</p>`}`};
function reoText(k){
 const sp=k?SUP(k):null,ls=reoLines(k).filter(x=>x.q>0);if(!ls.length)return'';
 return _('Bonjour{n}, c\'est {s}. Je voudrais commander :',{n:sp?' '+sp.n:'',s:S.shop.name})+'\n'+ls.map(x=>'- '+x.p.n+(x.p.g?' '+x.p.g:'')+' × '+fq(x.q)+(x.p.bu?' '+x.p.bu:'')).join('\n')+'\n'+_('Merci !')}
function reoSend(k,how){
 const tx=reoText(k);if(!tx)return toast(_('Aucun produit choisi'));
 const tel=k&&SUP(k)?SUP(k).tel:'';
 if(how=='w')ext(waLink(tel,tx));else if(how=='s')sms(tel,tx);else share(tx,tel)}
function reoBuy(k){
 const ls=reoLines(k).filter(x=>x.q>0);if(!ls.length)return toast(_('Aucun produit choisi'));
 BU={sid:k||'',inv:'',lines:[],pd:'',pm:'e',op:S.set.op||'om',ref:'',pq:'',auto:1};
 ls.forEach(x=>{buyAdd(x.p.id,1);BU.lines[BU.lines.length-1].uq=x.q});
 if(k)BU.sid=k;go('s','buyn')}
