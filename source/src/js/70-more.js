// ---- menu Plus, réglages, sauvegarde, vendeurs, aide
const mi=(ic,t,s,js,adv)=>`<button${adv?' class="adv"':''} onclick="${js}"><i>${ic}</i><span>${t}${s?`<small>${s}</small>`:''}</span></button>`;
SCR.p=()=>{
 const o=isO();
 return `<div class="sum"><b style="font-size:1.1rem">${esc(S.shop.name)}</b><small>${esc(me().n)}${nz(me().n)==nz(o?_('Patron'):_('Vendeur'))?'':' · '+(o?_('Patron'):_('Vendeur'))}</small></div>
<div class="menu">
${mi('🧾',_('Ventes'),_('Historique, reçus, retours, annulations'),"go('p','sales')")}
${o?mi('💸',_('Dépenses'),_('Loyer, transport, retraits du patron…'),"go('k','exp')"):''}
${o?mi('🚚',_('Achats et fournisseurs'),_('Marchandise reçue, dettes, commandes'),"go('s','buy')"):''}
${o&&S.set.mods.ag?mi('📲',_('Agent Mobile Money'),_('Dépôts, retraits, commissions'),"go('k','ag')"):''}
${o?mi('📊',_('Rapports'),_('Ventes, bénéfice, produits, graphiques'),"go('p','rep')",1):''}
${o?mi('💡',_('Conseiller'),_('Ruptures à venir, pertes, stock qui dort'),"go('p','adv')",1):''}
${o?mi('📒',_('Comptabilité'),_('Livre de caisse, résultat, pour le comptable'),"go('p','cpt')",1):''}
${o?mi('🏦',_('Dossier pour une banque'),_('Document d\'activité à imprimer'),"go('p','bank')",1):''}
${o?mi('👥',_('Vendeurs et codes'),_('Un code par personne'),"go('p','team')",1):''}
${o?mi('🏬',_('Plusieurs boutiques'),_('Voir toutes vos boutiques ensemble'),"go('p','shops')",1):''}
${o?mi('💾',_('Sauvegarde et mémoire'),S.bk?_('Dernière : {d}',{d:fdate(S.bk)}):_('Pas encore de sauvegarde'),"go('p','bak')"):''}
${mi('🌍',_('Langue'),LANG=='fr'?'Français':esc((S.langs.find(l=>l.c==LANG)||{n:LANG}).n),"go('p','lang')")}
${o?mi('⚙',_('Réglages'),_('Commerce, reçus, modules, remises'),"go('p','set')"):''}
${mi('❓',_('Aide et à propos'),_('Version {v}',{v:BUILD.slice(0,8)}),"go('p','help')")}
${FR?'':mi('🔒',_('Verrouiller'),'',"lock()")}
</div>`};
// ---- réglages
SUB.set=()=>{
 const s=S.set,sh=S.shop,ck=(id,v,t)=>`<label class="tg"><input type="checkbox" id="${id}"${v?' checked':''}><span>${t}</span></label>`;
 return `${backBtn()}<h3>⚙ ${_('Réglages')}</h3>
<div class="card pl"><b>${_('Votre commerce')}</b><label>${_('Nom')}</label><input class="in" id="rn" value="${esc(sh.name)}"><label>${_('Adresse')}</label><input class="in" id="ra" value="${esc(sh.addr)}"><div class="eq"><div><label>${_('Téléphone')}</label><input class="in" id="rt" inputmode="tel" value="${esc(sh.tel)}"></div><div><label>NIF</label><input class="in" id="rf" value="${esc(sh.nif)}"></div></div><label>${_('Nom du gérant')}</label><input class="in" id="ro" value="${esc(sh.own||'')}"></div>
<div class="card pl"><b>${_('Reçus')}</b><label>${_('Largeur du papier')}</label><select class="in" id="rw"><option value="80"${s.rcw!=58?' selected':''}>80 mm</option><option value="58"${s.rcw==58?' selected':''}>58 mm</option></select><label>${_('Message en bas du reçu')}</label><input class="in" id="rm2" value="${esc(s.msg)}"></div>
<div class="card pl"><b>${_('Ventes')}</b>
<label>${_('Arrondir les totaux vers le bas à')}</label><select class="in" id="rr">${[0,50,100,500,1000].map(k=>`<option value="${k}"${s.round==k?' selected':''}>${k?k+' GNF':_('Pas d\'arrondi')}</option>`).join('')}</select>
<label>${_('Remise maximale d\'un vendeur sans le code du patron (%)')}</label><input class="in" id="rd" inputmode="decimal" value="${s.sellMaxDisc}">
<label>${_('Délai de paiement par défaut des clients (jours)')}</label><input class="in" id="rdu" inputmode="numeric" value="${s.dueDays}">
<label>${_('Après une vente')}</label><select class="in" id="rcm"><option value=""${s.rcm=='full'?'':' selected'}>${_('Barre rapide (le plus rapide)')}</option><option value="full"${s.rcm=='full'?' selected':''}>${_('Reçu complet à chaque vente')}</option></select>
${ck('rsc',s.sellCost,_('Les vendeurs voient les prix d\'achat et les bénéfices'))}${ck('rro',s.reqOpen,_('Obliger à ouvrir la caisse avant de vendre'))}</div>
<div class="card pl"><b>${_('Modules')}</b>
${ck('rph',s.mods.ph,_('Pharmacie : lots, péremption, ordonnances, équivalents'))}
<label>${_('Alerte de péremption (jours avant)')}</label><input class="in" id="rex" inputmode="numeric" value="${s.expd}">
${ck('rag',s.mods.ag,_('Agent Mobile Money : dépôts, retraits, commissions'))}
<label>${_('Commission habituelle (% du montant)')}</label><input class="in" id="rar" inputmode="decimal" value="${s.agRate||''}" placeholder="0">
${ck('rtv',s.mods.tv,_('TVA : calculer une estimation (désactivée par défaut)'))}
<label>${_('Taux de TVA (%)')}</label><input class="in" id="rtx" inputmode="decimal" value="${s.tva}"></div>
<div class="card pl"><b>${_('Affichage')}</b>
<label>${_('Couleur principale')}</label><div class="sws" id="sws">${accSw()}</div>
${ck('rsi',s.simple,_('Mode simple : gros boutons, moins de choses à l\'écran'))}${ck('rbg',s.big,_('Écriture plus grande'))}</div>
<div class="top"><button class="b gr" onclick="setSave()">${_('Enregistrer')}</button></div>`};
function setSave(){
 const g=id=>$('#'+id),s=S.set,v=id=>g(id).value,c=id=>g(id).checked?1:0;
 const nm=v('rn').trim();if(!nm)return toast(_('Le nom du commerce est nécessaire'));
 const dsc=dec(v('rd')),dd=num(v('rdu')),ex=num(v('rex')),tx=dec(v('rtx'));
 Object.assign(S.shop,{name:nm,addr:v('ra').trim(),tel:v('rt').trim(),nif:v('rf').trim(),own:v('ro').trim()});
 s.rcw=+v('rw');s.msg=v('rm2').trim();s.round=+v('rr');s.sellMaxDisc=isNaN(dsc)?10:Math.max(0,Math.min(100,dsc));s.dueDays=isNaN(dd)?15:dd;
 s.sellCost=c('rsc');s.reqOpen=c('rro');s.rcm=v('rcm')=='full'?'full':'';
 const wasPh=s.mods.ph;s.mods.ph=c('rph');s.expd=isNaN(ex)?90:ex;s.mods.ag=c('rag');s.agRate=dec(v('rar'))||0;s.mods.tv=c('rtv');s.tva=isNaN(tx)?18:tx;
 s.simple=c('rsi');s.big=c('rbg');
 save(true);back();toast(_('Réglages enregistrés ✓'));
 if(s.mods.ph&&!wasPh)info(_('Module pharmacie'),`<p>${_('L\'application aide à suivre les lots, les dates de péremption et les ordonnances. Elle ne remplace ni la réglementation pharmaceutique, ni le pharmacien responsable, ni les contrôles de l\'autorité sanitaire.')}</p><p>${_('Vérifiez toujours les dates et les ordonnances avant de délivrer un médicament.')}</p>`,_('J\'ai compris'))}
// ---- sauvegarde et mémoire
SUB.bak=()=>{
 const d=S.bk?Math.floor((Date.now()-S.bk)/DAY):-1;
 return `${backBtn()}<h3>💾 ${_('Sauvegarde et mémoire')}</h3>
${FR?`<div class="bn y">${_('Version d\'essai en ligne : l\'enregistrement de fichiers est bloqué ici. La sauvegarde fonctionne dans la version installée sur le téléphone.')}</div>`:''}
<div class="card pl" id="memc"><p class="sm2" style="margin:0">${_('Calcul de la mémoire…')}</p></div>
<div class="card pl"><b>${_('Sauvegarder')}</b><p class="sm2">${d<0?_('Vous n\'avez encore jamais fait de sauvegarde.'):_('Dernière sauvegarde : {a} (il y a {n} jours)',{a:fdt(S.bk),n:d})}</p>
<p class="sm2">${_('Le fichier contient tous vos produits, ventes, clients et photos. Gardez-le dans WhatsApp, Google Drive, votre e-mail ou sur un ordinateur.')}</p>
<label>${_('Mot de passe pour protéger le fichier (facultatif)')}</label><input class="in" id="bkpw" type="password" autocomplete="new-password">
<p class="sm2">${_('Avec un mot de passe, il faudra le saisir pour restaurer. Notez-le bien : il ne peut pas être retrouvé.')}</p>
<button class="b gr" style="width:100%" onclick="bakNow()">${_('Sauvegarder maintenant')}</button></div>
<div class="card pl"><b>${_('Restaurer une sauvegarde')}</b><p class="sm2">${_('Remplace les données de ce téléphone par celles du fichier. Utile après un changement de téléphone.')}</p><input class="in" type="file" accept=".json,application/json" onchange="bakFile(this)"></div>
<div class="card pl"><b>${_('Protéger la mémoire')}</b><p class="sm2">${_('Demande au téléphone de ne pas effacer les données de l\'application quand il manque de place.')}</p><button class="b ol sm" onclick="bakPersist()">${_('Protéger')}</button> <span id="perst" class="sm2" style="display:inline"></span></div>`};
AR.push(()=>{if(tab=='p'&&sub=='bak')bakFill()});
async function bakFill(){
 const e=$('#memc');if(!e)return;
 const m=await memInfo();let per=0,txt='';
 const mb=n=>(n/1048576).toLocaleString('fr-FR',{maximumFractionDigits:1})+' Mo';
 if(DB&&m.quota){per=m.used*100/m.quota;txt=_('{a} utilisés sur {b} disponibles',{a:mb(m.used),b:mb(m.quota)})}
 else{per=m.js*100/4.5e6;txt=_('{a} utilisés sur environ 4,5 Mo disponibles',{a:mb(m.js)})}
 let ph=0;try{ph=Object.keys(await allPhotos()).length}catch(x){}
 const pe=$('#memc');if(!pe)return;
 pe.innerHTML=`<b>${_('Mémoire de l\'application')}</b><div class="bar ${per>=80?'d':per>=60?'w':''}"><i style="width:${Math.min(100,Math.max(per,1)).toFixed(1)}%"></i></div><p class="sm2">${txt} (${per<0.1?'<0,1':per.toFixed(1).replace('.',',')} %)</p><p class="sm2">${S.p.length} ${S.p.length>1?_('produits'):_('produit')} · ${S.s.length} ${S.s.length>1?_('ventes'):_('vente')} · ${S.cl.length} ${S.cl.length>1?_('clients'):_('client')} · ${ph} ${ph>1?_('photos'):_('photo')}</p>${per>=80?`<div class="bn r">${_('Presque plein : faites une sauvegarde puis libérez de la place.')}</div>`:''}${!DB?`<div class="bn y">${_('Votre navigateur limite la mémoire à environ 5 Mo. Faites des sauvegardes régulières.')}</div>`:''}`;
 try{if(navigator.storage&&navigator.storage.persisted){const p=await navigator.storage.persisted();const x=$('#perst');if(x)x.textContent=p?'✓ '+_('Protégée'):_('Pas encore protégée')}}catch(x){}}
async function bakPersist(){try{const ok=navigator.storage&&navigator.storage.persist?await navigator.storage.persist():false;toast(ok?_('Mémoire protégée ✓'):_('Le téléphone n\'a pas accepté. Faites des sauvegardes.'),3500);bakFill()}catch(e){toast(_('Impossible ici'))}}
async function bakNow(){
 if(FR)return frNo();
 const pw=($('#bkpw')||{}).value||'';
 try{
  const txt=await makeBackup({pw:pw||undefined});
  S.bk=Date.now();save(true);
  await outFile('boutique-facile-'+ymd(Date.now())+(pw?'-protege':'')+'.json',txt,'application/json');
  toast(_('Sauvegarde créée ✓'));R()
 }catch(e){console.error(e);toast(_('Sauvegarde impossible'))}}
function bakFile(inp){const fl=inp.files[0];if(!fl)return;const rd=new FileReader();rd.onload=()=>bakTry(String(rd.result),'');rd.onerror=()=>toast(_('Fichier illisible'));rd.readAsText(fl)}
async function bakTry(text,pw){
 try{
  const r=await restoreFrom(text,pw);
  sure(_('Remplacer les données de ce téléphone par cette sauvegarde ({a} produits, {b} ventes) ?',{a:r.S.p.length,b:r.S.s.length}),async()=>{await applyRestore(r);setLang(S.set.lang);toast(_('Sauvegarde restaurée ✓'));go('p')},_('Restaurer'))
 }catch(e){
  if(e.message=='pw'||e.message=='badpw')ask(_('Mot de passe'),e.message=='badpw'?_('Mot de passe incorrect, essayez encore'):_('Ce fichier est protégé. Entrez le mot de passe.'),v=>bakTry(text,v),{pwl:1,yes:_('Ouvrir')});
  else toast(_('Fichier non reconnu'))}}
// ---- vendeurs et codes
SUB.team=()=>`${backBtn()}<h3>👥 ${_('Vendeurs et codes')}</h3>
<div class="bn b">${_('Chaque personne a son code à 4 chiffres. Les ventes sont notées au nom du vendeur. Une remise trop forte, un retour, une annulation ou un dépassement de crédit demandent le code du patron.')}</div>
<div class="card">${S.users.map(u=>`<div class="row"><div class="gr1"><b>${esc(u.n)}</b><small>${u.r=='o'?_('Patron'):_('Vendeur')}${u.on?'':' · '+_('désactivé')}${u.pin?'':' · '+_('sans code')}</small></div><div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end"><button class="b xs ol" onclick="usForm(${u.id})">${_('Modifier')}</button>${u.r=='o'?'':`<button class="b xs ol" onclick="usOn(${u.id})">${u.on?_('Désactiver'):_('Activer')}</button>`}</div></div>`).join('')}</div>
<div class="top"><button class="b gr" onclick="usForm()">＋ ${_('Ajouter un vendeur')}</button></div>
<h3>${_('Ce que peut faire un vendeur')}</h3><div class="card pl"><p class="sm2" style="margin:0">${_('Vendre, encaisser une dette, voir ses propres ventes et ouvrir ou fermer sa caisse. Il ne voit pas les prix d\'achat ni les bénéfices (sauf si vous l\'autorisez dans les Réglages) et ne peut pas modifier le stock, les prix ou les rapports.')}</p></div>`;
function usForm(id){
 const u=id?S.users.find(x=>x.id==id):{n:'',r:'s'};
 M(`<h2>${id?_('Modifier'):_('Nouveau vendeur')}</h2><label>${_('Nom')}</label><input class="in" id="un" value="${esc(u.n)}"><label>${id?_('Nouveau code à 4 chiffres (laisser vide pour garder l\'ancien)'):_('Code à 4 chiffres')}</label><input class="in" id="up" type="password" maxlength="4" inputmode="numeric" autocomplete="off">${acts(_('Enregistrer'),'usSave('+(id||0)+')')}`)}
function usSave(id){
 const n=$('#un').value.trim(),p=$('#up').value.trim();
 if(!n)return toast(_('Le nom est nécessaire'));
 if(!id&&!/^\d{4}$/.test(p))return toast(_('Le code a 4 chiffres'));
 if(p&&!/^\d{4}$/.test(p))return toast(_('Le code a 4 chiffres'));
 if(p&&S.users.some(x=>x.id!=id&&x.pin&&x.pin==hs(p)))return toast(_('Ce code est déjà utilisé par quelqu\'un d\'autre'));
 let u=id?S.users.find(x=>x.id==id):null;
 if(!u){u={id:Math.max(0,...S.users.map(x=>x.id))+1,n,r:'s',pin:null,on:1};S.users.push(u)}
 u.n=n;if(p)u.pin=hs(p);
 save(true);M();toast(_('Enregistré ✓'));R()}
function usOn(id){const u=S.users.find(x=>x.id==id);if(!u||u.r=='o')return;u.on=u.on?0:1;save(true);R()}
// ---- aide et à propos
SUB.help=()=>`${backBtn()}<h3>❓ ${_('Aide et à propos')}</h3>
<div class="card pl"><b>${_('Comment ça marche')}</b>
<p class="sm2">🛒 <b>${_('Vendre')}</b> : ${_('touchez les produits, puis choisissez Espèces, Mobile Money ou À crédit. Un client peut aussi payer une partie maintenant (acompte) et le reste plus tard.')}</p>
<p class="sm2">📦 <b>${_('Stock')}</b> : ${_('ajoutez vos produits et vos achats. L\'appli prévient quand il faut recommander.')}</p>
<p class="sm2">👥 <b>${_('Clients')}</b> : ${_('suivez les dettes, relancez par WhatsApp ou SMS, encaissez.')}</p>
<p class="sm2">💰 <b>${_('Caisse')}</b> : ${_('ouvrez la caisse le matin, fermez-la le soir : l\'appli montre s\'il manque de l\'argent.')}</p></div>
<div class="card pl"><b>${_('Où sont vos données ?')}</b><p class="sm2">${FR?_('Dans la version d\'essai en ligne, vos données ne sont pas garanties : elles peuvent disparaître. Installez l\'application sur le téléphone pour les garder.'):_('Tout est enregistré sur ce téléphone, sans internet. Personne d\'autre ne peut les voir. Si le téléphone est perdu ou cassé, vos données sont perdues : faites une sauvegarde chaque semaine.')}</p>
<p class="sm2">${_('Le code PIN empêche les curieux d\'ouvrir l\'application, mais il ne chiffre pas les données. Ne laissez pas votre téléphone déverrouillé.')}</p></div>
<div class="card pl"><b>${_('Limites à connaître')}</b>
<p class="sm2">• ${_('Plusieurs boutiques : les chiffres se regroupent par fichiers échangés, pas en direct.')}</p>
<p class="sm2">• ${_('Les paiements Mobile Money sont notés à la main : vérifiez-les avec le SMS de l\'opérateur.')}</p>
<p class="sm2">• ${_('Les rapports et la comptabilité sont indicatifs : faites-les valider par un comptable.')}</p>
<p class="sm2">• ${_('L\'impression passe par le système du téléphone (imprimante ou PDF).')}</p></div>
<div class="card pl"><div class="abl">${LOGO_H}</div><p class="sm2">${_('version {v}',{v:BUILD.slice(0,8)})}</p></div>`;
