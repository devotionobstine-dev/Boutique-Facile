// ---- langues : l'application est en français ; d'autres langues se remplissent avec l'éditeur de traduction
// (aucune traduction n'est inventée : sans traduction saisie, le français reste affiché)
let TE={c:'',q:'',f:'todo',pg:0},TEL=[];
// une traduction est du texte simple : pas de balises, pas de guillemets doubles (elles se retrouvent dans des attributs HTML)
const trClean=v=>String(v==null?'':v).replace(/[<>]/g,'').replace(/"/g,'”').trim();
const trDone=c=>{const T=S.tr[c]||{};return CAT.filter(k=>T[k]).length};
SUB.lang=()=>{
 return `${backBtn()}<h3>🌍 ${_('Langue')}</h3>
<div class="card">
<div class="row tap" onclick="lgSet('fr')"><div class="gr1"><b>Français</b></div>${LANG=='fr'?'<b class="pos">✓</b>':''}</div>
${S.langs.map(l=>{const n=trDone(l.c),p=CAT.length?Math.round(n*100/CAT.length):0;return `<div class="row"><div class="gr1 tap" onclick="lgSet('${esc(l.c)}')"><b>${esc(l.n)}</b><small>${p} % ${_('traduit')} (${n}/${CAT.length})</small></div>${LANG==l.c?'<b class="pos">✓</b>':''}<button class="b xs ol" onclick="TE.c='${esc(l.c)}';TE.pg=0;go('p','tr')">${_('Traduire')}</button></div>`}).join('')}</div>
<div class="top"><button class="b ol" onclick="lgNew()">＋ ${_('Ajouter une langue')}</button></div>
<div class="bn y">${_('Les traductions en soussou, pular ou malinké ne sont pas fournies : elles doivent être saisies par une personne qui parle la langue. Tant qu\'un texte n\'est pas traduit, le français s\'affiche.')}</div>
<div class="bn b">${_('Astuce : exportez le fichier de traduction, faites-le compléter par un proche, puis importez-le sur chaque téléphone.')}</div>`};
function lgSet(c){setLang(c);save(true);R()}
function lgNew(){
 M(`<h2>${_('Ajouter une langue')}</h2><label>${_('Nom de la langue')}</label><input class="in" id="lgn" placeholder="Soussou"><div class="chips" style="padding:8px 0 0">${['Soussou','Pular','Malinké'].map(n=>`<button class="chip" onclick="$('#lgn').value='${n}'">${n}</button>`).join('')}</div>${acts(_('Ajouter'),'lgAdd()')}`)}
function lgAdd(){
 const n=$('#lgn').value.trim();if(!n)return toast(_('Le nom est nécessaire'));
 let c=nz(n).replace(/[^a-z0-9]+/g,'').slice(0,12)||('l'+Date.now().toString(36));
 if(c=='fr')c='fr2';if(S.langs.some(l=>l.c==c))return toast(_('Cette langue existe déjà'));
 S.langs.push({c,n});S.tr[c]=S.tr[c]||{};save(true);M();TE={c,q:'',f:'todo',pg:0};go('p','tr')}
function trFilter(){
 const T=S.tr[TE.c]||{};let L=CAT.slice();const nq=nz(TE.q);
 if(nq)L=L.filter(k=>nz(k).includes(nq)||nz(T[k]||'').includes(nq));
 if(TE.f=='todo')L=L.filter(k=>!T[k]);
 return L}
function trList(){
 const lg=S.langs.find(l=>l.c==TE.c),T=S.tr[TE.c]||{},L=trFilter(),pz=20,pages=Math.max(1,Math.ceil(L.length/pz));
 TE.pg=Math.max(0,Math.min(TE.pg,pages-1));TEL=L.slice(TE.pg*pz,TE.pg*pz+pz);
 return (TEL.map((k,i)=>`<div class="card pl" style="margin:8px 16px"><div class="sm2" style="color:var(--ink);font-size:.9rem">${esc(k)}</div><input class="in" data-i="${i}" value="${esc(T[k]||'')}" onchange="trSet(this)" placeholder="${esc(lg.n)}…"></div>`).join('')||`<p class="hint">${TE.f=='todo'?_('Tout est traduit. Bravo !'):_('Rien trouvé.')}</p>`)
 +`<div class="btns"><button class="b ol sm" ${TE.pg<=0?'disabled':''} onclick="TE.pg--;R();scrollTo(0,0)">‹ ${_('Avant')}</button><button class="b ol sm" ${TE.pg>=pages-1?'disabled':''} onclick="TE.pg++;R();scrollTo(0,0)">${_('Après')} ›</button></div><p class="sm2" style="text-align:center">${TE.pg+1} / ${pages}</p>`}
function trQ(v){TE.q=v;TE.pg=0;const e=$('#trl');if(e)e.innerHTML=trList()}
function trProg(){const d=trDone(TE.c),b=$('#trp i'),t=$('#trpt');if(b)b.style.width=(CAT.length?(d*100/CAT.length).toFixed(1):0)+'%';if(t)t.textContent=d+'/'+CAT.length+' '+_('textes traduits')}
SUB.tr=()=>{
 const c=TE.c,lg=S.langs.find(l=>l.c==c);if(!lg)return`${backBtn("go('p','lang')")}<p class="hint">${_('Choisissez une langue.')}</p>`;
 S.tr[c]=S.tr[c]||{};const done=trDone(c);
 return `${backBtn("go('p','lang')")}<h3>✎ ${esc(lg.n)}</h3>
<div class="card pl"><div class="bar" id="trp"><i style="width:${CAT.length?(done*100/CAT.length).toFixed(1):0}%"></i></div><p class="sm2" id="trpt" style="margin:6px 0 0">${done}/${CAT.length} ${_('textes traduits')}</p></div>
<div class="srch"><input class="in" placeholder="${_('Chercher un texte…')}" value="${esc(TE.q)}" oninput="trQ(this.value)"></div>
<div class="seg"><button class="${TE.f=='todo'?'on':''}" onclick="TE.f='todo';TE.pg=0;R()">${_('Pas encore traduits')}</button><button class="${TE.f=='all'?'on':''}" onclick="TE.f='all';TE.pg=0;R()">${_('Tous')}</button></div>
<p class="sm2" style="margin:8px 16px 0">${_('Gardez les mots entre accolades, comme {n}, tels quels.')}</p>
<div id="trl">${trList()}</div>
<h3>${_('Fichiers de traduction')}</h3>
<div class="btns"><button class="b ol sm" onclick="trExport()">${_('Exporter (fichier)')}</button><button class="b ol sm" onclick="trCSV()">${_('Exporter pour Excel (CSV)')}</button></div>
<div class="card pl"><label>${_('Importer un fichier de traduction (.json ou .csv)')}</label><input class="in" type="file" accept=".json,.csv,text/csv,application/json" onchange="trImport(this)"></div>
<div class="btns"><button class="b ol sm" onclick="lgDel('${esc(c)}')">${_('Supprimer cette langue')}</button></div>`};
function trSet(el){
 const k=TEL[+el.dataset.i],v=trClean(el.value),T=S.tr[TE.c];if(k===undefined)return;
 if(v){const need=k.match(/\{\w+\}/g)||[];const miss=need.find(x=>!v.includes(x));if(miss){el.value=T[k]||'';return toast(_('Il manque {x} dans la traduction',{x:miss}),3200)}T[k]=v;if(el.value!==v)el.value=v}else delete T[k];
 save();if(TE.c==LANG)TR=T;trProg()}
function trExport(){outFile('traduction-'+TE.c+'.json',JSON.stringify({kind:'bf-lang',c:TE.c,n:(S.langs.find(l=>l.c==TE.c)||{}).n,tr:S.tr[TE.c]||{}},null,1),'application/json')}
function trCSV(){const T=S.tr[TE.c]||{};outFile('traduction-'+TE.c+'.csv',toCSV([[_('Français'),_('Traduction')]].concat(CAT.map(k=>[k,T[k]||'']))),'text/csv')}
function csvParse(t){
 const rows=[];let r=[],c='',q=false;t=t.replace(/^﻿/,'');
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch=='"')q=true;
  else if(ch==';'||ch=='\t'){r.push(c);c=''}
  else if(ch=='\n'){r.push(c);rows.push(r);r=[];c=''}
  else if(ch!='\r')c+=ch}
 if(c!==''||r.length){r.push(c);rows.push(r)}
 return rows}
function trImport(inp){
 const fl=inp.files[0];if(!fl)return;const rd=new FileReader();
 rd.onload=()=>{
  try{
   const txt=String(rd.result),T=S.tr[TE.c]=S.tr[TE.c]||{},set=new Set(CAT);let n=0;
   const put=(k,v)=>{v=trClean(v);if(!v||!set.has(k))return;const need=k.match(/\{\w+\}/g)||[];if(need.some(x=>!v.includes(x)))return;T[k]=v;n++};
   if(/\.json$/i.test(fl.name)||txt.trim()[0]=='{'){const o=JSON.parse(txt);if(o.kind!='bf-lang'||!o.tr)throw new Error('bad');for(const k in o.tr)put(k,o.tr[k])}
   else csvParse(txt).forEach(r=>{if(r.length>=2)put(r[0],r[1])});
   save(true);if(TE.c==LANG)TR=T;R();toast(n?_('{n} texte(s) importé(s) ✓',{n}):_('Aucun texte reconnu'),3000)
  }catch(e){toast(_('Fichier non reconnu'))}};
 rd.readAsText(fl)}
function lgDel(c){sure(_('Supprimer cette langue et ses traductions ?'),()=>{S.langs=S.langs.filter(l=>l.c!=c);delete S.tr[c];if(LANG==c)setLang('fr');TE.c='';save(true);go('p','lang')},_('Supprimer'))}
