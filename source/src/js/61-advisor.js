// ---- conseiller hors ligne : des calculs sur vos ventes, sans internet ni intelligence artificielle en ligne
let advC={k:'',v:null};
function advice(){
 const key=[S.s.length,S.rt.length,S.p.length,S.cl.length,S.ex.length,S.cx.length,S.adj.length,S.pu.length,Math.floor(Date.now()/60000)].join();
 if(advC.k==key)return advC.v;
 const now=Date.now(),t0=D0(now),sm=soldMap(30),sm60=soldMap(60);
 let first=now;for(const s of S.s)if(s.t<first)first=s.t;
 const hist=(now-first)/DAY,out=[],dor=[],low=[];
 S.p.filter(p=>!p.off).forEach(p=>{
  const v=(sm[p.id]||0)/30,av=Math.max(avail(p),0);
  if(v>0){const d=av/v;if(d<=10)out.push({p,v,d:Math.floor(d),q:av,sug:sugQ(p,sm)})}
  if(p.c>0&&p.pr>0&&p.pr<p.c)low.push({p,why:'price'});
  if(hist>=45&&p.q>0&&p.c>0&&!(sm60[p.id]>0))dor.push({p,val:p.q*p.c})});
 out.sort((a,b)=>a.d-b.d);dor.sort((a,b)=>b.val-a.val);
 // ventes faites sous le prix d'achat (30 derniers jours)
 const cut=now-30*DAY,under={};
 for(const s of S.s){if(s.v||s.t<cut)continue;for(const i of s.items)if(i.c>0&&i.pr<i.c){const o=under[i.id]||(under[i.id]={n:i.n,q:0,lost:0});o.q+=i.q;o.lost+=(i.c-i.pr)*i.q}}
 const sold=Object.keys(under).map(k=>under[k]).sort((a,b)=>b.lost-a.lost);
 // tendance : 7 derniers jours contre les 7 jours d'avant
 const w1=agg(DS(),t0-6*DAY,t0+DAY,0),w0=agg(DS(),t0-13*DAY,t0-6*DAY,0);
 const tr=w0.net>0?Math.round((w1.net-w0.net)*100/w0.net):null;
 const ids=new Set(Object.keys(w1.prod).concat(Object.keys(w0.prod))),mv=[];
 ids.forEach(k=>{const a=(w1.prod[k]||{}).rev||0,b=(w0.prod[k]||{}).rev||0,n=(w1.prod[k]||w0.prod[k]).n;if(Math.max(a,b)>=Math.max(1,w1.net*.02))mv.push({n,a,b,d:a-b})});
 mv.sort((x,y)=>y.d-x.d);
 const m30=agg(DS(),t0-29*DAY,t0+DAY,0),best=Object.keys(m30.prod).map(k=>Object.assign({id:k},m30.prod[k])).map(x=>Object.assign(x,{m:x.rev-x.cogs})).filter(x=>x.m>0).sort((a,b)=>b.m-a.m).slice(0,5);
 const late=S.cl.filter(c=>c.a>0&&c.due&&c.due<now).sort((a,b)=>b.a-a.a),lateT=late.reduce((a,c)=>a+c.a,0);
 const cl5=S.cx.slice(-5),gaps=cl5.filter(c=>(c.diff.c||0)<0),gapT=gaps.reduce((a,c)=>a-(c.diff.c||0),0);
 const v={out,dor,dorT:dor.reduce((a,x)=>a+x.val,0),low,sold,tr,w1,w0,up:mv.filter(x=>x.d>0).slice(0,3),down:mv.filter(x=>x.d<0).slice(-3).reverse(),best,late,lateT,gaps,gapT,ncl:cl5.length,hist,ne:typeof nExp=='function'?nExp():0};
 advC={k:key,v};return v}
// résumé court pour l'écran Caisse
function advCard(){
 if(!S.s.length)return'';
 const a=advice(),L=[];
 if(a.out.length)L.push(`<div class="row tap" onclick="go('p','adv')"><div class="gr1"><b>⏳ ${_('{n} produit(s) vont bientôt manquer',{n:a.out.length})}</b><small>${esc(a.out.slice(0,3).map(x=>x.p.n).join(', '))}</small></div></div>`);
 if(a.lateT>0)L.push(`<div class="row tap" onclick="go('c')"><div class="gr1"><b>🧾 ${_('{n} client(s) en retard de paiement',{n:a.late.length})}</b><small>${f(a.lateT)}</small></div></div>`);
 if(a.sold.length&&seeCost())L.push(`<div class="row tap" onclick="go('p','adv')"><div class="gr1"><b>⚠ ${_('Vendu moins cher que l\'achat')}</b><small>${esc(a.sold[0].n)} · ${_('perte')} ${f(a.sold[0].lost)}</small></div></div>`);
 if(a.gapT>0)L.push(`<div class="row tap" onclick="go('p','adv')"><div class="gr1"><b>💵 ${a.gaps.length==1?_('Manque en caisse à la dernière clôture'):_('Manque en caisse à {n} clôtures récentes',{n:a.gaps.length})}</b><small>${f(a.gapT)}</small></div></div>`);
 if(!L.length)return'';
 return `<h3>${_('À surveiller')}</h3><div class="card">${L.slice(0,3).join('')}</div><div class="btns"><button class="b ol sm" onclick="go('p','adv')">${_('Tous les conseils')}</button></div>`}
SUB.adv=()=>{
 const a=advice(),sc=seeCost();
 const sec=(ic,t,body,cls)=>`<div class="card pl"${cls?` style="border-color:${cls}"`:''}><b>${ic} ${t}</b>${body}</div>`;
 const parts=[];
 parts.push(a.tr===null?'':sec(a.tr>=0?'📈':'📉',_('Ventes de la semaine'),`<p style="margin:6px 0 0">${a.tr>=0?_('Vous avez vendu {p} % de plus que la semaine d\'avant ({a} contre {b}).',{p:a.tr,a:f(a.w1.net),b:f(a.w0.net)}):_('Vous avez vendu {p} % de moins que la semaine d\'avant ({a} contre {b}).',{p:-a.tr,a:f(a.w1.net),b:f(a.w0.net)})}</p>${a.up.length?`<small class="sm2">${_('En hausse')} : ${esc(a.up.map(x=>x.n).join(', '))}</small>`:''}${a.down.length?`<small class="sm2">${_('En baisse')} : ${esc(a.down.map(x=>x.n).join(', '))}</small>`:''}`));
 parts.push(a.out.length?sec('⏳',_('Produits qui vont manquer'),`<p class="sm2" style="margin:4px 0">${_('Calculé avec vos ventes des 30 derniers jours.')}</p>${a.out.slice(0,10).map(x=>rowh(esc(x.p.n+(x.p.g?' '+x.p.g:'')),x.d<=0?_('Rupture'):_('{n} jour(s)',{n:x.d}),_('Reste')+' '+fq(x.q)+(x.p.bu?' '+x.p.bu:'')+' · '+_('vendu environ {q} par jour',{q:fq(Math.round(x.v*10)/10)}),x.d<=2?'neg':'')).join('')}<div class="btns" style="padding:8px 0 0"><button class="b gr sm" onclick="go('s','reo')">📝 ${_('Préparer la commande')}</button></div>`,'var(--red)'):sec('✅',_('Stock'),`<p style="margin:6px 0 0">${S.s.length?_('Aucun produit ne risque de manquer dans les 10 prochains jours.'):_('Les prévisions apparaissent après quelques jours de ventes.')}</p>`));
 if(sc){
  parts.push(a.sold.length?sec('⚠',_('Vendu moins cher que l\'achat (30 jours)'),`${a.sold.slice(0,6).map(x=>rowh(esc(x.n),'-'+f(x.lost),fq(x.q)+' '+_('vendu(s)'),'neg')).join('')}<p class="sm2">${_('Vérifiez le prix de vente ou la remise accordée.')}</p>`,'var(--red)'):'');
  parts.push(a.low.length?sec('⚠',_('Prix de vente plus bas que le prix d\'achat'),`${a.low.slice(0,8).map(x=>rowh(esc(x.p.n),f(x.p.pr),_('achat')+' '+f(x.p.c),'neg')).join('')}<div class="btns" style="padding:8px 0 0"><button class="b ol sm" onclick="go('s','bulk')">％ ${_('Changer les prix')}</button></div>`,'var(--red)'):'');
  parts.push(a.best.length?sec('💰',_('Produits qui rapportent le plus (30 jours)'),a.best.map(x=>rowh(esc(x.n),f(x.m),pcs(x.m,x.rev)+' %','pos')).join('')):'')}
 parts.push(a.dor.length?sec('😴',_('Stock qui ne bouge pas'),`<p class="sm2" style="margin:4px 0">${_('Aucune vente depuis 60 jours. Argent immobilisé : {n}',{n:f(a.dorT)})}</p>${a.dor.slice(0,8).map(x=>rowh(esc(x.p.n),f(x.val),fq(x.p.q)+(x.p.bu?' '+x.p.bu:''))).join('')}<p class="sm2">${_('Idée : une petite promotion, ou ne plus le racheter.')}</p>`):(a.hist<45&&S.s.length?sec('😴',_('Stock qui ne bouge pas'),`<p class="sm2" style="margin:6px 0 0">${_('Ce conseil apparaît après 45 jours d\'utilisation.')}</p>`):''));
 parts.push(a.late.length?sec('🧾',_('Clients en retard'),`${a.late.slice(0,5).map(c=>rowh(esc(c.n),f(c.a),dueTxt(c))).join('')}<div class="btns" style="padding:8px 0 0"><button class="b ol sm" onclick="go('c');cf0='late';R()">${_('Voir et relancer')}</button></div>`):'');
 parts.push(a.gaps.length?sec('💵',_('Écarts de caisse'),`<p style="margin:6px 0 0">${a.ncl==1?_('Il manquait de l\'argent à la dernière clôture : {a}.',{a:f(a.gapT)}):_('Il manquait de l\'argent à {n} des {m} dernières clôtures, pour {a} en tout.',{n:a.gaps.length,m:a.ncl,a:f(a.gapT)})}</p>`):'');
 parts.push(a.ne?sec('💊',_('Péremption'),`<p style="margin:6px 0 0">${_('{n} produit(s) périmés ou bientôt périmés.',{n:a.ne})}</p><div class="btns" style="padding:8px 0 0"><button class="b ol sm" onclick="sf0='exp';go('s')">${_('Voir')}</button></div>`,'var(--red)'):'');
 return `${backBtn("go('p')")}<h3>💡 ${_('Conseiller')}</h3><p class="hint" style="margin-top:0">${_('Ces conseils sont de simples calculs faits sur votre téléphone avec vos ventes. Aucune donnée ne quitte l\'appareil.')}</p>${parts.join('')||`<p class="hint">${_('Pas encore assez de ventes pour donner des conseils.')}</p>`}`};
