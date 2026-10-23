// ---- calculs et rapports : un seul endroit calcule tous les chiffres
const nextM=t=>{const d=new Date(t);return new Date(d.getFullYear(),d.getMonth()+1,1).getTime()};
const prevM=t=>{const d=new Date(t);return new Date(d.getFullYear(),d.getMonth()-1,1).getTime()};
const addM=(t,n)=>{const d=new Date(t);return new Date(d.getFullYear(),d.getMonth()+n,1).getTime()};
// période choisie -> [début, fin exclue, libellé]
function per(st){
 const now=Date.now(),t0=D0(now),k=st.k;
 if(k=='d')return[t0,t0+DAY,_('Aujourd\'hui')];
 if(k=='w')return[t0-6*DAY,t0+DAY,_('7 derniers jours')];
 if(k=='m')return[M0(now),nextM(M0(now)),mlab(now)];
 if(k=='p'){const a=prevM(M0(now));return[a,M0(now),mlab(a)]}
 if(k=='a'){const y=new Date(now).getFullYear();return[new Date(y,0,1).getTime(),new Date(y+1,0,1).getTime(),String(y)]}
 let a=pd(st.from),b=pd(st.to);if(isNaN(a))a=t0;if(isNaN(b))b=a;if(b<a){const x=a;a=b;b=x}
 return[a,b+DAY,fdate(a)+' → '+fdate(b)]}
const PK=[['d',X('Aujourd\'hui')],['w',X('7 jours')],['m',X('Ce mois')],['p',X('Mois dernier')],['a',X('Cette année')],['x',X('Autre…')]];
function perUI(st){
 return `<div class="chips">${PK.map(([k,l])=>`<button class="chip${st.k==k?' on':''}" onclick="${st.n}.k='${k}';R()">${_(l)}</button>`).join('')}</div>${st.k=='x'?`<div class="eq" style="padding:6px 16px 0"><input class="in" type="date" value="${esc(st.from)}" onchange="${st.n}.from=this.value;R()"><input class="in" type="date" value="${esc(st.to)}" onchange="${st.n}.to=this.value;R()"></div>`:''}`}
// ensemble des données utilisées par les calculs (peut aussi venir d'autres boutiques)
function agg(D,a,b,by){
 const rate=+S.set.tva||0,inR=(t,u)=>t>=a&&t<b&&(!by||u==by);
 const r={n:0,rev:0,sub:0,disc:0,cogs:0,ret:0,retc:0,pay:{e:0,om:0,mtn:0,ot:0,c:0},rep:0,exp:0,expc:{},wd:0,cap:0,com:0,agv:0,agn:0,loss:0,gain:0,tvc:0,tvd:0,buy:0,prod:{},cat:{},sel:{},hour:new Array(24).fill(0),day:{}};
 for(const s of D.s){
  if(s.v||!inR(s.t,s.by))continue;
  r.n++;r.rev+=s.total;r.sub+=s.sub||s.total;r.disc+=s.disc||0;
  for(const p of s.pay){if(p.m=='c')r.pay.c+=p.a;else if(p.m=='e')r.pay.e+=p.a;else r.pay[opw(p.op)]+=p.a}
  const k=s.sub?s.total/s.sub:1;
  for(const i of s.items){
   const rv=i.q*i.pr*k,cg=i.q*(i.c||0);r.cogs+=cg;
   if(i.tv!==0&&rate)r.tvc+=rv*rate/(100+rate);
   const o=r.prod[i.id]||(r.prod[i.id]={n:i.n+(i.g?' '+i.g:''),q:0,rev:0,cogs:0});
   o.q+=i.q*(i.f||1);o.rev+=rv;o.cogs+=cg;
   const c=i.cat||'',o2=r.cat[c]||(r.cat[c]={rev:0,cogs:0});o2.rev+=rv;o2.cogs+=cg}
  const se=r.sel[s.by]||(r.sel[s.by]={n:0,rev:0});se.n++;se.rev+=s.total;
  r.hour[new Date(s.t).getHours()]+=s.total;
  const dk=ymd(s.t);r.day[dk]=(r.day[dk]||0)+s.total}
 const rts=D.rt.filter(x=>inR(x.t,x.by));
 if(rts.length){
  const ix=new Map(D.s.map(s=>[s.id,s]));
  for(const x of rts){
   r.ret+=x.amt;const dk=ymd(x.t);r.day[dk]=(r.day[dk]||0)-x.amt;
   const s=ix.get(x.sid);if(!s)continue;const k=s.sub?s.total/s.sub:1;
   x.lines.forEach(l=>{const i=s.items[l.li];if(!i)return;const rv=l.q*i.pr*k;
    if(l.rs)r.retc+=l.q*(i.c||0);
    if(i.tv!==0&&rate)r.tvc-=rv*rate/(100+rate);
    const o=r.prod[i.id];if(o){o.rev-=rv;o.q-=l.q*(i.f||1);if(l.rs)o.cogs-=l.q*(i.c||0)}})}}
 for(const e of D.ex){
  if(e.v||!inR(e.t,e.by))continue;
  if(e.k=='x'){r.exp+=e.a;const c=e.cat||'autre';r.expc[c]=(r.expc[c]||0)+e.a}
  else if(e.k=='w')r.wd+=e.a;else if(e.k=='k')r.cap+=e.a}
 for(const c of D.cl)for(const h of c.h)if(h.v<0&&!h.x&&inR(h.t,h.by||1))r.rep+=-h.v;
 for(const g of D.ag){if(!inR(g.t,g.by))continue;r.com+=g.cm||0;r.agv+=g.a;r.agn++}
 for(const j of D.adj){if(j.why=='init'||!inR(j.t,j.by))continue;if(j.d<0)r.loss+=-j.d*j.c;else if(j.why=='count')r.gain+=j.d*j.c}
 for(const u of D.pu){if(u.v||!inR(u.t,u.by))continue;r.buy+=u.tot;if(rate)u.lines.forEach(l=>{if(l.tv!==0)r.tvd+=Math.round(l.uq*l.uc)*rate/(100+rate)})}
 r.net=r.rev-r.ret;r.cost=r.cogs-r.retc;r.gross=r.net-r.cost;
 r.profit=r.gross-r.exp-r.loss+r.gain+r.com;
 return r}
// ---- graphiques (dessinés ici, sans internet)
function barSVG(vals,labs,o){
 o=o||{};const n=vals.length;if(!n)return'';
 const W=360,H=o.h||150,pb=22,pt=14,pl=3,mx=Math.max(1,...vals),bw=(W-pl*2)/n;
 let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.t||'')}">`;
 vals.forEach((v,i)=>{const h=(H-pb-pt)*Math.max(v,0)/mx;s+=`<rect x="${(pl+i*bw+bw*.12).toFixed(1)}" y="${(H-pb-h).toFixed(1)}" width="${(bw*.76).toFixed(1)}" height="${(v>0?Math.max(h,1):0).toFixed(1)}" rx="2.5" style="fill:${o.c||'var(--ac)'}"><title>${esc(labs[i]+' : '+fm(v))}</title></rect>`});
 const st=Math.ceil(n/(o.nl||7));
 labs.forEach((l,i)=>{if(i%st==0)s+=`<text x="${(pl+i*bw+bw/2).toFixed(1)}" y="${H-7}" font-size="9" text-anchor="middle" fill="#5C6A61">${esc(l)}</text>`});
 return s+`<text x="${W-2}" y="10" font-size="9" text-anchor="end" fill="#5C6A61">max ${esc(fm(mx))}</text></svg>`}
function hbar(label,v,mx,right,cls){return `<div class="kv"><span>${label}</span><b>${right}</b></div><div class="bar${cls?' '+cls:''}"><i style="width:${mx>0?Math.max(0,Math.min(100,v*100/mx)).toFixed(1):0}%"></i></div>`}
// ventes par jour (ou par mois si la période est longue)
function daySeries(r,a,b){
 const days=Math.round((b-a)/DAY),vals=[],labs=[];
 if(days<=62){for(let t=a;t<b;t+=DAY){const k=ymd(t);vals.push(r.day[k]||0);const d=new Date(t);labs.push(d.getDate()+'/'+(d.getMonth()+1))}}
 else{const m={};Object.keys(r.day).forEach(k=>{const kk=k.slice(0,7);m[kk]=(m[kk]||0)+r.day[k]});
  for(let t=M0(a);t<b;t=nextM(t)){const k=ymd(t).slice(0,7);vals.push(m[k]||0);labs.push(MON[new Date(t).getMonth()].slice(0,3))}}
 return{vals,labs}}
// ---- fichiers et impression
async function outFile(n,t,y){if(FR)return frNo();if(!(await shareFile(n,t,y)))dl(n,t,y)}
const tbl=(head,rows)=>`<table><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const docHead=(t,s)=>`<div class="doc"><h1>${esc(S.shop.name)}</h1><div>${esc([S.shop.addr,S.shop.tel?_('Tél.')+' '+S.shop.tel:'',S.shop.nif?'NIF '+S.shop.nif:''].filter(Boolean).join(' · '))}</div><h2 style="font-size:17px;border:0;margin-top:10px">${esc(t)}</h2><div>${esc(s)} — ${esc(_('établi le {d}',{d:fdate(Date.now())}))}</div>`;
const docTail=()=>`<p style="margin-top:14px;font-size:10px">${esc(_('Document établi à partir des données saisies dans Boutique Facile. Il n\'est pas certifié par un tiers.'))}</p></div>`;
const PAYN={e:X('Espèces'),om:'Orange Money',mtn:'MTN MoMo',ot:X('Autre mobile'),c:X('À crédit')};
// ---- écran Rapports
let RP={n:'RP',k:'w',from:'',to:''};
SUB.rep=()=>{
 const [a,b,lab]=per(RP),r=agg(DS(),a,b,0),sc=seeCost();
 const ser=daySeries(r,a,b),pm=Object.keys(r.pay).filter(k=>r.pay[k]>0),pmx=Math.max(1,...pm.map(k=>r.pay[k]));
 const top=Object.keys(r.prod).map(k=>Object.assign({id:k},r.prod[k])).filter(x=>x.rev>0||x.q>0).sort((x,y)=>y.rev-x.rev).slice(0,10);
 const cats=Object.keys(r.cat).map(k=>({k,v:r.cat[k]})).sort((x,y)=>y.v.rev-x.v.rev),cmx=Math.max(1,...cats.map(c=>c.v.rev));
 const hmx=Math.max(...r.hour),sellers=Object.keys(r.sel);
 return `${backBtn("go('p')")}<h3>📊 ${_('Rapports')}</h3>${perUI(RP)}
<div class="sum"><small>${esc(lab)}</small><div class="tot">${f(r.net)}</div><small>${r.n} ${_('vente(s)')}${r.n?' · '+_('panier moyen')+' '+f(r.rev/r.n):''}</small></div>
<div class="card">${rowh(_('Ventes'),f(r.rev))}${r.ret?rowh(_('Retours remboursés'),'-'+f(r.ret)):''}${r.disc?rowh(_('Remises accordées'),f(r.disc)):''}${sc?rowh(_('Coût d\'achat des produits vendus'),f(r.cost)):''}${sc?rowh(_('Marge brute'),f(r.gross),r.net?pcs(r.gross,r.net)+' %':'',r.gross<0?'neg':'pos'):''}${isO()?rowh(_('Dépenses'),f(r.exp)):''}${isO()&&r.loss?rowh(_('Pertes de stock'),f(r.loss),_('casse, vol, périmés, écarts')):''}${r.com?rowh(_('Commissions Mobile Money'),f(r.com)):''}${isO()?rowh('<b>'+_('Bénéfice estimé')+'</b>',f(r.profit),'',r.profit<0?'neg':'pos'):''}${rowh(_('Dettes remboursées par les clients'),f(r.rep))}</div>
<h3>${_('Ventes par jour')}</h3><div class="card pl ch">${barSVG(ser.vals,ser.labs,{t:_('Ventes')})}</div>
<h3>${_('Moyens de paiement')}</h3><div class="card pl">${pm.length?pm.map(k=>hbar(_(PAYN[k]),r.pay[k],pmx,f(r.pay[k]),k=='c'?'w':'')).join(''):`<p class="hint" style="margin:0">${_('Aucune vente.')}</p>`}</div>
<h3>${_('Produits les plus vendus')}</h3><div class="card pl sc">${top.length?`<table class="tb"><tr><th>${_('Produit')}</th><th>${_('Qté')}</th><th>${_('Ventes')}</th>${sc?`<th>${_('Marge')}</th>`:''}</tr>${top.map(x=>`<tr><td>${esc(x.n)}</td><td>${fq(x.q)}</td><td>${fm(x.rev)}</td>${sc?`<td class="${x.rev-x.cogs<0?'neg':''}">${fm(x.rev-x.cogs)}</td>`:''}</tr>`).join('')}</table>`:`<p class="hint" style="margin:0">${_('Aucune vente.')}</p>`}</div>
${cats.length>1||(cats.length==1&&cats[0].k)?`<h3>${_('Par catégorie')}</h3><div class="card pl">${cats.map(c=>hbar(esc(c.k||_('Sans catégorie')),c.v.rev,cmx,f(c.v.rev)+(sc?' · '+pcs(c.v.rev-c.v.cogs,c.v.rev)+' %':''))).join('')}</div>`:''}
${hmx>0?`<h3>${_('Heures de vente')}</h3><div class="card pl ch">${barSVG(r.hour,r.hour.map((v,i)=>i+'h'),{t:_('Heures de vente'),nl:8})}</div>`:''}
${isO()&&sellers.length>1?`<h3>${_('Par vendeur')}</h3><div class="card">${sellers.map(k=>rowh(esc(UN(+k)||'?'),f(r.sel[k].rev),r.sel[k].n+' '+_('vente(s)'))).join('')}</div>`:''}
<div class="btns"><button class="b ol sm" onclick="repShare()">${_('Envoyer le résumé')}</button><button class="b ol sm nf" onclick="repPrint()">${_('Imprimer / PDF')}</button><button class="b ol sm" onclick="repCSV()">${_('Fichier Excel (CSV)')}</button></div>`};
function repShare(){
 const [a,b,lab]=per(RP),r=agg(DS(),a,b,0),sc=seeCost();
 share(['*'+S.shop.name+'* — '+lab,_('Ventes')+' : '+f(r.net)+' ('+r.n+')',...(sc?[_('Marge brute')+' : '+f(r.gross)]:[]),...cond(isO(),[_('Dépenses')+' : '+f(r.exp),_('Bénéfice estimé')+' : '+f(r.profit)])].join('\n'))}
const cond=(c,a)=>c?a:[];
function repPrint(){
 const [a,b,lab]=per(RP),r=agg(DS(),a,b,0),sc=seeCost();
 const top=Object.keys(r.prod).map(k=>r.prod[k]).sort((x,y)=>y.rev-x.rev).slice(0,15);
 printHTML(docHead(_('Rapport des ventes'),lab)+`<h2>${esc(_('Résumé'))}</h2>`+tbl([_('Ligne'),_('Montant (GNF)')],[[_('Ventes'),fm(r.rev)],[_('Retours'),'-'+fm(r.ret)],[_('Ventes nettes'),fm(r.net)],...(sc?[[_('Coût d\'achat des produits vendus'),fm(r.cost)],[_('Marge brute'),fm(r.gross)]]:[]),...(isO()?[[_('Dépenses'),fm(r.exp)],[_('Pertes de stock'),fm(r.loss)],[_('Commissions Mobile Money'),fm(r.com)],[_('Bénéfice estimé'),fm(r.profit)]]:[])])
 +`<h2>${esc(_('Moyens de paiement'))}</h2>`+tbl([_('Moyen'),_('Montant (GNF)')],Object.keys(r.pay).filter(k=>r.pay[k]>0).map(k=>[_(PAYN[k]),fm(r.pay[k])]))
 +`<h2>${esc(_('Produits les plus vendus'))}</h2>`+tbl([_('Produit'),_('Qté'),_('Ventes'),...(sc?[_('Marge')]:[])],top.map(x=>[esc(x.n),fq(x.q),fm(x.rev),...(sc?[fm(x.rev-x.cogs)]:[])]))+docTail())}
function repCSV(){
 const [a,b]=per(RP),rows=[[_('Date'),_('Heure'),_('N° reçu'),_('Vendeur'),_('Client'),_('Produit'),_('Quantité'),_('Format'),_('Prix unitaire'),_('Total ligne'),_('Remise de la vente'),_('Paiement'),_('Annulée')]];
 S.s.filter(s=>s.t>=a&&s.t<b&&(isO()||s.by==CU)).sort((x,y)=>x.t-y.t).forEach(s=>s.items.forEach(i=>rows.push([ymd(s.t),hm(s.t),rcNo(s),UN(s.by),s.cl||'',i.n+(i.g?' '+i.g:''),i.q,i.u||'',i.pr,Math.round(i.q*i.pr),s.disc||0,s.pay.filter(p=>p.a>0).map(p=>payLbl(p)+' '+p.a).join(' + '),s.v?_('oui'):''])));
 outFile('ventes_'+ymd(a)+'.csv',toCSV(rows),'text/csv')}
