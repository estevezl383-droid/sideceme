const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {randomBytes,createCipheriv,createHash}=require('node:crypto');const {gzipSync}=require('node:zlib');
const {servir,cargarPlaywright,sembrarYAbrir,leerGuardado }=require('./navegador');
const { vigente } = require('../extraer')
const zlib=require('node:zlib');
function pngLiso([r, g, b]) {
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(256 * 3, Buffer.from([r, g, b]))])
  const crudo = Buffer.concat(Array.from({ length: 256 }, () => fila))
  const crc = (buf) => {
    let c = ~0
    for (const x of buf) {
      c ^= x
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
    return ~c >>> 0
  }
  const trozo = (tipo, datos) => {
    const t = Buffer.from(tipo)
    const largo = Buffer.alloc(4)
    largo.writeUInt32BE(datos.length)
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(Buffer.concat([t, datos])))
    return Buffer.concat([largo, t, datos, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(256, 0)
  ihdr.writeUInt32BE(256, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ihdr), trozo('IDAT', zlib.deflateSync(crudo)), trozo('IEND', Buffer.alloc(0))])
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sid-paquetes-'));const id='bolivia-prueba',key=randomBytes(32);
// Dentro de Bolivia, en la zona donde también intersecta la caja de Brasil:
// el modo paquetes debe consultar únicamente Bolivia, sin avisos falsos.
const bounds=[-61.45,-17.45,-61.40,-17.40],cx=(bounds[0]+bounds[2])/2,cy=(bounds[1]+bounds[3])/2;
const poly=b=>({type:'Polygon',coordinates:[[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]],[b[0],b[1]]]]});
const manifest={id,version:1,zona:'central',nombre:'Prueba',geometry:poly([cx-.75,cy-.75,cx+.75,cy+.75]),entries:[]};let offset=0;const bodies=[];
function add(p,raw,codec='raw',meta={}){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(Buffer.from(id+'\n'+p));const data=codec==='gzip'?gzipSync(raw):raw;const b=Buffer.concat([c.update(data),c.final(),c.getAuthTag()]);manifest.entries.push({path:p,offset,length:b.length,plainBytes:raw.length,codec,iv:iv.toString('base64'),...meta});bodies.push(b);offset+=b.length;}
add('check',Buffer.from('OK'));
const layers=['hidro_lineas','hidro_poligonos','elevaciones_puntos','comunicaciones_vias','comunicaciones_caminos','comunicaciones_calles','comunicaciones_ffcc','comunicaciones_aero','poblaciones_puntos','poblaciones_areas','poblaciones_pois','vegetacion'];
for(let i=0;i<layers.length;i++){
 const layer=layers[i];const geometry=/puntos|pois/.test(layer)?{type:'Point',coordinates:[cx,cy]}:/poligonos|areas|aero|vegetacion/.test(layer)?poly([cx-.01,cy-.01,cx+.01,cy+.01]):{type:'LineString',coordinates:[[cx-.015,cy-.015],[cx+.015,cy+.015]]};
 const fc={type:'FeatureCollection',features:[{type:'Feature',id:i,bbox:bounds,geometry,properties:{name:'Prueba',fclass:layer==='vegetacion'?'forest':layer==='hidro_lineas'?'river':'primary'}}]};
 add('vector/'+layer,Buffer.from(JSON.stringify(fc)),'gzip',{layer,bbox:bounds});
}
const xy=(lon,lat,z)=>[(lon+180)/360*2**z,(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*2**z];
const dem=pngLiso([140,0,0]);for(let z=7;z<=12;z++){const [x0,y0]=xy(bounds[0],bounds[3],z),[x1,y1]=xy(bounds[2],bounds[1],z);for(let x=Math.floor(x0);x<=Math.floor(x1);x++)for(let y=Math.floor(y0);y<=Math.floor(y1);y++)add(`dem/${z}/${x}/${y}.png`,dem);}
for(let x=Math.floor(bounds[0]*2);x<=Math.floor(bounds[2]*2);x++)for(let y=Math.floor(bounds[1]*2);y<=Math.floor(bounds[3]*2);y++)add(`lc/${x}_${y}.png`,pngLiso([1,1,1]));
const h=Buffer.from(JSON.stringify(manifest)),prefix=Buffer.alloc(12);prefix.write('SIDPKG1\n');prefix.writeUInt32LE(h.length,8);
let file=path.join(tmp,'test.sidcalco');fs.writeFileSync(file,Buffer.concat([prefix,h,...bodies]));
let grant={ok:true,key:key.toString('base64'),manifest_sha256:createHash('sha256').update(h).digest('hex'),expires:new Date(Date.now()+3600000).toISOString()};
if(process.env.REAL_PACKAGE){file=process.env.REAL_PACKAGE;const fd=fs.openSync(file,'r'),prefix=Buffer.alloc(12);fs.readSync(fd,prefix);const head=Buffer.alloc(prefix.readUInt32LE(8));fs.readSync(fd,head);fs.closeSync(fd);const m=JSON.parse(head);const registry=JSON.parse(fs.readFileSync(process.env.PACKAGE_KEYS));grant={ok:true,...registry[m.id],expires:new Date(Date.now()+3600000).toISOString()};}
(async()=>{
 const {srv,url}=await servir();const {chromium}=cargarPlaywright();let browser;
 try{
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.SIDECEME_CALCOS={url:'https://prueba.supabase.co',anonKey:'test',token:'test',esProfesor:false};});
 await page.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>{
 const u=r.request().url();requests.push(u+(r.request().postData()||''));const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'};
 if(r.request().method()==='OPTIONS')return r.fulfill({status:200,headers:cors});
 if(u.includes('calcos-paquetes'))return r.fulfill({status:200,headers:cors,json:grant});
 if(u.includes('calcos-datos'))return r.fulfill({status:200,headers:cors,json:{ok:true,permitido:true}});
 if(/tile|MapServer/i.test(u))return r.fulfill({status:200,contentType:'image/png',body:dem});
 return r.abort();});
 await page.route(`**/assets/${path.basename(vigente())}*`,r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(vigente(),'utf8')+';window.__testPaquetes={cmoc:UU,capas:Yle};'}));
 await page.goto(url+'?paquetes=1',{waitUntil:'domcontentloaded'});
 const entendido=page.getByRole('button',{name:/^entendido$/i});if(await entendido.count())await entendido.first().click();
 await page.locator('#sid-paquetes input').setInputFiles(file);
 await page.waitForFunction(()=>document.querySelector('#sid-paquetes [role=status]')?.textContent.includes('Zonas listas'),null,{timeout:30000});
 await page.evaluate(()=>{const original=SIDPaquetes.capas;window.__paisesPaquete=[];SIDPaquetes.capas=(ids,pais,...resto)=>{__paisesPaquete.push(pais);return original(ids,pais,...resto);};});
 const aoi={type:'Feature',properties:{},geometry:poly(bounds)};
 await sembrarYAbrir(page,{version:1,nombre:'Prueba paquetes',pais:'bolivia',aoi,aoPuntos:[],unidades:[],ops:{},cmoc:null,resultados:null});
 await page.locator('button.btn-generar').first().evaluate(b=>b.click());
 await page.waitForFunction(()=>window.__resultados?.vegetacion?.total>0&&window.__resultados?.comunicaciones?.total>0,null,{timeout:90000});
 const result=await page.evaluate(()=>Object.fromEntries(Object.entries(window.__resultados).map(([k,v])=>[k,v.total])));console.log('Calcos generados',result);
 assert.ok((await page.evaluate(()=>__paisesPaquete)).every(p=>'bolivia'===p),'El generador no consulta otros países con paquetes de Bolivia');
 assert.equal(await page.locator('.mensaje-error').count(),0,'No aparecen avisos redundantes de Bolivia ni de capas civiles');
 // Exercise the same DEM and landcover source used by the unchanged CMOC engine.
 const sources=await page.evaluate(async b=>{const a={type:'Polygon',coordinates:[[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]],[b[0],b[1]]]]};const lc=await SIDPaquetes.landcover(a);return {size:lc.grid.length,clase:lc.grid[0]};},bounds);
 assert.ok(sources.size>0);assert.ok(sources.clase>=0&&sources.clase<=8);
 const cmoc=await page.evaluate(async a=>{const d=await __testPaquetes.capas(['hidro_lineas','hidro_poligonos','vegetacion','poblaciones_areas'],'bolivia',a);const r=await __testPaquetes.cmoc(a,d);return {restringido:r.restringido.length,severo:r.severo.length};},aoi);assert.ok(cmoc.restringido+cmoc.severo>0);console.log('Motor CMOC completado',cmoc);
 await page.keyboard.press('Control+s');await page.waitForTimeout(1500);
 const saved=await leerGuardado(page,'Prueba paquetes');assert.ok(saved?.resultados?.comunicaciones);
 assert.ok(!requests.some(u=>u.includes('calcos-datos')&&u.includes('recortar')),'No descargar vectores');
 assert.ok(!requests.some(u=>u.includes('terrarium')||u.includes('exportImage')),'No descargar relieve ni cobertura');
 assert.ok(!requests.some(u=>u.includes('calco-ops')),'No autoguardar en servidor');
 assert.deepEqual(errors,[]);
 // Los avisos rutinarios desaparecen, pero un fallo que exige actuar permanece
 // visible aunque el grupo de Áreas de Interés esté plegado.
 await page.evaluate(()=>SIDPaquetes.cerrar());
 await sembrarYAbrir(page,{version:1,nombre:'Paquete cerrado (ficticio)',pais:'bolivia',aoi:{...aoi,properties:{nombre:'Área sin paquete cargado'}},aoPuntos:[],unidades:[],ops:{},cmoc:null,resultados:null});
 await page.locator('button.btn-generar').first().click();
 await page.locator('.mensaje-error').filter({hasText:/Primero cargá el paquete/}).waitFor();
 assert.equal(await page.getByRole('button',{name:'2 · Áreas de Interés',exact:true}).getAttribute('aria-expanded'),'false');
 if(process.env.TEST_SCREENSHOT)await page.screenshot({path:process.env.TEST_SCREENSHOT,fullPage:true});
 await page.screenshot({path:path.join(tmp,'paquetes.png'),fullPage:true});console.log('E2E OK: importación cifrada, cinco calcos, fuentes CMOC, guardado local; sin pedidos de datos. Captura:',tmp);
 }finally{if(browser)await browser.close();srv.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
