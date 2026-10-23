// ---- codes-barres : douchette (clavier), caméra du téléphone (détecteur du système ou décodeur intégré EAN/UPC)
let beepOn=false,AC=null;
function beep(){
 if(!beepOn)return;beepOn=false;
 try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=880;g.gain.value=.15;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+.12)}catch(e){}}
const camOK=()=>!FR&&!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
const bcKey=c=>String(c||'').replace(/\D/g,'').replace(/^0+/,'');
function findBc(code){
 const k=bcKey(code);if(!k)return S.p.find(x=>!x.off&&x.bc==code);
 return S.p.find(x=>!x.off&&x.bc&&(x.bc==code||bcKey(x.bc)==k))}
// ---- décodeur EAN-13 / EAN-8 / UPC-A (sans bibliothèque)
const E_L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const E_G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const E_PAR=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
const runsOf=b=>{const o=[];let c=b[0],n=0;for(const x of b){if(x==c)n++;else{o.push(n);c=x;n=1}}o.push(n);return o};
const E_TL=E_L.map(runsOf),E_TG=E_G.map(runsOf);
// un chiffre = 4 largeurs ; on cherche le modèle le plus proche
function eDigit(w,m,sets){
 let best=null;
 for(const [name,T] of sets)for(let d=0;d<10;d++){const t=T[d];let e=0;for(let i=0;i<4;i++){const x=w[i]/m-t[i];e+=x*x}if(!best||e<best.e)best={d,s:name,e}}
 return best&&best.e<1.1?best:null}
function eCheck(s){let t=0;for(let i=0;i<s.length-1;i++)t+=(+s[i])*(((s.length-i)%2==0)?3:1);return(10-t%10)%10==+s[s.length-1]}
// tableau de largeurs (en pixels) -> chaîne de chiffres ou null ; la première largeur est une barre noire
function eTry(w,i,n){
 const g=[w[i],w[i+1],w[i+2]],m0=(g[0]+g[1]+g[2])/3;
 if(!(m0>0.9))return null;
 for(const x of g)if(x<m0*.45||x>m0*1.9)return null;
 const half=n==13?6:4,L=[],R=[];let par='';
 const base=i+3;
 for(let k=0;k<half;k++){
  const q=[w[base+4*k],w[base+4*k+1],w[base+4*k+2],w[base+4*k+3]],W=q[0]+q[1]+q[2]+q[3],m=W/7;
  if(m<m0*.55||m>m0*1.8)return null;
  const r=eDigit(q,m,n==13?[['L',E_TL],['G',E_TG]]:[['L',E_TL]]);if(!r)return null;L.push(r.d);par+=r.s}
 const c0=base+4*half;
 const cg=[w[c0],w[c0+1],w[c0+2],w[c0+3],w[c0+4]];
 for(const x of cg)if(x<m0*.4||x>m0*2)return null;
 const r0=c0+5;
 for(let k=0;k<half;k++){
  const q=[w[r0+4*k],w[r0+4*k+1],w[r0+4*k+2],w[r0+4*k+3]],W=q[0]+q[1]+q[2]+q[3],m=W/7;
  if(m<m0*.55||m>m0*1.8)return null;
  const r=eDigit(q,m,[['R',E_TL]]);if(!r)return null;R.push(r.d)}
 const e0=r0+4*half,eg=[w[e0],w[e0+1],w[e0+2]];
 for(const x of eg)if(x<m0*.4||x>m0*2)return null;
 let s;
 if(n==13){const f=E_PAR.indexOf(par);if(f<0)return null;s=String(f)+L.join('')+R.join('')}else s=L.join('')+R.join('');
 return eCheck(s)?s:null}
// une ligne de pixels (0-255) -> code ou null
function decodeLine(lum){
 const n=lum.length;if(n<60)return null;
 const pre=new Float64Array(n+1);for(let i=0;i<n;i++)pre[i+1]=pre[i]+lum[i];
 const win=Math.max(15,(n/6)|0),h=win>>1,bits=new Uint8Array(n);
 for(let i=0;i<n;i++){const a=Math.max(0,i-h),b=Math.min(n,i+h+1),mean=(pre[b]-pre[a])/(b-a);bits[i]=lum[i]<mean-3?1:0}
 const runs=[],dark=[];let c=bits[0],len=0;
 for(let i=0;i<n;i++){if(bits[i]==c)len++;else{runs.push(len);dark.push(c);c=bits[i];len=1}}
 runs.push(len);dark.push(c);
 for(const need of [13,8]){
  const cnt=need==13?59:43;
  for(let i=0;i+cnt<=runs.length;i++){
   if(!dark[i])continue;
   const g0=runs[i],g1=runs[i+1],g2=runs[i+2],gx=Math.max(g0,g1,g2),gn=Math.min(g0,g1,g2);
   if(gn<1||gx>gn*3)continue;
   const m0=(g0+g1+g2)/3;
   // zone calme (claire) avant et après le code, sauf si le code touche le bord de l'image : évite de « lire » des rayures ou une partie d'un autre code
   if(i>=2&&runs[i-1]<m0*3.6)continue;
   if(i+cnt<runs.length-1&&runs[i+cnt]<m0*3.6)continue;
   for(const dl of [0,.1,-.1,.2,-.2,.3,-.3,.4,-.4,.5,-.5]){
    const w=new Array(cnt);for(let k=0;k<cnt;k++)w[k]=Math.max(.3,runs[i+k]+(dark[i+k]?-dl:dl)*m0);
    const r=eTry(w,0,need);if(r)return r}}}
 return null}
// image (RGBA) -> code ; on lit plusieurs lignes, dans les deux sens
function decodeImage(d,W,H,fr){
 const lines=fr||[.3,.38,.46,.5,.54,.62,.7];
 for(const f of lines){
  const y=Math.min(H-2,Math.max(1,Math.round(H*f))),lum=new Float64Array(W);
  for(let x=0;x<W;x++){let s=0;for(let dy=-1;dy<=1;dy++){const o=((y+dy)*W+x)*4;s+=d[o]*.3+d[o+1]*.59+d[o+2]*.11}lum[x]=s/3}
  let r=decodeLine(lum);if(r)return r;
  r=decodeLine(lum.slice().reverse());if(r)return r}
 return null}
// ---- caméra
let CAMS=null;
async function scanFor(ctx){
 if(!camOK())return toast(_('La caméra n\'est pas disponible ici'));
 if(CAMS)return;
 const el=$('#cam');el.style.display='flex';
 el.innerHTML=`<video id="cv" playsinline muted autoplay></video><div class="fr"></div><div class="cb"><div id="cst">${_('Placez le code-barres à plat dans le cadre')}</div><div class="btns" style="padding:8px 0 0"><button class="b yl" onclick="scanStop()">${_('Terminer')}</button></div></div>`;
 CAMS={ctx,run:true,last:'',lt:0,seen:{},det:null,cv:document.createElement('canvas'),n:0};
 try{
  if('BarcodeDetector' in window){try{const fm=await BarcodeDetector.getSupportedFormats();const want=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf'].filter(x=>fm.includes(x));if(want.length)CAMS.det=new BarcodeDetector({formats:want})}catch(e){}}
  CAMS.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
  const v=$('#cv');if(!v||!CAMS)return;v.srcObject=CAMS.stream;await v.play();
  beepOn=false;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
  scanTick()
 }catch(e){
  scanStop();toast(e&&e.name=='NotAllowedError'?_('Autorisez la caméra dans les réglages du téléphone'):_('La caméra ne démarre pas'),3800)}}
function scanStop(){
 if(!CAMS)return;CAMS.run=false;
 try{CAMS.stream&&CAMS.stream.getTracks().forEach(t=>t.stop())}catch(e){}
 CAMS=null;const el=$('#cam');el.style.display='none';el.innerHTML=''}
async function scanTick(){
 const C=CAMS;if(!C||!C.run)return;
 const v=$('#cv');
 try{
  if(v&&v.readyState>=2&&v.videoWidth){
   if(C.det){const r=await C.det.detect(v);if(r.length)scanSeen(r[0].rawValue,1)}
   else{
    // on lit la bande centrale de l'image, à la résolution de la caméra (plus de pixels par barre = lecture plus sûre)
    const vw=v.videoWidth,vh=v.videoHeight,sw=Math.min(vw,1280),k=sw/vw,sy=Math.round(vh*.375),sh0=Math.max(8,Math.round(vh*.25)),sh=Math.max(8,Math.round(sh0*k));
    C.cv.width=sw;C.cv.height=sh;const g=C.cv.getContext('2d',{willReadFrequently:true});g.drawImage(v,0,sy,vw,sh0,0,0,sw,sh);
    const code=decodeImage(g.getImageData(0,0,sw,sh).data,sw,sh,[.5,.35,.65,.2,.8,.08,.92]);if(code)scanSeen(code,2)}}
 }catch(e){}
 if(CAMS&&CAMS===C&&C.run)setTimeout(scanTick,C.det?150:110)}
function scanSeen(code,need){
 const C=CAMS;if(!C||!code)return;const now=Date.now();
 const o=C.seen[code]||(C.seen[code]={n:0,t:now});if(now-o.t>1500){o.n=0}o.t=now;o.n++;
 if(o.n<need)return;
 // le même article qui reste devant la caméra n'est compté qu'une fois ; pour en compter un deuxième, l'enlever puis le remettre
 if(code==C.last){const gap=now-C.lt;C.lt=now;if(gap<1300)return}
 C.last=code;C.lt=now;o.n=0;
 scanGot(C.ctx,code)}
function scanGot(ctx,code){
 const p=findBc(code);
 if(ctx=='pf'){scanStop();const e=$('#fb');if(e)e.value=code;if(PF)PF.bc=code;toast(_('Code lu : {c}',{c:code}));return}
 if(ctx=='stock'){scanStop();sq0=code;R();return}
 if(!p){toast(_('Code {c} inconnu',{c:code}),2600);return}
 if(ctx=='buy'){scanStop();if(BU&&!BU.lines.some(l=>l.pid==p.id))buyAdd(p.id);return}
 beepOn=true;vadd(p.id,undefined,true);beepOn=false;
 const q=rq(cart.filter(l=>l.id==p.id).reduce((a,l)=>a+l.q,0)),st=$('#cst');
 if(st)st.textContent='✓ '+p.n+' — '+_('{n} au panier',{n:fq(q)})+(q*1>avail(p)?' ⚠ '+_('stock insuffisant'):'')}
// ---- douchette (clavier) : chiffres rapides terminés par Entrée, hors des champs de saisie
let wbuf='',wt=0;
document.addEventListener('keydown',e=>{
 const t=e.target,tn=t&&t.tagName;if(tn=='INPUT'||tn=='TEXTAREA'||tn=='SELECT')return;
 if(!S||$('#lk').style.display=='flex'||$('#m').innerHTML)return;
 const now=Date.now();
 if(e.key=='Enter'){const c=wbuf;wbuf='';if(c.length>=6&&/^[0-9A-Za-z-]+$/.test(c)){e.preventDefault();wedge(c)}return}
 if(e.key&&e.key.length==1){if(now-wt>90)wbuf='';wt=now;wbuf+=e.key}});
function wedge(code){
 if(tab=='v'&&!sub){const p=findBc(code);if(!p)return toast(_('Code {c} inconnu',{c:code}));beepOn=true;vadd(p.id);beepOn=false}
 else if(tab=='s'&&sub=='buyn'&&BU){const p=findBc(code);if(p&&!BU.lines.some(l=>l.pid==p.id))buyAdd(p.id)}}
