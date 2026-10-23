// ---- utilisateurs, droits, code PIN, première utilisation
const me=()=>S.users.find(u=>u.id==CU)||S.users[0];
let ovr=0;
const isO=()=>ovr>0||me().r=='o';
const seeCost=()=>isO()||!!S.set.sellCost;
const P=id=>S.p.find(x=>x.id==id);
const CLI=id=>S.cl.find(x=>x.id==id);
const UN=id=>{const u=S.users.find(x=>x.id==id);return u?u.n:''};
let lkMode='enter';
function needOwner(fn,why){
 if(me().r=='o')return fn(me().id);
 ask(_('Code du patron'),why||_('Le patron doit saisir son code pour autoriser cette action.'),v=>{
  const o=S.users.find(u=>u.r=='o'&&u.on&&u.pin&&u.pin==hs(v));
  if(!o)return toast(_('Code incorrect'));
  ovr++;try{fn(o.id)}finally{ovr--}},{pw:1})}
function lock(){
 if(FR)return;
 const o=S.users.find(u=>u.r=='o');lkMode=(!o||!o.pin)?'create':'enter';
 $('#lk').style.display='flex';M();
 $('#lh').textContent=S.shop.name||'Boutique Facile';
 $('#lm').textContent=lkMode=='create'?_('Créez le code PIN du propriétaire (4 chiffres)'):_('Entrez votre code PIN');
 $('#lo').textContent=_('Ouvrir');$('#lf').textContent=_('Code oublié ?');$('#lf').style.display=lkMode=='create'?'none':'';
 $('#pn').value='';setTimeout(()=>{try{$('#pn').focus()}catch(e){}},60)}
function unlock(){
 const v=$('#pn').value;
 if(!/^\d{4}$/.test(v))return toast(_('Le code a 4 chiffres'));
 if(lkMode=='create'){const o=S.users.find(u=>u.r=='o');o.pin=hs(v);CU=o.id;save(true);$('#lk').style.display='none';return afterUnlock()}
 const u=S.users.find(x=>x.on&&x.pin&&x.pin==hs(v));
 if(!u)return toast(_('Code incorrect'));
 CU=u.id;$('#lk').style.display='none';afterUnlock()}
function afterUnlock(){
 if(isO()&&!S.rc)showRecovery();
 else if(isO()&&!S.set.setup)wizard();
 R()}
function showRecovery(){
 const a=new Uint32Array(2);crypto.getRandomValues(a);const code=String(a[0]%10000).padStart(4,'0')+String(a[1]%10000).padStart(4,'0');
 S.rc=hs(code);save(true);
 M(`<h2>${_('Votre code de secours')}</h2><p>${_('Si vous oubliez votre code PIN, ce code de secours permet d\'en créer un nouveau sans perdre vos données.')}</p><div class="tot" style="text-align:center;letter-spacing:3px">${code.slice(0,4)} ${code.slice(4)}</div><p class="hint" style="margin:8px 0">${_('Notez-le sur papier et gardez-le en lieu sûr. Il ne sera plus affiché.')}</p><div class="pay2 o"><button class="b gr" onclick="recDone()">${_('J\'ai noté le code')}</button></div>`)}
function recDone(){M();if(!S.set.setup&&isO())wizard();R()}
function forgot(){
 if(!S.rc)return info(_('Code de secours absent'),`<p>${_('Aucun code de secours n\'a été créé sur ce téléphone. Réinstallez l\'application puis restaurez une sauvegarde.')}</p>`);
 $('#lk').style.display='none';
 ask(_('Code de secours'),_('Entrez le code de secours à 8 chiffres'),v=>{
  if(hs(v.replace(/\D/g,''))==S.rc){const o=S.users.find(u=>u.r=='o');o.pin=null;save(true);lock()}
  else{toast(_('Code de secours incorrect'));lock()}});
 const x=document.querySelector('#m .pay2 .ol');if(x)x.setAttribute('onclick','M();lock()')}
function wizard(){
 M(`<h2>${_('Bienvenue')} 👋</h2><label>${_('Nom de votre commerce')}</label><input class="in" id="wn" value="${esc(S.shop.name==='Ma boutique'?'':S.shop.name)}" placeholder="${_('Ma boutique')}">
<label>${_('Type de commerce')}</label><select class="in" id="wt"><option value="b">${_('Boutique, alimentation')}</option><option value="ph">${_('Pharmacie')}</option><option value="q">${_('Quincaillerie, matériaux')}</option><option value="o">${_('Autre commerce')}</option></select>
<label>${_('Votre téléphone (facultatif)')}</label><input class="in" id="wp" inputmode="tel">
<label>${_('Pour commencer')}</label><select class="in" id="wd"><option value="0">${_('Commencer avec un stock vide')}</option><option value="1">${_('Essayer avec des produits d\'exemple')}</option></select>
<div class="pay2 o"><button class="b gr" onclick="wizOk()">${_('Commencer')}</button></div>`)}
function wizOk(){
 const t=$('#wt').value;
 S.shop.name=$('#wn').value.trim()||'Ma boutique';S.shop.tel=$('#wp').value.trim();S.set.type=t;S.set.mods.ph=t=='ph'?1:0;
 if($('#wd').value=='0'){S.p=[]}
 S.set.setup=1;save(true);M();R()}
let hid=0;
function lockInit(){
 if(FR)return;
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hid=Date.now();else if(hid&&Date.now()-hid>120000)lock()})}
