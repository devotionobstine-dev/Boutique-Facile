// ---- comptabilité simplifiée pour le comptable
let CP={n:'CP',k:'m',from:'',to:'',v:'res',w:'*'};
function resRows(r){
 const L=[];
 L.push([_('Ventes (toutes taxes comprises)'),r.rev]);
 if(r.ret)L.push([_('Retours remboursés'),-r.ret]);
 L.push([_('Ventes nettes'),r.net,1]);
 L.push([_('Coût d\'achat des marchandises vendues'),-r.cost]);
 L.push([_('Marge brute'),r.gross,1]);
 Object.keys(r.expc).sort((a,b)=>r.expc[b]-r.expc[a]).forEach(k=>L.push([_(XC[k]||'Autre'),-r.expc[k]]));
 if(r.loss-r.gain)L.push([_('Pertes de stock (casse, vol, périmés, écarts)'),-(r.loss-r.gain)]);
 if(r.com)L.push([_('Commissions Mobile Money gagnées'),r.com]);
 L.push([_('Résultat de la période'),r.profit,1]);
 return L}
function cashPos(){
 const pos={};let any=0;
 S.users.forEach(u=>{
  let base=null;
  if(S.cs[u.id])base=sessExp(u.id);
  else{const lc=lastClose(u.id);if(lc){base=Object.assign({},lc.got);flows(lc.t1,Date.now()+1).filter(x=>x.by==u.id).forEach(x=>{base[x.w]=(base[x.w]||0)+x.a})}}
  if(base){any=1;for(const w in base)pos[w]=(pos[w]||0)+base[w]}});
 return any?pos:null}
function situation(){
 const sv=stockVal(),cr=S.cl.reduce((a,c)=>a+Math.max(c.a,0),0),sd=supDebt(),cp=cashPos(),tr=cp?Object.keys(cp).reduce((a,w)=>a+cp[w],0):null;
 return{sv,cr,sd,cp,tr,net:sv+cr+(tr||0)-sd}}
const WF=[['*',X('Tous')],['c',X('Espèces')],['om','Orange Money'],['mtn','MTN MoMo'],['ot',X('Autre mobile')]];
function livre(a,b){const L=flows(a,b);return CP.w=='*'?L:L.filter(x=>x.w==CP.w)}
SUB.cpt=()=>{
 const [a,b,lab]=per(CP),sc=CP.v;
 let body='';
 if(sc=='res'){
  const r=agg(DS(),a,b,0),rows=resRows(r);
  body=`<div class="card">${rows.map(x=>x[2]?`<div class="kv"><b>${x[0]}</b><b class="${x[1]<0?'neg':'pos'}">${f(x[1])}</b></div>`:kv(x[0],f(x[1]))).join('')}</div>
<h3>${_('À côté du résultat')}</h3><div class="card">${kv(_('Marchandises achetées'),f(r.buy))}${kv(_('Dettes clients encaissées'),f(r.rep))}${kv(_('Retraits du patron'),f(r.wd))}${kv(_('Apports d\'argent'),f(r.cap))}${kv(_('Remises accordées'),f(r.disc))}</div>
${S.set.mods.tv?`<h3>${_('TVA (estimation)')}</h3><div class="card">${kv(_('TVA sur les ventes'),f(r.tvc))}${kv(_('TVA sur les achats'),f(r.tvd))}${kv('<b>'+_('TVA à reverser')+'</b>',f(r.tvc-r.tvd),r.tvc-r.tvd<0?'pos':'')}<p class="sm2">${_('Calculée avec un taux de {t} % compris dans les prix. À vérifier avec votre comptable.',{t:S.set.tva})}</p></div>`:''}`}
 else if(sc=='liv'){
  const L=livre(a,b),en=L.filter(x=>x.a>0).reduce((s,x)=>s+x.a,0),so=L.filter(x=>x.a<0).reduce((s,x)=>s-x.a,0),sh=L.slice(-300);
  let cum=L.length>sh.length?L.slice(0,L.length-sh.length).reduce((s,x)=>s+x.a,0):0,day='';
  const trs=[];
  sh.forEach(x=>{const dk=ymd(x.t);if(dk!=day){day=dk;trs.push(`<tr><td colspan="4" style="text-align:left;font-weight:700;background:var(--bl)">${fdate(x.t)}</td></tr>`)}cum+=x.a;
   trs.push(`<tr><td>${hm(x.t)} ${esc(x.d)}<br><small style="color:var(--mut)">${esc(wl(x.w))}</small></td><td class="pos">${x.a>0?fm(x.a):''}</td><td class="neg">${x.a<0?fm(-x.a):''}</td><td>${fm(cum)}</td></tr>`)});
  body=`<div class="chips">${WF.map(([k,l])=>`<button class="chip${CP.w==k?' on':''}" onclick="CP.w='${k}';R()">${_(l)}</button>`).join('')}</div>
<div class="card">${kv(_('Entrées'),f(en),'pos')}${kv(_('Sorties'),f(so),'neg')}${kv('<b>'+_('Solde de la période')+'</b>',f(en-so))}</div>
<div class="card pl sc">${L.length?`<table class="tb"><tr><th>${_('Détail')}</th><th>${_('Entrée')}</th><th>${_('Sortie')}</th><th>${_('Cumul')}</th></tr>${trs.join('')}</table>${L.length>sh.length?`<p class="sm2">${_('Seuls les {n} derniers mouvements sont affichés ici. Le fichier CSV contient tout.',{n:300})}</p>`:''}`:`<p class="hint" style="margin:0">${_('Aucun mouvement sur cette période.')}</p>`}</div>
<p class="sm2" style="margin:6px 16px">${_('Les ventes à crédit n\'apparaissent pas ici : l\'argent n\'est pas encore rentré.')}</p>`}
 else{
  const s=situation();
  body=`<div class="bn y">${_('Situation à aujourd\'hui. La trésorerie est une estimation basée sur vos dernières clôtures de caisse.')}</div>
<h3>${_('Ce que vous avez')}</h3><div class="card">${kv(_('Valeur du stock (prix d\'achat moyen)'),f(s.sv))}${kv(_('Clients qui vous doivent'),f(s.cr))}${s.cp?Object.keys(s.cp).map(w=>kv(wl(w),f(s.cp[w]))).join(''):`<p class="sm2">${_('Faites une clôture de caisse pour connaître votre argent disponible.')}</p>`}</div>
<h3>${_('Ce que vous devez')}</h3><div class="card">${kv(_('Dettes envers les fournisseurs'),f(s.sd))}</div>
<div class="sum"><small>${_('Valeur nette estimée')}</small><div class="tot">${f(s.net)}</div></div>`}
 return `${backBtn("go('p')")}<h3>📒 ${_('Comptabilité')}</h3>
<div class="bn b">${_('Documents indicatifs, faits avec vos saisies. À faire valider par un comptable avant toute déclaration.')}</div>
<div class="seg"><button class="${sc=='res'?'on':''}" onclick="CP.v='res';R()">${_('Résultat')}</button><button class="${sc=='liv'?'on':''}" onclick="CP.v='liv';R()">${_('Livre de caisse')}</button><button class="${sc=='sit'?'on':''}" onclick="CP.v='sit';R()">${_('Situation')}</button></div>
${sc!='sit'?perUI(CP)+`<div class="sum"><small>${esc(lab)}</small></div>`:''}${body}
<h3>${_('Pour le comptable')}</h3>
<div class="btns"><button class="b ol sm nf" onclick="cptPrint()">🖨 ${_('Imprimer / PDF')}</button><button class="b ol sm" onclick="cptCSV('liv')">${_('Livre de caisse (CSV)')}</button><button class="b ol sm" onclick="cptCSV('ven')">${_('Ventes (CSV)')}</button><button class="b ol sm" onclick="cptCSV('dep')">${_('Dépenses et achats (CSV)')}</button><button class="b ol sm" onclick="cptCSV('stk')">${_('Stock valorisé (CSV)')}</button><button class="b ol sm" onclick="cptCSV('det')">${_('Créances et dettes (CSV)')}</button></div>`};
function cptCSV(k){
 const [a,b]=per(CP);let rows,n;
 if(k=='liv'){n='livre_de_caisse';rows=[[_('Date'),_('Heure'),_('Compte'),_('Type'),_('Libellé'),_('Entrée'),_('Sortie'),_('Saisi par')]];flows(a,b).forEach(x=>rows.push([ymd(x.t),hm(x.t),wl(x.w),x.k,x.d,x.a>0?x.a:'',x.a<0?-x.a:'',UN(x.by)]))}
 else if(k=='ven'){return repCSVfor(a,b)}
 else if(k=='dep'){n='depenses_achats';rows=[[_('Date'),_('Type'),_('Catégorie ou fournisseur'),_('Montant'),_('Payé avec'),_('Note')]];
  S.ex.filter(e=>!e.v&&e.t>=a&&e.t<b).forEach(e=>rows.push([ymd(e.t),e.k=='x'?_('Dépense'):e.k=='w'?_('Retrait du patron'):_('Apport'),e.k=='x'?_(XC[e.cat]||'Autre'):'',e.a,wl(e.m=='m'?opw(e.op):'c'),e.note||'']));
  S.pu.filter(u=>!u.v&&u.t>=a&&u.t<b).forEach(u=>rows.push([ymd(u.t),_('Achat de marchandises'),u.supn||'',u.tot,u.pd>=u.tot?wl(u.pm=='m'?opw(u.op):'c'):_('Payé {a}, reste {b}',{a:u.pd,b:u.tot-u.pd}),u.inv||'']))}
 else if(k=='stk'){n='stock_valorise';rows=[[_('Produit'),_('Catégorie'),_('Quantité'),_('Unité'),_('Prix d\'achat moyen'),_('Valeur'),_('Prix de vente')]];
  S.p.filter(p=>!p.off).forEach(p=>rows.push([p.n+(p.g?' '+p.g:''),p.cat||'',p.q,p.bu||'',p.c,Math.round(Math.max(p.q,0)*p.c),p.pr]))}
 else{n='creances_dettes';rows=[[_('Type'),_('Nom'),_('Téléphone'),_('Montant'),_('Échéance')]];
  S.cl.filter(c=>c.a>0).forEach(c=>rows.push([_('Client'),c.n,c.tel||'',c.a,c.due?ymd(c.due):'']));
  S.sup.filter(s=>s.a>0).forEach(s=>rows.push([_('Fournisseur'),s.n,s.tel||'',s.a,'']))}
 outFile(n+'_'+ymd(Date.now())+'.csv',toCSV(rows),'text/csv')}
function repCSVfor(a,b){const sv=RP.k,sf=RP.from,st=RP.to;RP.k='x';RP.from=ymd(a);RP.to=ymd(b-DAY);repCSV();RP.k=sv;RP.from=sf;RP.to=st}
function cptPrint(){
 const [a,b,lab]=per(CP),r=agg(DS(),a,b,0),s=situation(),rows=resRows(r),LL=flows(a,b),MAXP=2000,L=LL.slice(-MAXP);
 let cum=LL.length>L.length?LL.slice(0,LL.length-L.length).reduce((t,x)=>t+x.a,0):0;
 printHTML(docHead(_('Dossier comptable'),lab)
 +`<h2>${esc(_('Résultat simplifié'))}</h2>`+tbl([_('Ligne'),_('Montant (GNF)')],rows.map(x=>[x[2]?'<b>'+esc(x[0])+'</b>':esc(x[0]),x[2]?'<b>'+fm(x[1])+'</b>':fm(x[1])]))
 +(S.set.mods.tv?`<h2>${esc(_('TVA (estimation)'))}</h2>`+tbl([_('Ligne'),_('Montant (GNF)')],[[_('TVA sur les ventes'),fm(r.tvc)],[_('TVA sur les achats'),fm(r.tvd)],[_('TVA à reverser'),fm(r.tvc-r.tvd)]]):'')
 +`<h2>${esc(_('Situation à aujourd\'hui'))}</h2>`+tbl([_('Ligne'),_('Montant (GNF)')],[[_('Valeur du stock (prix d\'achat moyen)'),fm(s.sv)],[_('Clients qui doivent'),fm(s.cr)],...(s.cp?Object.keys(s.cp).map(w=>[esc(wl(w))+' ('+_('estimation')+')',fm(s.cp[w])]):[]),[_('Dettes envers les fournisseurs'),'-'+fm(s.sd)],[_('Valeur nette estimée'),fm(s.net)]])
 +`<h2>${esc(_('Livre de caisse'))}</h2>`+tbl([_('Date'),_('Libellé'),_('Compte'),_('Entrée'),_('Sortie'),_('Cumul')],L.map(x=>{cum+=x.a;return[fdate(x.t),esc(x.d),esc(wl(x.w)),x.a>0?fm(x.a):'',x.a<0?fm(-x.a):'',fm(cum)]}))
 +(LL.length>L.length?`<p style="font-size:10px"><b>${esc(_('Seuls les {n} derniers mouvements sont imprimés. Le fichier CSV contient tout.',{n:MAXP}))}</b></p>`:'')
 +`<p style="font-size:10px">${esc(_('Les ventes à crédit ne figurent pas dans le livre de caisse. À valider par un comptable.'))}</p>`+docTail())}
// ---- dossier pour une banque ou une microfinance
let BP={m:6,amt:'',obj:'',own:''};
function bankData(){
 const now=Date.now();let first=now;for(const s of S.s)if(s.t<first)first=s.t;
 const rows=[];let tn=0,te=0,tp=0,nv=0,months=0;
 for(let i=BP.m-1;i>=0;i--){
  const a=addM(M0(now),-i),b=nextM(a);
  if(S.s.length&&b<=first)continue;
  const r=agg(DS(),a,b,0);rows.push({a,r});tn+=r.net;te+=r.exp;tp+=r.profit;nv+=r.n;months++}
 const all=agg(DS(),rows.length?rows[0].a:M0(now),nextM(M0(now)),0);
 return{rows,tn,te,tp,nv,months,all,days:Math.max(1,Math.round((now-Math.min(first,now))/DAY)),first}}
SUB.bank=()=>{
 const d=bankData(),s=situation();
 return `${backBtn("go('p')")}<h3>🏦 ${_('Dossier pour une banque')}</h3>
<div class="bn b">${_('Un document d\'une page avec vos chiffres réels des derniers mois, à imprimer ou envoyer en PDF. Il est établi par vous, à partir de vos ventes enregistrées : il n\'est pas certifié.')}</div>
<div class="card pl"><label>${_('Période')}</label><div class="seg" style="margin:4px 0 0">${[3,6,12].map(m=>`<button class="${BP.m==m?'on':''}" onclick="BP.m=${m};R()">${m} ${_('mois')}</button>`).join('')}</div>
<label>${_('Montant demandé (GNF, facultatif)')}</label><input class="in nm" inputmode="numeric" value="${BP.amt?fm(num(BP.amt)):''}" oninput="BP.amt=this.value">
<label>${_('Objet du financement (facultatif)')}</label><input class="in" value="${esc(BP.obj)}" oninput="BP.obj=this.value">
<label>${_('Nom du gérant')}</label><input class="in" value="${esc(BP.own||S.shop.own||'')}" oninput="BP.own=this.value"></div>
<div class="card">${kv(_('Données disponibles'),d.days+' '+_('jours'))}${kv(_('Ventes sur la période'),f(d.tn))}${kv(_('Ventes moyennes par mois'),f(d.months?d.tn/d.months:0))}${kv(_('Nombre de ventes'),d.nv)}${kv(_('Résultat estimé sur la période'),f(d.tp),d.tp<0?'neg':'pos')}${kv(_('Valeur du stock'),f(s.sv))}${kv(_('Clients qui doivent'),f(s.cr))}</div>
${d.days<60?`<div class="bn y">${_('Vous n\'utilisez l\'application que depuis {n} jours : le dossier sera plus convaincant avec plus de mois de ventes.',{n:d.days})}</div>`:''}
<div class="btns"><button class="b gr nf" onclick="bankPrint()">🖨 ${_('Imprimer / PDF')}</button><button class="b ol" onclick="bankShare()">${_('Envoyer le résumé')}</button></div>`};
function bankShare(){
 const d=bankData(),s=situation();
 share(['*'+S.shop.name+'* — '+_('Résumé d\'activité'),..._bankTxt(d,s)].join('\n'))}
const _bankTxt=(d,s)=>[_('Période : {n} derniers mois',{n:BP.m}),_('Ventes')+' : '+f(d.tn),_('Ventes moyennes par mois')+' : '+f(d.months?d.tn/d.months:0),_('Résultat estimé')+' : '+f(d.tp),_('Valeur du stock')+' : '+f(s.sv),...(BP.amt?[_('Montant demandé')+' : '+f(num(BP.amt))]:[]),_('Données issues de l\'application Boutique Facile, non certifiées.')];
function bankPrint(){
 const d=bankData(),s=situation(),own=BP.own||S.shop.own||'';
 printHTML(docHead(_('Dossier d\'activité commerciale'),_('{n} derniers mois',{n:BP.m}))
 +`<h2>${esc(_('Le commerce'))}</h2>`+tbl([_('Information'),_('Détail')],[[_('Nom'),esc(S.shop.name)],[_('Gérant'),esc(own)],[_('Adresse'),esc(S.shop.addr||'')],[_('Téléphone'),esc(S.shop.tel||'')],[_('NIF'),esc(S.shop.nif||'')],[_('Début des enregistrements'),S.s.length?fdate(d.first):'']])
 +(BP.amt||BP.obj?`<h2>${esc(_('Demande'))}</h2>`+tbl([_('Information'),_('Détail')],[[_('Montant demandé'),BP.amt?fm(num(BP.amt))+' GNF':''],[_('Objet'),esc(BP.obj)]]):'')
 +`<h2>${esc(_('Activité mois par mois'))}</h2>`+tbl([_('Mois'),_('Ventes nettes'),_('Dépenses'),_('Résultat estimé'),_('Nb ventes')],d.rows.map(x=>[mlab(x.a),fm(x.r.net),fm(x.r.exp),fm(x.r.profit),x.r.n]).concat([['<b>'+esc(_('Total'))+'</b>','<b>'+fm(d.tn)+'</b>','<b>'+fm(d.te)+'</b>','<b>'+fm(d.tp)+'</b>','<b>'+d.nv+'</b>']]))
 +`<h2>${esc(_('Indicateurs'))}</h2>`+tbl([_('Indicateur'),_('Valeur')],[[_('Ventes moyennes par mois'),fm(d.months?d.tn/d.months:0)+' GNF'],[_('Panier moyen'),fm(d.nv?d.tn/d.nv:0)+' GNF'],[_('Valeur du stock (prix d\'achat)'),fm(s.sv)+' GNF'],[_('Clients qui doivent'),fm(s.cr)+' GNF'],[_('Dettes envers les fournisseurs'),fm(s.sd)+' GNF']])
 +`<p style="margin-top:22px">${esc(_('Je certifie que ces chiffres sont tirés de mes enregistrements.'))}</p><p style="margin-top:36px">${esc(_('Fait le {d}',{d:fdate(Date.now())}))} — ${esc(_('Signature'))} : ______________________</p>`+docTail())}
