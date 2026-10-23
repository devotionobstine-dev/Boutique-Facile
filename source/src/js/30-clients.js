// ---- clients, dettes, relances, historique des ventes, annulations et retours
let cf0='d',cq0='';
const dueTxt=c=>{if(!c.due||c.a<=0)return'';const d=Math.round((c.due-D0(Date.now()))/DAY);return d<0?`<span class="neg">${_('En retard de {n} j',{n:-d})}</span>`:d==0?`<span class="neg">${_('À payer aujourd\'hui')}</span>`:`${_('Échéance dans {n} j',{n:d})}`};
function clList(){
 const nq=nz(cq0);let L=S.cl.slice();
 if(cf0=='d')L=L.filter(c=>c.a>0);else if(cf0=='late')L=L.filter(c=>c.a>0&&c.due&&c.due<Date.now());
 if(nq)L=L.filter(c=>nz(c.n+' '+c.tel).includes(nq));
 L.sort((a,b)=>((b.a>0&&b.due&&b.due<Date.now())?1:0)-((a.a>0&&a.due&&a.due<Date.now())?1:0)||b.a-a.a||a.n.localeCompare(b.n,'fr'));
 if(!L.length)return`<p class="hint">${S.cl.length?_('Personne dans cette liste.'):_('Aucun client. Une vente « À crédit » ou le bouton « Ajouter un client » en crée un.')}</p>`;
 return L.map(c=>`<div class="row tap"><div class="gr1" onclick="cfi('${c.id}')"><b>${esc(c.n)}</b><small>${c.tel?esc(c.tel)+' · ':''}${c.pi?_('pièce n° {n}',{n:esc(c.pi)}):(c.ph?_('photo de la pièce'):_('aucune pièce enregistrée'))}</small>${c.a>0?`<small>${dueTxt(c)}</small>`:''}</div>${c.a>0?`<div class="owe" onclick="cfi('${c.id}')">${f(c.a)}</div><div style="display:flex;flex-direction:column;gap:4px"><button class="b xs gr" onclick="enc('${c.id}')">${_('Encaisser')}</button><button class="b xs ol" onclick="relance('${c.id}')">${_('Relancer')}</button></div>`:`<div class="sm2" onclick="cfi('${c.id}')">${_('Aucune dette')}</div>`}</div>`).join('')}
function CLS(){
 const tot=S.cl.reduce((a,c)=>a+Math.max(c.a,0),0),late=S.cl.filter(c=>c.a>0&&c.due&&c.due<Date.now());
 return `<div class="sum"><small>${_('Total que les clients vous doivent')}</small><div class="tot">${f(tot)}</div>${late.length?`<small class="neg">${_('{n} client(s) en retard : {a}',{n:late.length,a:f(late.reduce((a,c)=>a+c.a,0))})}</small>`:''}</div>
<div class="srch"><input class="in" placeholder="${_('Rechercher un client…')}" value="${esc(cq0)}" oninput="cq0=this.value;$('#cll2').innerHTML=clList()" autocomplete="off"></div>
<div class="chips">${chip(_('Dettes'),cf0=='d',"cf0='d';R()")}${chip(_('En retard'),cf0=='late',"cf0='late';R()",late.length?'r':'')}${chip(_('Tous'),cf0=='all',"cf0='all';R()")}</div>
<div class="top"><button class="b ol" onclick="cNew()">＋ ${_('Ajouter un client')}</button></div>
<div class="card" id="cll2">${clList()}</div>`}
SCR.c=CLS;
function cNew(){CE=null;cform({n:'',tel:'',pi:'',lim:0,due:0,ph:''})}
let CE=null,cphoto='';
function cform(c){
 cphoto='';
 M(`<h2>${c.id?_('Fiche client'):_('Nouveau client')}</h2><label>${_('Nom')}</label><input class="in" id="kn" value="${esc(c.n)}"><div class="eq"><div><label>${_('Téléphone')}</label><input class="in" id="kt" inputmode="tel" value="${esc(c.tel)}"></div><div><label>${_('Plafond de crédit (GNF)')}</label><input class="in nm" id="kl" inputmode="numeric" value="${c.lim?fm(c.lim):''}" placeholder="${_('sans limite')}"></div></div>
<label>${_('N° de carte d\'identité ou de passeport')}</label><input class="in" id="ki" value="${esc(c.pi)}">
<label>${_('Photo de la pièce')} ${c.ph?'('+_('déjà enregistrée')+')':''}</label><input class="in" type="file" accept="image/*" capture="environment" onchange="kphoto(this)">
<label>${_('Date promise de paiement')}</label><input class="in" id="kd" type="date" value="${c.due?ymd(c.due):''}">
<label class="tg"><input type="checkbox" id="kc"${c.ph||c.pi?' checked':''}><span>${_('Le client accepte l\'enregistrement de sa pièce d\'identité.')}</span></label>
${acts(_('Enregistrer'),'cSave('+(c.id?"'"+c.id+"'":'null')+')',_('Fermer'))}`)}
function kphoto(i){const fl=i.files[0];if(!fl)return;const im=new Image();im.onload=()=>{const k=Math.min(1,520/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cphoto=c.toDataURL('image/jpeg',.6);toast(_('Photo prête ✓'))};im.src=URL.createObjectURL(fl)}
function cSave(id){
 const n=$('#kn').value.trim();if(!n)return toast(_('Le nom est nécessaire'));
 if(S.cl.some(x=>x.n.toLowerCase()==n.toLowerCase()&&x.id!=id))return toast(_('Ce nom existe déjà'));
 const pi=$('#ki').value.trim();if((pi||cphoto)&&!$('#kc').checked)return toast(_('Le client doit accepter l\'enregistrement de sa pièce'));
 let c=id?CLI(id):null;if(!c){c={id:uid(),n,tel:'',pi:'',ph:'',a:0,h:[],due:0,lim:0,t0:Date.now()};S.cl.push(c)}
 c.n=n;c.tel=$('#kt').value.trim();c.pi=pi;c.lim=num($('#kl').value)||0;
 const d=$('#kd').value;c.due=d?pd(d):0;
 if(cphoto){const old=c.ph;c.ph='ph'+uid();phPut(c.ph,cphoto);if(old)phDel(old)}
 save(true);M();toast(_('Client enregistré ✓'));R()}
function cfi(id){
 const c=CLI(id);if(!c)return;
 const ss=S.s.filter(s=>s.cid==id&&!s.v),tot=ss.reduce((a,s)=>a+s.total,0);
 const hist=c.h.slice(-25).reverse().map(h=>{const lab=h.v>0?_('Vente n° {n}',{n:String(h.no||0).padStart(6,'0')}):h.x?_('Annulation / retour'):_('Paiement')+(h.m=='m'?' Mobile Money':h.m=='e'?' · '+_('Espèces'):'');return rowh(lab,(h.v>0?'+':'')+f(h.v),fdt(h.t),h.v>0?'owe':'pos')}).join('');
 M(`<h2>${esc(c.n)}</h2>${c.tel?`<p class="sm2">${esc(c.tel)}</p>`:''}${kv(_('Dette actuelle'),f(c.a),c.a>0?'owe':'')}${c.lim?kv(_('Plafond de crédit'),f(c.lim)):''}${c.due&&c.a>0?kv(_('Date promise'),fdate(c.due)+' '+dueTxt(c)):''}${kv(_('Achats enregistrés'),ss.length+' · '+f(tot))}
<div class="btns" style="padding:8px 0 0">${c.a>0?`<button class="b gr" onclick="enc('${id}')">${_('Encaisser')}</button><button class="b ol" onclick="relance('${id}')">${_('Relancer')}</button>`:''}<button class="b ol" onclick="cform(CLI('${id}'))">${_('Modifier')}</button>${c.ph?`<button class="b ol" onclick="cpic('${id}')">${_('Voir la pièce')}</button>`:''}</div>
<h3 style="margin:14px 0 4px">${_('Historique')}</h3>${hist||`<p class="hint">${_('Rien pour le moment.')}</p>`}<div class="pay2 o"><button class="b ol" onclick="M()">${_('Fermer')}</button></div>`)}
function cpic(id){const c=CLI(id);phGet(c.ph).then(d=>M(`<h2>${esc(c.n)}</h2>${d?`<img alt="${_('Pièce d\'identité')}" src="${d}" style="width:100%;border-radius:8px">`:`<p>${_('Photo introuvable.')}</p>`}<div class="pay2 o"><button class="b ol" onclick="cfi('${id}')">${_('Retour')}</button></div>`))}
// ---- encaisser une dette
let EN=null;
function enc(id){
 const c=CLI(id);EN={id,m:'e',op:S.set.op||'om'};
 M(`<h2>${_('Encaisser')} ${esc(c.n)}</h2><div class="kv"><span>${_('Dette actuelle')}</span><b class="owe">${f(c.a)}</b></div><label>${_('Montant reçu')}</label><input class="in nm" id="en" inputmode="numeric" value="${fm(c.a)}">
<div class="chips" style="padding:6px 0">${chip('💵 '+_('Espèces'),1,"encM('e')",'',1)}${chip('📱 Orange Money',0,"encM('om')")}${chip('📱 MTN MoMo',0,"encM('mtn')")}</div>
<div id="enr" style="display:none"><label>${_('Numéro de transaction du SMS (facultatif)')}</label><input class="in" id="enrf"></div>${acts(_('Valider'),'encOk()')}`);
 encM(EN.m=='e'?'e':EN.op)}
function encM(k){EN.m=k=='e'?'e':'m';if(k!='e')EN.op=k;const chips=$$('#m .chips .chip');chips.forEach((b,i)=>b.classList.toggle('on',(i==0&&k=='e')||(i==1&&k=='om')||(i==2&&k=='mtn')));$('#enr').style.display=k=='e'?'none':''}
function encOk(){
 const c=CLI(EN.id),v=num($('#en').value);
 if(!(v>0))return toast(_('Montant invalide'));if(v>c.a)return toast(_('Montant trop élevé'));
 c.a-=v;c.h.push({t:Date.now(),v:-v,m:EN.m,op:EN.m=='m'?EN.op:'',by:CU,ref:EN.m=='m'?($('#enrf').value||'').trim():''});
 if(EN.m=='m')S.set.op=EN.op;
 save(true);M();toast(_('Paiement enregistré ✓'));R();
 setTimeout(()=>sure(_('Envoyer un reçu de paiement à {n} ?',{n:esc(c.n)}),()=>{const tx=`*${S.shop.name}*\n${_('Paiement reçu de')} ${c.n} : ${f(v)}\n${c.a>0?_('Reste dû')+' : '+f(c.a):_('Dette soldée. Merci !')}\n${fdt(Date.now())}`;share(tx,c.tel)},_('Envoyer')),150)}
function relance(id){
 const c=CLI(id),late=c.due&&c.due<Date.now();
 const tx=_('Bonjour {n}, c\'est {s}. Vous nous devez {a}',{n:c.n,s:S.shop.name,a:f(c.a)})+(late?' '+_('(échéance dépassée depuis le {d})',{d:fdate(c.due)}):(c.due?' '+_('(à régler avant le {d})',{d:fdate(c.due)}):''))+'. '+_('Merci de passer régler.')+(S.shop.tel?' '+S.shop.tel:'')+' '+_('Merci !');
 M(`<h2>${_('Relancer')} ${esc(c.n)}</h2><label>${_('Message')}</label><textarea class="in" id="rm" rows="5">${esc(tx)}</textarea>
<div class="btns" style="padding:8px 0 0"><button class="b gr" onclick="rlSend('${id}','w')">WhatsApp</button><button class="b ol" onclick="rlSend('${id}','s')">SMS</button><button class="b ol" onclick="rlSend('${id}','x')">${_('Autre')}</button></div>${c.tel?'':`<p class="sm2">${_('Pas de numéro enregistré : choisissez le contact dans l\'application.')}</p>`}<div class="pay2 o"><button class="b ol" onclick="M()">${_('Fermer')}</button></div>`)}
function rlSend(id,k){const c=CLI(id),tx=$('#rm').value;if(k=='w')ext(waLink(c.tel,tx));else if(k=='s')sms(c.tel,tx);else share(tx,c.tel)}
// ---- historique des ventes
let SH={q:'',d:ymd(Date.now())};
SUB.sales=()=>`${backBtn('back()')}<h3>🧾 ${_('Ventes')}</h3><div class="srch"><input class="in" type="date" value="${SH.d}" onchange="SH.d=this.value;$('#shl').innerHTML=shList()" style="max-width:170px"><input class="in" placeholder="${_('N° de reçu, client, produit…')}" value="${esc(SH.q)}" oninput="SH.q=this.value;$('#shl').innerHTML=shList()" autocomplete="off"></div><div class="card" id="shl">${shList()}</div>`;
function shList(){
 const nq=nz(SH.q),d0=pd(SH.d);let L=S.s.filter(s=>(isO()||s.by==CU));
 if(nq){const nn=num(SH.q);L=L.filter(s=>(!isNaN(nn)&&s.no==nn)||nz(s.cl+' '+s.items.map(i=>i.n).join(' ')).includes(nq))}else if(!isNaN(d0))L=L.filter(s=>D0(s.t)==d0);
 L=L.slice().sort((a,b)=>b.t-a.t).slice(0,80);
 return L.length?L.map(saleRow).join(''):`<p class="hint">${_('Aucune vente.')}</p>`}
function saleRow(s){
 const rts=S.rt.filter(r=>r.sid==s.id),ra=rts.reduce((a,r)=>a+r.amt,0);
 return `<div class="row tap" onclick="saleDetail('${s.id}')"><div class="gr1"><b${s.v?' style="text-decoration:line-through"':''}>${s.items.map(i=>rq(i.q)+'× '+esc(i.n)).join(', ')}</b><small>#${String(s.no||0).padStart(6,'0')} · ${hm(s.t)} · ${s.pay.filter(p=>p.a>0).map(payLbl).join(' + ')}${s.cl?' · '+esc(s.cl):''}${s.disc?' · '+_('remise')+' '+f(s.disc):''}${ra?' · '+_('retour')+' '+f(ra):''}${s.v?' · '+_('annulée'):''}${s.by&&S.users.length>1?' · '+esc(UN(s.by)):''}</small></div><div>${f(s.total)}</div></div>`}
function saleDetail(id){
 const s=S.s.find(x=>x.id==id);if(!s)return;const rts=S.rt.filter(r=>r.sid==id);
 M(`<h2>${_('Reçu n° {n}',{n:rcNo(s)})}</h2><p class="sm2">${fdt(s.t)}${s.by?' · '+esc(UN(s.by)):''}${s.v?' · <b class="neg">'+_('annulée')+'</b>':''}</p>
${s.items.map(i=>rowh(`${fq(i.q)}${i.f!=1||i.u?' '+esc(i.u):''} × ${esc(i.n)}`,f(Math.round(i.q*i.pr)),i.pr!=i.pr0?_('tarif')+' '+f(i.pr0):'')).join('')}
${s.disc?kv(_('Remise'),'-'+f(s.disc)):''}${kv(_('Total'),f(s.total))}${s.pay.filter(p=>p.a>0).map(p=>kv(payLbl(p),f(p.a))).join('')}${s.cl?kv(_('Client'),esc(s.cl)):''}${s.rx?kv(_('Ordonnance'),esc(s.rx)):''}${rts.map(r=>kv(_('Retour du {d}',{d:fdate(r.t)}),'-'+f(r.amt),'neg')).join('')}
<div class="btns" style="padding:8px 0 0"><button class="b ol" onclick="rcShare('${id}')">${_('Envoyer le reçu')}</button><button class="b ol nf" onclick="rcPrint('${id}')">${_('Imprimer')}</button>${s.v?'':`<button class="b ol" onclick="retUI('${id}')">${_('Retour / échange')}</button><button class="b ol" onclick="undoSale('${id}')">${_('Annuler la vente')}</button>`}</div><div class="pay2 o"><button class="b ol" onclick="M();R()">${_('Fermer')}</button></div>`)}
function undoSale(id){
 const s=S.s.find(x=>x.id==id);if(!s||s.v)return;
 if(S.rt.some(r=>r.sid==id))return toast(_('Cette vente a déjà un retour : annulation impossible.'),3500);
 const cr0=s.pay.filter(p=>p.m=='c').reduce((a,p)=>a+p.a,0),c0=s.cid&&CLI(s.cid);
 if(cr0>0&&c0&&c0.a<cr0)return info(_('Annulation impossible'),`<p>${_('Le client a déjà payé une partie de cette dette. Utilisez « Retour / échange » pour rembourser le client.')}</p>`);
 needOwner(ap=>sure(_('Annuler cette vente ? Le stock sera remis.'),()=>{voidDo(s,ap);M();toast(_('Vente annulée'));R()},_('Annuler la vente')),_('Annuler une vente demande le code du patron.'))}
// annulation : le stock est remis, la dette du client est retirée, la vente reste dans les livres marquée « annulée »
function voidDo(s,ap){
 s.items.forEach(x=>{const p=P(x.id);if(p)giveStock(p,rq(x.q*(x.f||1)),x.lots)});
 const cr=s.pay.filter(p=>p.m=='c').reduce((a,p)=>a+p.a,0);
 if(cr>0&&s.cid){const c=CLI(s.cid);if(c){c.a=Math.max(0,c.a-cr);c.h.push({t:Date.now(),v:-cr,x:1})}}
 s.v=1;s.vt=Date.now();s.vb=ap;save(true)}
// ---- retours et échanges
let RT=null;
const retQ=(s,li)=>rq(S.rt.filter(r=>r.sid==s.id).reduce((a,r)=>a+((r.lines.find(l=>l.li==li)||{q:0}).q),0));
function retUI(id){
 const s=S.s.find(x=>x.id==id);if(!s)return;
 const c=s.cid?CLI(s.cid):null,cr=s.pay.filter(p=>p.m=='c').reduce((a,p)=>a+p.a,0),canD=c&&c.a>0&&cr>0;
 RT={id,q:{},m:canD?'d':'e',op:S.set.op||'om',rs:1,canD};
 const lines=s.items.map((i,li)=>({i,li,max:rq(i.q-retQ(s,li))})).filter(x=>x.max>0);
 if(!lines.length)return toast(_('Tout a déjà été retourné.'));
 M(`<h2>${_('Retour / échange')} #${rcNo(s)}</h2><p class="hint" style="margin:0 0 6px">${_('Indiquez ce que le client rapporte. Pour un échange, faites le retour puis une nouvelle vente.')}</p>
${lines.map(x=>`<div class="row"><div class="gr1"><b>${esc(x.i.n)}</b><small>${_('vendu')} ${fq(x.i.q)}${x.i.u?' '+esc(x.i.u):''} · ${f(x.i.pr)}</small></div><input class="in rq" style="width:84px;text-align:right" inputmode="decimal" data-li="${x.li}" data-max="${x.max}" placeholder="0 / ${fq(x.max)}" oninput="retCalc()"></div>`).join('')}
<div class="row"><div class="gr1">${_('Montant à rembourser')}</div><input class="in nm" id="ra" style="width:130px;text-align:right" inputmode="numeric" oninput="RT.man=1"></div>
<label>${_('Rembourser en')}</label><div class="chips" style="padding:4px 0" id="rtm">${[['e','💵 '+_('Espèces')],['om','📱 Orange Money'],['mtn','📱 MTN MoMo']].concat(canD?[['d','🧾 '+_('Déduire de la dette')]]:[]).map(([k,l])=>`<button class="chip${(RT.m==k||(RT.m=='m'&&RT.op==k))?' on':''}" data-k="${k}" onclick="retM(this.dataset.k)">${l}</button>`).join('')}</div>
<label class="tg"><input type="checkbox" id="rrs" checked><span>${_('Remettre les articles en stock')}</span></label>
<label>${_('Motif (facultatif)')}</label><input class="in" id="rtn">${acts(_('Valider le retour'),'retOk()',_('Retour'))}`)}
function retM(k){RT.m=k=='e'?'e':k=='d'?'d':'m';if(k!='e'&&k!='d')RT.op=k;$$('#rtm .chip').forEach(b=>b.classList.toggle('on',b.dataset.k==k))}
function retCalc(){
 const s=S.s.find(x=>x.id==RT.id);let amt=0;RT.q={};
 $$('.rq').forEach(e=>{let q=dec(e.value);if(isNaN(q)||q<=0)return;q=Math.min(q,+e.dataset.max);RT.q[e.dataset.li]=q;const i=s.items[+e.dataset.li];amt+=q*i.pr*(s.sub?s.total/s.sub:1)});
 if(!RT.man)$('#ra').value=fm(Math.round(amt))}
function retOk(){
 const s=S.s.find(x=>x.id==RT.id);retCalc();
 const lines=Object.keys(RT.q).map(li=>({li:+li,q:RT.q[li],rs:$('#rrs').checked?1:0}));
 if(!lines.length)return toast(_('Indiquez au moins un article'));
 const amt=num($('#ra').value)||0,note=$('#rtn').value.trim();
 needOwner(ap=>{
  const t=Date.now(),how=[];let rest=amt;
  if(RT.m=='d'){const c=CLI(s.cid);const cr=s.pay.filter(p=>p.m=='c').reduce((a,p)=>a+p.a,0);const dd=Math.min(rest,c.a,cr);if(dd>0){c.a-=dd;c.h.push({t,v:-dd,x:1});how.push({m:'d',a:dd});rest-=dd}}
  if(rest>0)how.push(RT.m=='m'?{m:'m',a:rest,op:RT.op}:{m:'e',a:rest});
  const rt={id:uid(),t,sid:s.id,no:s.no,by:CU,lines,amt,how,note};if(ap!=CU)rt.ap=ap;
  S.rt.push(rt);
  lines.forEach(l=>{if(!l.rs)return;const i=s.items[l.li],p=P(i.id);if(p)giveStock(p,rq(l.q*(i.f||1)),i.lots)});
  save(true);M();toast(_('Retour enregistré ✓'));R()},_('Un retour demande le code du patron.'))}
