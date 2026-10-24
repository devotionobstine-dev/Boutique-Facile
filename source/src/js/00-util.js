'use strict';
const BUILD='__BUILD__';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const rq=n=>Math.round(n*1000)/1000;
const fq=n=>String(rq(n)).replace('.',',');
const fm=n=>Math.round(+n||0).toLocaleString('fr-FR').replace(/ /g,' ');
const f=n=>fm(n)+' GNF';
const num=s=>{const v=parseInt(String(s==null?'':s).replace(/[^\d]/g,''),10);return isNaN(v)?NaN:v};
const dec=s=>{const v=parseFloat(String(s==null?'':s).replace(/\s| | /g,'').replace(',','.'));return isNaN(v)?NaN:v};
const nz=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const DAY=864e5;
const COL=new Intl.Collator('fr',{sensitivity:'base',numeric:true});
const D0=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const M0=t=>{const d=new Date(t);d.setHours(0,0,0,0);d.setDate(1);return d.getTime()};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const pd=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():NaN};
const fdate=t=>new Date(t).toLocaleDateString('fr-FR');
const hm=t=>new Date(t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const fdt=t=>fdate(t)+' '+hm(t);
const isToday=t=>D0(t)==D0(Date.now());
const MON=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const mlab=t=>{const d=new Date(t);return MON[d.getMonth()]+' '+d.getFullYear()};
const pct=(a,b)=>b?Math.round(a*1000/b)/10:0;
const pcs=(a,b)=>String(pct(a,b)).replace('.',',');
// ---- langues : la clé est le texte français ; sans traduction on garde le français
let LANG='fr',TR={};
const _=(k,v)=>{let s=TR[k];if(s===undefined||s==='')s=k;return v?s.replace(/\{(\w+)\}/g,(m,a)=>v[a]===undefined?m:v[a]):s};
const X=s=>s; // marqueur : texte à traduire, utilisé avec _() plus tard
// ---- fichiers, liens
// un texte qui commence par = + - @ serait lu comme une formule par Excel : on le fait précéder d'une apostrophe
const csvq=(s,raw)=>{let v=String(s==null?'':s);if(!raw&&typeof s=='string'&&/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
const toCSV=(rows,raw)=>'﻿'+rows.map(r=>r.map(c=>csvq(c,raw)).join(';')).join('\n');
function dl(n,t,y){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:y}));a.download=n;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},4000)}
function ext(u){const a=document.createElement('a');a.href=u;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}
async function shareFile(n,t,y){try{const fl=new File([t],n,{type:y});if(navigator.canShare&&navigator.canShare({files:[fl]})){await navigator.share({files:[fl],title:n});return true}}catch(e){if(e&&e.name=='AbortError')return true}return false}
const phone=t=>{let d=String(t||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d.length==9&&d[0]=='6')d='224'+d;return d};
const waLink=(t,x)=>'https://wa.me/'+phone(t)+'?text='+encodeURIComponent(x);
const smsLink=(t,x)=>'sms:'+String(t||'').replace(/[^\d+]/g,'')+'?&body='+encodeURIComponent(x);
// version d'essai en ligne (cadre isolé) : l'hébergeur bloque les fichiers téléchargés, l'impression et le partage du téléphone
function frNo(){info(_('Pas possible dans la version d\'essai'),`<p>${_('Cette action est bloquée dans la version d\'essai en ligne. Elle fonctionne dans la version installée sur le téléphone.')}</p>`)}
function fcopy(t){
 const show=()=>M(`<h2>${_('Copiez ce texte')}</h2><textarea class="in" rows="8" readonly onfocus="this.select()">${esc(t)}</textarea><p class="sm2">${_('Touchez le texte pour le sélectionner, copiez-le, puis collez-le dans WhatsApp ou un message.')}</p><div class="pay2 o"><button class="b gr" onclick="M()">${_('Fermer')}</button></div>`);
 try{navigator.clipboard.writeText(t).then(()=>toast(_('Texte copié : collez-le dans WhatsApp ou un message'),3200),show)}catch(e){show()}}
function sms(t,x){if(FR)fcopy(x);else ext(smsLink(t,x))}
function share(text,tel){if(FR){fcopy(text);return}if(navigator.share){navigator.share({text}).catch(()=>{});return}ext(waLink(tel,text))}
const b64=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pwKey(pw,salt,use){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,[use])}
async function encText(text,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const k=await pwKey(pw,salt,'encrypt');const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(text)));return JSON.stringify({kind:'bf-backup-enc',v:5,s:b64(salt),i:b64(iv),d:b64(ct)})}
async function decText(o,pw){const k=await pwKey(pw,unb64(o.s),'decrypt');const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(o.i)},k,unb64(o.d));return new TextDecoder().decode(pt)}
const hs=s=>{let h=5381;for(const c of 'bf|'+s)h=(h*33^c.charCodeAt(0))>>>0;return String(h)};
// saisie des montants : espaces entre les milliers
document.addEventListener('input',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('nm')){const neg=t.dataset.neg&&t.value.trim()[0]=='-';const v=num(t.value);const s=isNaN(v)?'':fm(v);t.value=(neg?'-':'')+s}});
