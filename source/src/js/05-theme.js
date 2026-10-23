// ---- apparence : couleur principale au choix (les couleurs d'alerte ne changent pas)
const ACC=[['#0E6B47',X('Vert')],['#1D5FBF',X('Bleu')],['#6B3FB5',X('Violet')],['#B4470B',X('Orange')],['#A3243B',X('Rouge')],['#334155',X('Ardoise')]];
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mixHex=(a,b,p)=>'#'+a.map((v,i)=>Math.round(v*(1-p)+b[i]*p).toString(16).padStart(2,'0')).join('');
function accNow(){const h=S&&S.set&&S.set.ac;return /^#[0-9a-f]{6}$/i.test(h||'')?h:'#0E6B47'}
function applyAccent(){
 const h=accNow(),c=hexRgb(h),st=document.documentElement.style;
 st.setProperty('--ac',h);st.setProperty('--ac2',mixHex(c,[0,0,0],.22));st.setProperty('--acl',mixHex(c,[255,255,255],.9))}
const accSw=()=>ACC.map(([h,n])=>`<button class="sw${accNow().toLowerCase()==h.toLowerCase()?' on':''}" style="background:${h}" aria-label="${esc(_(n))}" title="${esc(_(n))}" onclick="accSet('${h}')"></button>`).join('');
function accSet(h){S.set.ac=h;save();applyAccent();const e=$('#sws');if(e)e.innerHTML=accSw()}
