// ---- démarrage
function registerSW(){
 if(FR||typeof NOSW!='undefined'||!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
 navigator.serviceWorker.register('sw.js').catch(()=>{})}
async function init(){
 try{await loadState()}catch(e){console.error(e);S=newState(true)}
 setLang(S.set.lang||'fr');applyAccent();
 lockInit();
 if(FR){CU=S.users[0].id;if(!S.set.setup)wizard();R()}
 else lock();
 checkMem();setInterval(checkMem,60000);checkUpdate();setInterval(checkUpdate,3600000);
 registerSW()}
addEventListener('error',e=>{try{console.error(e.message)}catch(x){}});
init();
