// ---- icônes : les emoji du texte sont remplacés par des icônes au trait fin, identiques sur tous les téléphones
const IC={
'🛒':'<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21 8H6"/>',
'📦':'<path d="M21 8v8a2 2 0 0 1-1 1.7l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.7l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>',
'👥':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
'💰':'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
'☰':'<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
'📷':'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.2"/>',
'🚚':'<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.5 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
'📱':'<rect x="6.5" y="2" width="11" height="20" rx="2.6"/><path d="M11 18.5h2"/>',
'💵':'<rect x="2" y="6" width="20" height="12" rx="2.2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
'🧾':'<path d="M4.5 2v20l2-1.2 2 1.2 2-1.2 2 1.2 2-1.2 2 1.2 2-1.2V2l-2 1.2L15.5 2l-2 1.2L11.5 2l-2 1.2L7.5 2l-2 1.2z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
'🔒':'<rect x="4.5" y="10.5" width="15" height="10.5" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
'📊':'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
'📈':'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
'📉':'<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
'🏬':'<path d="M3 9.5 4.5 4h15L21 9.5"/><path d="M4.5 9.5V20h15V9.5"/><path d="M3 9.5a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
'🏭':'<path d="M22 8.35V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8.35a1 1 0 0 1 .65-.95l9-3.6a1 1 0 0 1 .7 0l9 3.6a1 1 0 0 1 .65.95z"/><path d="M6 18h12M6 14h12"/><rect x="6" y="10" width="12" height="12"/>',
'💾':'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
'🌍':'<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
'⚙':'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
'❓':'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
'💡':'<path d="M9 18h6M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.2.9 2v.3h6v-.3c0-.8.3-1.5.9-2A6.5 6.5 0 0 0 12 2.5z"/>',
'📒':'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
'🏦':'<path d="M3 21.5h18M5.5 18v-7M9.8 18v-7M14.2 18v-7M18.5 18v-7"/><path d="M12 2.5 20.5 8h-17z"/>',
'🖨':'<path d="M6.5 9V3h11v6"/><path d="M6.5 17.5h-2a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6.5" y="14" width="11" height="7.5"/>',
'📋':'<rect x="8" y="2.5" width="8" height="4" rx="1"/><path d="M16 4.5h2a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2M8 12h8M8 16h5"/>',
'📝':'<path d="M14 2.5H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5z"/><path d="M14 2.5v6h6M8 13h8M8 17h5"/>',
'💸':'<rect x="2" y="6" width="20" height="12" rx="2.2"/><path d="M8 12h8"/>',
'📲':'<rect x="10" y="2" width="11" height="20" rx="2.6"/><path d="M14.5 18.5h2M2 12h5.5M5.2 9.5 7.7 12l-2.5 2.5"/>',
'💊':'<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="m8.5 8.5 7 7"/>',
'⚠':'<path d="M10.3 3.9 1.9 18.2a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
'✅':'<circle cx="12" cy="12" r="10"/><path d="m8 12.3 2.8 2.8 5.4-5.6"/>',
'⏳':'<circle cx="12" cy="12" r="10"/><path d="M12 6.5V12l3.5 2"/>',
'★':'<path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/>',
'✎':'<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
'⬇':'<path d="M12 4.5v15M5.5 13 12 19.5 18.5 13"/>',
'⬆':'<path d="M12 19.5v-15M5.5 11 12 4.5 18.5 11"/>',
'📤':'<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4M12 2v13"/>',
'🟢':'<circle cx="12" cy="12" r="6"/>',
'🔴':'<circle cx="12" cy="12" r="6"/>',
'👋':'','😴':''};
const IC_X={'★':'f is','🟢':'f ig','🔴':'f ir'};
const IC_RE=new RegExp('('+Object.keys(IC).join('|')+')\\uFE0F?','g'),IC_SKIP=/^(OPTION|TEXTAREA|SCRIPT|STYLE|TITLE|svg|INPUT)$/;
const IC_NODES={};
function icoEl(k){
 if(!IC_NODES[k]){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','ic'+(IC_X[k]?' '+IC_X[k]:''));s.setAttribute('aria-hidden','true');s.innerHTML=IC[k];IC_NODES[k]=s}
 return IC_NODES[k].cloneNode(true)}
function icoText(t){
 const s=t.nodeValue;IC_RE.lastIndex=0;if(!IC_RE.test(s))return;IC_RE.lastIndex=0;
 const fr=document.createDocumentFragment();let i=0,m;
 while((m=IC_RE.exec(s))){if(m.index>i)fr.appendChild(document.createTextNode(s.slice(i,m.index)));if(IC[m[1]])fr.appendChild(icoEl(m[1]));i=m.index+m[0].length}
 if(i<s.length)fr.appendChild(document.createTextNode(s.slice(i)));
 if(t.parentNode)t.parentNode.replaceChild(fr,t)}
function icoScan(root){
 if(!root||!root.isConnected)return;
 if(root.nodeType==3){const p=root.parentElement;if(p&&!IC_SKIP.test(p.tagName)&&!p.closest('svg'))icoText(root);return}
 if(root.nodeType!=1||IC_SKIP.test(root.tagName)||root.closest('svg'))return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),L=[];
 while(w.nextNode()){const n=w.currentNode,p=n.parentElement;if(p&&!IC_SKIP.test(p.tagName)&&!p.closest('svg')&&/[\u2300-\uFFFF]/.test(n.nodeValue))L.push(n)}
 L.forEach(icoText)}
(function(){
 if(typeof MutationObserver=='undefined'||typeof document=='undefined')return;
 const mo=new MutationObserver(ms=>{
  for(const m of ms){if(m.type=='characterData')icoScan(m.target);else m.addedNodes.forEach(icoScan)}
  mo.takeRecords()});
 mo.observe(document.body,{childList:true,subtree:true,characterData:true});
 icoScan(document.body)})();
