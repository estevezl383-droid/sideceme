// Paquetes geográficos cifrados. No incluye claves en el código público.
export const MAGIC = 'SIDPKG1\n';
const enc = new TextEncoder();
const dec = new TextDecoder();
export const intersecta = (a,b) => a[0]<=b[2] && a[2]>=b[0] && a[1]<=b[3] && a[3]>=b[1];
export function bbox(g) {
  if (g.type === 'Feature') return bbox(g.geometry);
  if (g.type === 'FeatureCollection') return g.features.map(bbox).reduce((a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])]);
  const b=[Infinity,Infinity,-Infinity,-Infinity];
  function walk(v){if(typeof v[0]==='number'){b[0]=Math.min(b[0],v[0]);b[1]=Math.min(b[1],v[1]);b[2]=Math.max(b[2],v[0]);b[3]=Math.max(b[3],v[1]);}else for(const x of v)walk(x);}
  walk(g.coordinates); if(!b.every(Number.isFinite)) throw Error('Área inválida'); return b;
}
const unbase64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export async function leerCabecera(file) {
  if(file.size<12) throw Error('Archivo incompleto');
  const prefix=await file.slice(0,12).arrayBuffer();
  if(dec.decode(prefix.slice(0,8))!==MAGIC) throw Error('Elegí un paquete .sidcalco; un JSON de ejercicio no es un paquete de terreno.');
  const n=new DataView(prefix).getUint32(8,true);
  if(n<50||n>16*1024*1024||n+12>file.size)throw Error('Cabecera inválida');
  const raw=await file.slice(12,12+n).arrayBuffer();const m=JSON.parse(dec.decode(raw));
  if(m.version!==1||typeof m.id!=='string'||!m.geometry||!Array.isArray(m.entries)||m.entries.length>100000)throw Error('Formato no compatible');
  let last=0;const paths=new Set();
  for(const e of m.entries){
    if(typeof e.path!=='string'||paths.has(e.path)||!Number.isSafeInteger(e.offset)||!Number.isSafeInteger(e.length)||e.offset!==last||e.length<16||e.length>8*1024*1024||e.offset+e.length>file.size-(12+n)||!Number.isInteger(e.plainBytes)||e.plainBytes<0||e.plainBytes>16*1024*1024||typeof e.iv!=='string'||unbase64(e.iv).length!==12)throw Error('Índice de paquete inválido');
    paths.add(e.path);last=e.offset+e.length;
  }
  if(last!==file.size-(12+n))throw Error('Paquete incompleto o con contenido adicional');
  return {m,base:12+n,hash:hex(await crypto.subtle.digest('SHA-256',raw))};
}
export class Paquete {
  constructor(file,head,grant,key){this.file=file;Object.assign(this,head);this.expires=Date.parse(grant.expires);this.key=key;this.entries=new Map(this.m.entries.map(e=>[e.path,e]));this.cache=new Map();}
  static async abrir(file,autorizar){
    const h=await leerCabecera(file);const grant=await autorizar(h.m.id,h.hash);
    if(!grant?.ok||grant.manifest_sha256!==h.hash||!Number.isFinite(Date.parse(grant.expires))||Date.parse(grant.expires)<=Date.now())throw Error('El paquete no está autorizado o su habilitación venció.');
    const key=await crypto.subtle.importKey('raw',unbase64(grant.key),'AES-GCM',false,['decrypt']);
    const p=new Paquete(file,h,grant,key);await p.bytes('check');return p;
  }
  vigente(){if(Date.now()>=this.expires)throw Error('La autorización del paquete venció. Volvé a cargarlo con conexión.');}
  async bytes(path){
    this.vigente();if(this.cache.has(path))return this.cache.get(path);
    const e=this.entries.get(path);if(!e)throw Error('Falta una parte del terreno. Cargá también el paquete de la zona vecina.');
    const encrypted=await this.file.slice(this.base+e.offset,this.base+e.offset+e.length).arrayBuffer();
    let plain;
    try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(e.iv),additionalData:enc.encode(this.m.id+'\n'+path)},this.key,encrypted);}catch{throw Error('El paquete está dañado o fue modificado. Volvé a descargarlo.');}
    if(e.codec==='gzip') {
      const reader=new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
      const pieces=[];let size=0;
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>e.plainBytes){await reader.cancel();throw Error('Contenido de tamaño inválido');}pieces.push(value);}
      plain=await new Blob(pieces).arrayBuffer();
    }
    if(plain.byteLength!==e.plainBytes)throw Error('Contenido incompleto');
    this.cache.set(path,plain);while(this.cache.size>8)this.cache.delete(this.cache.keys().next().value);return plain;
  }
}
const packages=new Map(),demCache=new Map(),lcCache=new Map();
async function autorizar(id,hash){
  const c=window.SIDECEME_CALCOS;if(!c?.token)throw Error('Entrá a SIDECEME con tu cuenta y abrí el generador en esta misma pestaña.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try {
    const r=await fetch(c.url+'/functions/v1/calcos-paquetes',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json',apikey:c.anonKey,Authorization:'Bearer '+c.anonKey},body:JSON.stringify({token:c.token,paquete:id,manifest_sha256:hash})});
    const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'No estás habilitado para abrir este paquete.');return d;
  }finally{clearTimeout(timer);}
}
function activos(){if(!packages.size)throw Error('Primero cargá el paquete de terreno de tu zona.');for(const p of packages.values())p.vigente();return [...packages.values()];}
async function archivo(path){for(const p of activos())if(p.entries.has(path))return p.bytes(path);throw Error('El área sale de los paquetes cargados. Agregá la zona vecina.');}
function limite(cache,n){while(cache.size>n)cache.delete(cache.keys().next().value);}
async function png(path){const b=await archivo(path),im=await createImageBitmap(new Blob([b],{type:'image/png'}));const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);im.close();return {data:x.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height};}
async function capas(ids,pais,aoi,recortar,area){
  const ps=activos();if(pais!=='bolivia')return Object.fromEntries(ids.map(id=>[id,{type:'FeatureCollection',features:[]}]));
  if(!aoi)throw Error('Dibujá primero tu área de trabajo.');const b=bbox(aoi);
  if(b[2]-b[0]>4||b[3]-b[1]>4)throw Error('Elegí un área de trabajo menor; el paquete guarda la región completa, pero se calcula por áreas.');
  let covered=0;for(const p of ps)covered+=area(recortar({type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:p.m.geometry}]},aoi));
  if(covered<area(aoi)*.9999)throw Error('Tu área sale de las zonas cargadas. Agregá el paquete vecino o ajustá el área dentro de Bolivia.');
  const out={};
  for(const id of ids){
    const seen=new Set(),features=[];
    for(const p of ps)for(const e of p.m.entries){
      if(e.layer!==id||!intersecta(e.bbox,b))continue;
      const chunk=JSON.parse(dec.decode(await p.bytes(e.path)));
      for(const f of chunk.features)if(!seen.has(f.id)&&intersecta(f.bbox,b)){seen.add(f.id);features.push(f);if(features.length>100000)throw Error("El área contiene demasiados elementos. Elegí un área de trabajo menor.");}
      await new Promise(r=>setTimeout(r,0));
    }
    const fc=recortar({type:'FeatureCollection',features},aoi);fc._recortada=true;
    out[id]=fc;
  }return out;
}
async function demTile(z,x,y){
  activos();const path=`dem/${z}/${x}/${y}.png`;if(demCache.has(path))return demCache.get(path);
  const im=await png(path);if(im.w!==256||im.h!==256)throw Error('Relieve inválido');
  const a=new Float32Array(65536);for(let i=0;i<a.length;i++)a[i]=im.data[4*i]*256+im.data[4*i+1]+im.data[4*i+2]/256-32768;
  demCache.set(path,a);limite(demCache,48);return a;
}
async function landcover(aoi,progress=()=>{}){
  activos();const [w,s,e,n]=bbox(aoi),ratio=(e-w)/(n-s||1e-6),W=ratio>=1?768:Math.max(48,Math.round(768*ratio)),H=ratio>=1?Math.max(48,Math.round(768/ratio)):768;
  if(e-w>4||n-s>4)throw Error('Área demasiado grande');progress('Leyendo cobertura vegetal del paquete…');
  const grid=new Uint8Array(W*H);grid.fill(8);
  // Composite one source cell at a time: never retain every raster of a large AOI.
  for(let tx=Math.floor(w*2);tx<=Math.floor(e*2);tx++)for(let ty=Math.floor(s*2);ty<=Math.floor(n*2);ty++){
    const path=`lc/${tx}_${ty}.png`;let im=lcCache.get(path);if(!im){im=await png(path);lcCache.set(path,im);limite(lcCache,2);}
    const x0=Math.max(0,Math.floor((tx/2-w)/(e-w)*W)),x1=Math.min(W,Math.ceil(((tx+1)/2-w)/(e-w)*W));
    const y0=Math.max(0,Math.floor((n-(ty+1)/2)/(n-s)*H)),y1=Math.min(H,Math.ceil((n-ty/2)/(n-s)*H));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
      const lon=w+(x+.5)/W*(e-w),lat=n-(y+.5)/H*(n-s);
      if(Math.floor(lon*2)!==tx||Math.floor(lat*2)!==ty)continue;
      const px=Math.min(im.w-1,Math.max(0,Math.floor((lon*2-tx)*im.w))),py=Math.min(im.h-1,Math.max(0,Math.floor((ty+1-lat*2)*im.h)));
      grid[y*W+x]=im.data[(py*im.w+px)*4];
    }
    await new Promise(r=>setTimeout(r,0));
  }
  return {grid,W,H,w,s,e,n,clases:['agua','arboles','inundada','cultivo','urbano','suelo','arbusto','nieve','nube']};
}
export const api={capas,demTile,landcover,async cargar(file){const p=await Paquete.abrir(file,autorizar);packages.set(p.m.zona,p);demCache.clear();lcCache.clear();return p.m;},cerrar(){packages.clear();demCache.clear();lcCache.clear();},zonas(){return [...packages.values()].map(p=>p.m.nombre);}};
if(typeof window!=='undefined') {
  window.SIDPaquetes=api;
  function ui(){
    const panel=document.createElement(window.SIDECEME_PAQUETES?'details':'div');panel.open=true;panel.id='sid-paquetes';panel.style.cssText='position:fixed;bottom:58px;left:12px;z-index:100001;max-width:460px;padding:10px;border:1px solid #30cbb1;border-radius:10px;background:#081b28;color:white;font:13px system-ui;box-shadow:0 2px 12px #0008';
    if(!window.SIDECEME_PAQUETES){const a=document.createElement('a');const url=new URL(location.href);url.searchParams.set('paquetes','1');url.searchParams.delete('practica');a.href=url.href;a.textContent='Abrir modo paquetes · guardá tu ejercicio antes';a.style.color='#8fffe8';panel.append(a);}
    else {
      const title=document.createElement('summary');title.style.cssText='cursor:move;touch-action:none;user-select:none';title.textContent='Paquetes de terreno · arrastrá para mover';title.title='Arrastrá para mover. Un clic pliega o despliega.';panel.append(title,document.createElement('br'));
      let drag=null,suppressClick=false;
      title.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=panel.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};suppressClick=false;title.setPointerCapture(e.pointerId);});
      title.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;panel.style.bottom='auto';panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,drag.left+dx))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,drag.top+dy))+'px';});
      title.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;suppressClick=drag.moved;drag=null;});
      title.addEventListener('pointercancel',()=>{drag=null;suppressClick=false;});
      title.addEventListener('click',e=>{if(suppressClick){e.preventDefault();suppressClick=false;}});
      window.addEventListener('resize',()=>{if(!panel.style.top)return;const r=panel.getBoundingClientRect();panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,r.left))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,r.top))+'px';});
      const input=document.createElement('input');input.type='file';input.accept='.sidcalco';input.multiple=true;input.setAttribute('aria-label','Cargar paquetes de terreno');
      const status=document.createElement('div');status.setAttribute('role','status');status.textContent='Cargá tu zona. Internet: habilitación y mapa de fondo. No se envían los cambios a la nube.';
      input.onchange=async()=>{input.disabled=true;try{for(const f of input.files){status.textContent='Verificando '+f.name+'…';await api.cargar(f);}status.textContent='Zonas listas: '+api.zonas().join(', ')+'. Dibujá un área dentro de ellas. Para entregar, bajá el ejercicio.';}catch(e){status.textContent=e.message;}finally{input.disabled=false;input.value='';}};
      panel.append(input,status);
    }document.body.append(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ui,{once:true});else ui();
}
