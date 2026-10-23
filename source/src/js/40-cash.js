// ---- caisse : mouvements d'argent, dépenses, ouverture et clôture, agent Mobile Money
const wl=w=>w=='c'?_('Espèces'):w=='om'?'Orange Money':w=='mtn'?'MTN MoMo':_('Autre mobile');
const opw=o=>o=='om'||o=='mtn'?o:'ot';
const DS=()=>({s:S.s,rt:S.rt,ex:S.ex,adj:S.adj,ag:S.ag,cl:S.cl,pu:S.pu,sup:S.sup});
// tous les mouvements d'argent (espèces et comptes Mobile Money) entre a et b
function flows(a,b,D){
 D=D||DS();const out=[];
 const add=(t,w,v,k,d,by,ref)=>{if(v&&t>=a&&t<b)out.push({t,w,a:v,k,d:d||'',by:by||1,ref})};
 for(const s of D.s){for(const p of s.pay){if(p.m=='c'||!p.a)continue;const w=p.m=='e'?'c':opw(p.op);add(s.t,w,p.a,'vente',_('Vente n° {n}',{n:rcNo(s)}),s.by,s.id);if(s.v)add(s.vt||s.t,w,-p.a,'annul',_('Annulation de la vente n° {n}',{n:rcNo(s)}),s.by,s.id)}}
 for(const r of D.rt)for(const h of r.how){if(h.m=='d')continue;add(r.t,h.m=='e'?'c':opw(h.op),-h.a,'retour',_('Retour sur la vente n° {n}',{n:String(r.no||0).padStart(6,'0')}),r.by,r.id)}
 for(const c of D.cl)for(const h of c.h)if(h.v<0&&!h.x)add(h.t,h.m=='m'?opw(h.op):'c',-h.v,'dette',_('Paiement de {n}',{n:c.n}),h.by,c.id);
 for(const e of D.ex){const w=e.m=='m'?opw(e.op):'c',v=e.k=='k'?e.a:-e.a,lab=(e.k=='x'?_(XC[e.cat]||'Autre'):e.k=='w'?_('Retrait du patron'):_('Apport d\'argent'))+(e.note?' — '+e.note:'');
  add(e.t,w,v,e.k=='k'?'apport':e.k=='w'?'retrait':'depense',lab,e.by,e.id);if(e.v)add(e.vt||e.t,w,-v,'annul',_('Annulation')+' — '+lab,e.by,e.id)}
 for(const p of D.pu)if(p.pd>0){const w=p.pm=='m'?opw(p.op):'c';add(p.t,w,-p.pd,'achat',_('Achat')+(p.supn?' — '+p.supn:''),p.by,p.id);if(p.v)add(p.vt||p.t,w,p.pd,'annul',_('Annulation d\'un achat')+(p.supn?' — '+p.supn:''),p.by,p.id)}
 for(const s of D.sup||[])for(const h of s.h||[])if(h.v<0&&!h.x)add(h.t,h.m=='m'?opw(h.op):'c',h.v,'fournisseur',_('Paiement à {n}',{n:s.n}),h.by,s.id);
 for(const g of D.ag){const w=opw(g.op),sg=g.k=='dep'||g.k=='out'?-1:1;
  if(g.k=='dep'||g.k=='out'){add(g.t,w,-g.a,'agent',wl(w)+' — '+_(AGK[g.k]),g.by,g.id);add(g.t,'c',g.a,'agent',_(AGK[g.k]),g.by,g.id)}
  else{add(g.t,w,g.a,'agent',wl(w)+' — '+_(AGK[g.k]),g.by,g.id);add(g.t,'c',-g.a,'agent',_(AGK[g.k]),g.by,g.id)}
  if(g.cm>0)add(g.t,g.cw=='w'?w:'c',g.cm,'commission',_('Commission')+' '+wl(w),g.by,g.id)}
 return out.sort((x,y)=>x.t-y.t)}
// ---- dépenses
const XC={loy:X('Loyer'),trans:X('Transport'),carb:X('Carburant, électricité'),sal:X('Salaires'),four:X('Fournitures'),imp:X('Impôts et taxes'),frais:X('Frais Mobile Money'),rep:X('Réparations'),autre:X('Autre')};
let EX=null;
function exUI(k){
 if(!isO())return needOwner(()=>exUI(k));
 EX={k,cat:'autre',m:'e',op:S.set.op||'om'};
 M(`<h2>${k=='x'?_('Nouvelle dépense'):k=='w'?_('Retrait personnel du patron'):_('Apport d\'argent')}</h2><label>${_('Montant (GNF)')}</label><input class="in nm" id="xa" inputmode="numeric">
${k=='x'?`<label>${_('Catégorie')}</label><div class="chips" style="padding:4px 0;flex-wrap:wrap" id="xcs">${Object.keys(XC).map(c=>`<button class="chip${c=='autre'?' on':''}" data-k="${c}" onclick="EX.cat=this.dataset.k;$$('#xcs .chip').forEach(b=>b.classList.toggle('on',b==this))">${_(XC[c])}</button>`).join('')}</div>`:''}
<label>${k=='k'?_('Reçu en'):_('Payé avec')}</label><div class="chips" style="padding:4px 0" id="xms">${[['e','💵 '+_('Espèces')],['om','📱 Orange Money'],['mtn','📱 MTN MoMo']].map(([c,l])=>`<button class="chip${c=='e'?' on':''}" data-k="${c}" onclick="EX.m=this.dataset.k=='e'?'e':'m';EX.op=this.dataset.k;$$('#xms .chip').forEach(b=>b.classList.toggle('on',b==this))">${l}</button>`).join('')}</div>
<label>${_('Date')}</label><input class="in" id="xd" type="date" value="${ymd(Date.now())}"><label>${_('Note (facultatif)')}</label><input class="in" id="xn">${acts(_('Enregistrer'),'exOk()')}`)}
function exOk(){
 const a=num($('#xa').value);if(!(a>0))return toast(_('Montant invalide'));
 const d=pd($('#xd').value),t=isNaN(d)||D0(d)==D0(Date.now())?Date.now():d+12*3600e3;
 S.ex.push({id:uid(),t,by:CU,k:EX.k,cat:EX.k=='x'?EX.cat:'',a,m:EX.m,op:EX.m=='m'?EX.op:'',note:$('#xn').value.trim()});
 if(EX.m=='m')S.set.op=EX.op;
 save(true);M();toast(_('Enregistré ✓'));R()}
let XM=M0(Date.now());
SUB.exp=()=>{
 const a=XM,b=new Date(new Date(a).getFullYear(),new Date(a).getMonth()+1,1).getTime();
 const L=S.ex.filter(e=>!e.v&&e.t>=a&&e.t<b).sort((x,y)=>y.t-x.t);
 const tot=L.filter(e=>e.k=='x').reduce((s,e)=>s+e.a,0),by={};L.filter(e=>e.k=='x').forEach(e=>by[e.cat]=(by[e.cat]||0)+e.a);
 return `${backBtn('go(\'k\')')}<h3>💸 ${_('Dépenses')}</h3><div class="seg"><button onclick="XM=new Date(new Date(XM).getFullYear(),new Date(XM).getMonth()-1,1).getTime();R()">‹</button><button class="on" style="flex:3">${mlab(a)}</button><button onclick="XM=new Date(new Date(XM).getFullYear(),new Date(XM).getMonth()+1,1).getTime();R()">›</button></div>
<div class="sum"><small>${_('Dépenses du mois')}</small><div class="tot">${f(tot)}</div></div>
<div class="btns"><button class="b gr" onclick="exUI('x')">＋ ${_('Dépense')}</button><button class="b ol" onclick="exUI('w')">${_('Retrait du patron')}</button><button class="b ol" onclick="exUI('k')">${_('Apport')}</button></div>
${Object.keys(by).length?`<div class="card pl">${Object.keys(by).sort((x,y)=>by[y]-by[x]).map(c=>kv(_(XC[c]||'Autre'),f(by[c]))).join('')}</div>`:''}
<div class="card">${L.length?L.map(e=>`<div class="row"><div class="gr1"><b>${e.k=='x'?_(XC[e.cat]||'Autre'):e.k=='w'?_('Retrait du patron'):_('Apport d\'argent')}</b><small>${fdt(e.t)} · ${wl(e.m=='m'?opw(e.op):'c')}${e.note?' · '+esc(e.note):''}</small></div><b class="${e.k=='k'?'pos':''}">${e.k=='k'?'+':'-'}${f(e.a)}</b><button class="b xs ol" onclick="exDel('${e.id}')">✕</button></div>`).join(''):`<p class="hint">${_('Aucune dépense ce mois-ci.')}</p>`}</div>`};
function exDel(id){needOwner(()=>sure(_('Supprimer cette ligne ?'),()=>{const e=S.ex.find(x=>x.id==id);if(e){e.v=1;e.vt=Date.now()}save(true);R()},_('Supprimer')))}
// ---- ouverture et clôture de caisse
function trackW(){const w=['c'];if(S.set.mods.ag||S.s.some(s=>s.pay.some(p=>p.m=='m'))||S.cl.some(c=>c.h.some(h=>h.m=='m'))||S.ex.some(e=>e.m=='m'))w.push('om','mtn');if(S.s.some(s=>s.pay.some(p=>p.m=='m'&&opw(p.op)=='ot'))||S.ag.some(g=>opw(g.op)=='ot'))w.push('ot');return w}
const lastClose=u=>S.cx.filter(x=>x.by==u).slice(-1)[0];
function openCash(){
 if(S.cs[CU])return;const lc=lastClose(CU),ws=trackW();
 M(`<h2>${_('Ouvrir la caisse')}</h2><p class="hint" style="margin:0 0 6px">${_('Notez l\'argent qui est déjà dans le tiroir et sur vos comptes Mobile Money.')}</p>${ws.map(w=>`<label>${w=='c'?'💵 ':'📱 '}${wl(w)}</label><input class="in nm" data-w="${w}" inputmode="numeric" value="${lc&&lc.got[w]!=null?fm(lc.got[w]):''}" placeholder="0">`).join('')}${acts(_('Ouvrir'),'openOk()')}`)}
function openOk(){const o={};$$('#m [data-w]').forEach(e=>o[e.dataset.w]=num(e.value)||0);S.cs[CU]={t0:Date.now(),open:o};save(true);M();toast(_('Caisse ouverte ✓'));R()}
function sessExp(u){const s=S.cs[u];if(!s)return null;const e=Object.assign({},s.open);flows(s.t0,Date.now()+1).filter(x=>x.by==u).forEach(x=>{e[x.w]=(e[x.w]||0)+x.a});return e}
function closeCash(){
 const s=S.cs[CU];if(!s)return;const ex=sessExp(CU),ws=trackW().filter(w=>w=='c'||(ex[w]||0)!=0||(s.open[w]||0)!=0);
 M(`<h2>${_('Clôturer la caisse')}</h2><p class="hint" style="margin:0 0 6px">${_('Comptez l\'argent et notez le solde réel de chaque compte. L\'appli calcule l\'écart.')}</p>
${ws.map(w=>`<div class="card pl" style="margin:8px 0"><b>${w=='c'?'💵':'📱'} ${wl(w)}</b>${kv(_('Attendu'),f(ex[w]||0))}<label>${_('Compté / solde réel')}</label><input class="in nm" data-w="${w}" data-e="${ex[w]||0}" inputmode="numeric" oninput="clCalc(this)"><div class="kv"><span>${_('Écart')}</span><b id="cd_${w}">—</b></div></div>`).join('')}
<label>${_('Note (facultatif)')}</label><input class="in" id="cln">${acts(_('Clôturer'),'closeOk()')}`)}
function clCalc(e){const v=num(e.value),d=isNaN(v)?null:v-(+e.dataset.e);const el=$('#cd_'+e.dataset.w);el.textContent=d===null?'—':(d>0?'+':'')+f(d);el.className=d===null?'':d<0?'neg':d>0?'pos':'pos'}
function closeOk(){
 const s=S.cs[CU],ex=sessExp(CU),got={},diff={};let ok=true;
 $$('#m [data-w]').forEach(e=>{const v=num(e.value);if(isNaN(v)){ok=false;return}got[e.dataset.w]=v;diff[e.dataset.w]=v-(ex[e.dataset.w]||0)});
 if(!ok)return toast(_('Entrez le montant compté pour chaque ligne'));
 const rec={id:uid(),by:CU,t0:s.t0,t1:Date.now(),open:s.open,exp:ex,got,diff,note:$('#cln').value.trim()};
 S.cx.push(rec);delete S.cs[CU];save(true);
 const d=diff.c||0;
 M(`<h2>${_('Caisse clôturée')}</h2>${Object.keys(got).map(w=>kv(wl(w),(diff[w]>0?'+':'')+f(diff[w]),diff[w]<0?'neg':'pos')).join('')}<div class="bn ${d==0?'g':d<0?'r':'y'}">${d==0?_('Les espèces sont justes. Bravo !'):d<0?_('Il manque {n} en espèces.',{n:f(-d)}):_('Il y a {n} en trop en espèces.',{n:f(d)})}</div>
<div class="btns" style="padding:8px 0 0"><button class="b ol" onclick="clShare('${rec.id}')">${_('Envoyer le résumé')}</button></div><div class="pay2 o"><button class="b gr" onclick="M();R()">${_('Fermer')}</button></div>`)}
function clShare(id){const r=S.cx.find(x=>x.id==id),a=agg(DS(),r.t0,r.t1+1,r.by);
 const L=['*'+S.shop.name+'* — '+_('Clôture de caisse'),fdt(r.t1)+' — '+UN(r.by),_('Ventes')+' : '+f(a.rev),...Object.keys(r.got).map(w=>wl(w)+' : '+_('attendu')+' '+f(r.exp[w]||0)+', '+_('compté')+' '+f(r.got[w])+', '+_('écart')+' '+(r.diff[w]>0?'+':'')+f(r.diff[w]))];
 share(L.join('\n'))}
// ---- résumé du jour, à envoyer par WhatsApp (au patron, à un associé…)
function dayText(){
 const now=Date.now(),by=isO()?0:CU,a=agg(DS(),D0(now),D0(now)+DAY,by),mob=a.pay.om+a.pay.mtn+a.pay.ot;
 const top=Object.values(a.prod).filter(p=>p.q>0).sort((x,y)=>y.rev-x.rev).slice(0,3);
 const owed=S.cl.reduce((t,c)=>t+(c.a>0?c.a:0),0),late=S.cl.filter(c=>c.a>0&&c.due&&c.due<now).length,low=S.p.filter(p=>isLow(p)).length;
 return['*'+S.shop.name+'* — '+_('Résumé du {d}',{d:fdate(now)}),
  _('Ventes')+' : *'+f(a.rev-a.ret)+'* ('+a.n+' '+(a.n>1?_('ventes'):_('vente'))+')',
  '💵 '+_('Espèces')+' : '+f(a.pay.e),
  ...(mob?['📱 Mobile Money : '+f(mob)]:[]),
  ...(a.pay.c?['🧾 '+_('À crédit')+' : '+f(a.pay.c)]:[]),
  ...(a.rep?[_('Dettes remboursées')+' : '+f(a.rep)]:[]),
  ...(a.ret?[_('Retours remboursés')+' : '+f(a.ret)]:[]),
  ...(isO()&&a.exp?[_('Dépenses')+' : '+f(a.exp)]:[]),
  ...(seeCost()?[_('Bénéfice estimé')+' : '+f(a.profit)]:[]),
  ...(top.length?['',_('Les plus vendus')+' : '+top.map(p=>p.n+' ×'+fq(p.q)).join(', ')]:[]),
  ...(isO()&&owed?[_('Les clients vous doivent')+' : '+f(owed)+(late?' ('+_('{n} en retard',{n:late})+')':'')]:[]),
  ...(low?[_('Produits à recommander')+' : '+low]:[])].join('\n')}
function daySend(){share(dayText())}
// ---- écran Caisse
function KA(){
 const now=Date.now(),by=isO()?0:CU,a=agg(DS(),D0(now),D0(now)+DAY,by),ss=S.s.filter(s=>isToday(s.t)&&(isO()||s.by==CU)).sort((x,y)=>y.t-x.t);
 const sess=S.cs[CU],ex=sess?sessExp(CU):null,mob=a.pay.om+a.pay.mtn+a.pay.ot;
 const nm=ss.filter(s=>!s.v&&s.pay.some(p=>p.m=='m')).length,low=S.p.filter(p=>isLow(p)).length;
 const cl=S.cx.slice(-4).reverse().filter(c=>isO()||c.by==CU);
 return `<div class="sum"><small>${_('Ventes du jour')}</small><div class="tot">${f(a.rev-a.ret)}</div><small>${a.n} ${_('vente(s)')}${a.ret?' · '+_('retours')+' '+f(a.ret):''}</small></div>
<div class="btns"><button class="b ol sm" onclick="daySend()">📤 ${_('Envoyer le résumé du jour')}</button></div>
<div class="card pl">${sess?`<b>🟢 ${_('Caisse ouverte à {h}',{h:hm(sess.t0)})}</b>${kv('💵 '+_('Espèces attendues'),f(ex.c||0))}${Object.keys(ex).filter(w=>w!='c').map(w=>kv('📱 '+wl(w),f(ex[w]))).join('')}<div class="btns" style="padding:8px 0 0"><button class="b gr" onclick="closeCash()">${_('Clôturer la caisse')}</button></div>`:`<b>🔴 ${_('Caisse fermée')}</b><p class="sm2" style="margin:4px 0 8px">${_('Ouvrez la caisse pour que l\'appli vérifie l\'argent en fin de journée.')}</p><button class="b gr" onclick="openCash()">${_('Ouvrir la caisse')}</button>`}</div>
${isO()?`<div class="btns"><button class="b ol sm" onclick="exUI('x')">💸 ${_('Dépense')}</button><button class="b ol sm adv" onclick="go('k','exp')">${_('Voir les dépenses')}</button>${S.set.mods.ag?`<button class="b ol sm" onclick="go('k','ag')">📲 ${_('Agent Mobile Money')}</button>`:''}</div>`:(S.set.mods.ag?`<div class="btns"><button class="b ol sm" onclick="go('k','ag')">📲 ${_('Agent Mobile Money')}</button></div>`:'')}
${isO()&&typeof advCard=='function'?advCard():''}
<div class="card">${rowh('💵 '+_('Espèces'),f(a.pay.e))}${rowh('📱 Mobile Money',f(mob),nm?_('{n} paiement(s) à vérifier avec l\'opérateur',{n:nm}):'')}${rowh('🧾 '+_('À crédit'),f(a.pay.c))}${a.disc?rowh(_('Remises accordées'),f(a.disc)):''}${a.rep?rowh(_('Dettes remboursées'),f(a.rep)):''}${a.ret?rowh(_('Retours remboursés'),f(a.ret)):''}${isO()?rowh(_('Dépenses'),f(a.exp)):''}${a.com?rowh(_('Commissions Mobile Money'),f(a.com)):''}${seeCost()?rowh(_('Bénéfice estimé'),f(a.profit),isO()?_('après dépenses et pertes'):'',a.profit<0?'neg':''):''}${rowh(_('Produits à recommander'),low)}</div>
<h3>${_('Dernières ventes')}</h3><div class="card">${ss.length?ss.slice(0,8).map(saleRow).join(''):`<p class="hint">${_('Aucune vente aujourd\'hui.')}</p>`}</div><div class="btns"><button class="b ol sm" onclick="go('k','sales')">🧾 ${_('Toutes les ventes')}</button></div>
${cl.length?`<h3>${_('Dernières clôtures')}</h3><div class="card">${cl.map(c=>rowh(fdt(c.t1)+' — '+esc(UN(c.by)),(c.diff.c>0?'+':'')+f(c.diff.c||0),c.note?esc(c.note):'',(c.diff.c||0)<0?'neg':(c.diff.c||0)>0?'pos':'')).join('')}</div>`:''}`}
SCR.k=KA;
// ---- agent Mobile Money
const AGK={dep:X('Dépôt client'),ret:X('Retrait client'),in:X('Achat de float'),out:X('Retour de float en espèces')};
let AG=null;
function agUI(k){
 AG={k,op:S.set.op=='mtn'?'mtn':'om',cw:'c'};
 M(`<h2>${_(AGK[k])}</h2><div class="chips" style="padding:4px 0" id="ags">${[['om','Orange Money'],['mtn','MTN MoMo'],['ot',_('Autre')]].map(([c,l])=>`<button class="chip${AG.op==c?' on':''}" data-k="${c}" onclick="AG.op=this.dataset.k;$$('#ags .chip').forEach(b=>b.classList.toggle('on',b==this))">${l}</button>`).join('')}</div>
<label>${_('Montant (GNF)')}</label><input class="in nm" id="ga" inputmode="numeric" oninput="agCom()">
${k=='dep'||k=='ret'?`<label>${_('Votre commission (GNF)')}</label><input class="in nm" id="gc" inputmode="numeric" oninput="this.dataset.t=1"><div class="chips" style="padding:4px 0" id="agc"><button class="chip on" data-k="c" onclick="AG.cw=this.dataset.k;$$('#agc .chip').forEach(b=>b.classList.toggle('on',b==this))">${_('Reçue en espèces')}</button><button class="chip" data-k="w" onclick="AG.cw=this.dataset.k;$$('#agc .chip').forEach(b=>b.classList.toggle('on',b==this))">${_('Créditée sur le compte')}</button></div><label>${_('Téléphone du client (facultatif)')}</label><input class="in" id="gp" inputmode="tel">`:''}
<label>${_('Référence (facultatif)')}</label><input class="in" id="gr">${acts(_('Enregistrer'),'agOk()')}`)}
function agCom(){const r=+S.set.agRate||0;if(r>0&&$('#gc')&&!$('#gc').dataset.t){$('#gc').value=fm(Math.round((num($('#ga').value)||0)*r/100))}}
function agOk(){
 const a=num($('#ga').value);if(!(a>0))return toast(_('Montant invalide'));
 S.ag.push({id:uid(),t:Date.now(),by:CU,k:AG.k,op:AG.op,a,cm:$('#gc')?(num($('#gc').value)||0):0,cw:AG.cw,ph:$('#gp')?$('#gp').value.trim():'',ref:$('#gr').value.trim()});
 S.set.op=AG.op;save(true);M();toast(_('Opération enregistrée ✓'));R()}
SUB.ag=()=>{
 const t0=D0(Date.now()),L=S.ag.filter(g=>g.t>=t0&&(isO()||g.by==CU)).sort((x,y)=>y.t-x.t);
 const sum=k=>L.filter(g=>g.k==k).reduce((a,g)=>a+g.a,0),com=L.reduce((a,g)=>a+(g.cm||0),0);
 const ex=S.cs[CU]?sessExp(CU):null;
 return `${backBtn('go(\'k\')')}<h3>📲 ${_('Agent Mobile Money')}</h3>
<div class="btns"><button class="b gr" onclick="agUI('dep')">⬇ ${_('Dépôt client')}</button><button class="b yl" onclick="agUI('ret')">⬆ ${_('Retrait client')}</button></div><div class="btns"><button class="b ol sm" onclick="agUI('in')">${_('Acheter du float')}</button><button class="b ol sm" onclick="agUI('out')">${_('Rendre du float')}</button></div>
<div class="card">${rowh(_('Dépôts du jour'),f(sum('dep')))}${rowh(_('Retraits du jour'),f(sum('ret')))}${rowh(_('Commissions du jour'),f(com))}${ex?['om','mtn','ot'].filter(w=>ex[w]!=null).map(w=>rowh(_('Solde {w} attendu',{w:wl(w)}),f(ex[w]))).join('')+rowh(_('Espèces attendues'),f(ex.c||0)):`<p class="sm2">${_('Ouvrez la caisse pour suivre le solde attendu de vos comptes.')}</p>`}</div>
<div class="card">${L.length?L.map(g=>`<div class="row"><div class="gr1"><b>${_(AGK[g.k])} — ${wl(opw(g.op))}</b><small>${hm(g.t)}${g.ph?' · '+esc(g.ph):''}${g.cm?' · '+_('commission')+' '+f(g.cm):''}</small></div><b>${f(g.a)}</b></div>`).join(''):`<p class="hint">${_('Aucune opération aujourd\'hui.')}</p>`}</div>`};
