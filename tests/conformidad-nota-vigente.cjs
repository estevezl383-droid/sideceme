const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {stripTypeScriptTypes} = require('node:module');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = stripTypeScriptTypes(fs.readFileSync(path.join(root, 'supabase/functions/notas-confirmar/index.ts'),'utf8').replace(/^import .*;\n/m,''));
const period = {gestion:2026,semestre:2,ciclo:'2DO CICLO',cursante_id:'TEST'};
const pub = '2026-09-10T10:51:29.734Z';
function setup(options={}) {
 const period = {gestion:2026,semestre:options.semestre || 2,ciclo:options.ciclo || '2DO CICLO',cursante_id:options.cursante_id || 'TEST'};
 const current = {...period,id:'active',materia:'UC. Menciones',nota_final:97.87113000000001};
 const old = {...period,id:'old',materia:'Menciones',nota_final:97.7262,estado:'pendiente',publicado_en:pub};
 const valid = {...current,id:'valid',estado:'pendiente',publicado_en:pub};
 const mismatch = {...period,id:'mismatch',materia:'Otra',nota_final:90,estado:'pendiente',publicado_en:pub};
 const db = {sesiones:[{token:'synthetic',usuario_id:period.cursante_id,usuario_tabla:'cursantes',revocado:false,expira_en:'2099-01-01'}],cursantes:[{id:period.cursante_id,activo:true}],notas_academicas:[current,{...period,materia:'Otra',nota_final:91}],notas_confirmaciones:[old,valid,mismatch]};
 let writes=0;
 class Q {
  constructor(table){this.table=table;this.filters=[];this.single=false;this.patch=null;}
  select(){return this;} eq(k,v){this.filters.push(r=>r[k]===v);return this;}
  not(k,op,v){this.filters.push(r=>r[k]!=null);return this;}
  order(){return this;} limit(){return this;} maybeSingle(){this.single=true;return this;}
  update(p){this.patch=p;return this;}
  then(resolve,reject){return Promise.resolve().then(()=>{
   if(this.patch&&options.race)return {data:null,error:null};
   if(this.patch&&options.guard)return {data:null,error:{code:'23514'}};
   let rows=db[this.table].filter(r=>this.filters.every(f=>f(r)));
   if(this.patch){for(const r of rows)Object.assign(r,this.patch);writes+=rows.length;}
   return {data:this.single?(rows[0]?{...rows[0]}:null):rows.map(r=>({...r})),error:null};
  }).then(resolve,reject);}
 }
 let handler;
 const context={console,Request,Response,Map,Date,createClient:()=>({from:t=>new Q(t)}),Deno:{env:{get:()=>''},serve:f=>{handler=f}}};
 vm.runInNewContext(source,context);
 async function call(body){const res=await handler(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({token:'synthetic',...body})}));return {status:res.status,...await res.json()};}
 return {call,db,writes:()=>writes};
}
(async()=>{
 let t=setup(); let r=await t.call({accion:'pendientes'});assert.deepEqual(r.confirmaciones.map(x=>x.id),['valid']);assert.equal(t.writes(),0);
 r=await t.call({accion:'consultar',confirmacion_id:'old'});assert.equal(r.status,409);assert.equal(r.no_vigente,true);
 r=await t.call({accion:'consultar',confirmacion_id:'valid'});assert.equal(r.confirmacion.nota_final,97.87113000000001);
 const resolve={accion:'resolver',decision:'confirmar',firma:'synthetic-signature',confirmacion_id:'old'};
 r=await t.call(resolve);assert.equal(r.status,409);assert.equal(t.writes(),0);
 r=await t.call({...resolve,confirmacion_id:'mismatch'});assert.equal(r.status,409);assert.equal(t.writes(),0);
 r=await t.call({...resolve,confirmacion_id:'valid',nota_mostrada:'97.7262',publicado_en:pub});assert.equal(r.status,409);assert.equal(t.writes(),0);
 r=await t.call({...resolve,confirmacion_id:'valid',nota_mostrada:'97.8711',publicado_en:'older'});assert.equal(r.status,409);assert.equal(t.writes(),0);
 r=await t.call({...resolve,confirmacion_id:'valid',nota_mostrada:'97.8711',publicado_en:pub});assert.equal(r.ok,true);assert.equal(t.writes(),1);assert.equal(t.db.notas_confirmaciones[1].huella_forense.nota_id,'active');
 r=await t.call({...resolve,confirmacion_id:'valid'});assert.equal(r.status,409);assert.equal(t.writes(),1);
 t=setup({race:true});r=await t.call({...resolve,confirmacion_id:'valid'});assert.equal(r.status,409);assert.equal(t.writes(),0);
 t=setup({guard:true});r=await t.call({...resolve,confirmacion_id:'valid'});assert.equal(r.status,409);assert.equal(t.writes(),0);
 t=setup();r=await t.call({...resolve,confirmacion_id:'valid',token:'invalid'});assert.equal(r.status,401);assert.equal(t.writes(),0);
 console.log('PASS: 12 backend cases: current list, stale/mismatched publication, fresh read, changed display/publication, valid signature, duplicate, race, DB guard, invalid session.');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const start=html.indexOf('let _notaFirmaSolicitud = 0;');
 const end=html.indexOf('// El botón "No estoy de acuerdo"',start);
 assert.ok(start>=0&&end>start);
 const openSource=html.slice(start,end);
 let alerts=[],overlay={style:{},innerHTML:''},next={ok:true,confirmacion:{id:'valid',materia:'UC. Menciones',ciclo:'2DO CICLO',semestre:2,gestion:2026,nota_final:97.87113}};
 const ctx={_ncfInvoke:async()=>next,notasConfCache:[{id:'old',nota_final:97.7262}],notaFirmaState:{},document:{getElementById:()=>overlay},cerrarFirmaNota:()=>{},cargarConformidadesCursante:async()=>{},_ncfRepintarNotas:()=>{},alert:s=>alerts.push(s),escapeHtml:String,etiquetaSemAcad:()=>'',fmtNota:n=>Number(n).toFixed(4),setTimeout:()=>{},initSignatureCanvasNota:()=>{}};
 vm.createContext(ctx);vm.runInContext(openSource,ctx);await ctx.abrirFirmaNota('valid');assert.ok(overlay.innerHTML.includes('97.8711'));assert.ok(!overlay.innerHTML.includes('97.7262'));
 next={ok:false,no_vigente:true,error:'old'};overlay.innerHTML='';await ctx.abrirFirmaNota('old');assert.equal(overlay.innerHTML,'');assert.equal(alerts.length,1);
 console.log('PASS: browser opens current server value and refuses stale cache.');
 for(const ciclo of ['1ER CICLO','2DO CICLO']){
  for(const semestre of [1,2]){
   const student = setup({ciclo,semestre,cursante_id:ciclo+'-'+semestre});
   const list=await student.call({accion:'pendientes'});
   assert.equal(list.confirmaciones.length,1);
   assert.equal(list.confirmaciones[0].ciclo,ciclo);
   assert.equal(list.confirmaciones[0].semestre,semestre);
   const chosen=await student.call({accion:'consultar',confirmacion_id:list.confirmaciones[0].id});
   assert.equal(chosen.confirmacion.ciclo,ciclo);
   assert.equal(chosen.confirmacion.semestre,semestre);
   const signed=await student.call({...resolve,confirmacion_id:'valid',nota_mostrada:'97.8711',publicado_en:pub});
   assert.equal(signed.ok,true);
   const after=await student.call({accion:'pendientes'});
   assert.equal(after.confirmaciones.filter(c=>c.estado==='pendiente').length,0);
  }
 }
 console.log('PASS: ambos ciclos y semestres: aviso vigente, destino correcto y baja del pendiente al firmar.');
 const htmlForBanner=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const bannerStart=htmlForBanner.indexOf('function _ncfHtmlAvisoPendientes(');
 const bannerEnd=htmlForBanner.indexOf('async function actualizarAvisoNotasPendientes()',bannerStart);
 const bannerCtx={escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),escapeAttr:String,etiquetaSemAcad:(c,s)=>'SEMESTRE '+s,fmtNota:n=>Number(n).toFixed(4),_efmTipoTxt:String};
 vm.createContext(bannerCtx);vm.runInContext(htmlForBanner.slice(bannerStart,bannerEnd),bannerCtx);
 const rows=[
 {id:'cycle-1',ciclo:'1ER CICLO',gestion:2026,semestre:2,materia:'Materia A',nota_final:90,estado:'pendiente'},
 {id:'cycle-2',ciclo:'2DO CICLO',gestion:2026,semestre:2,materia:'Materia B',nota_final:97.87113,estado:'pendiente'},
 {id:'signed',ciclo:'1ER CICLO',gestion:2026,semestre:2,materia:'Firmada',nota_final:99,estado:'confirmada'},
 {id:'objected',ciclo:'2DO CICLO',gestion:2026,semestre:2,materia:'Objetada',nota_final:95,estado:'rechazada'}
 ];
 let banner=bannerCtx._ncfHtmlAvisoPendientes(rows,[]);
 assert.ok(banner.includes("abrirFirmaNota('cycle-1')"));
 assert.ok(banner.includes("abrirFirmaNota('cycle-2')"));
 assert.ok(banner.includes('1ER CICLO')&&banner.includes('2DO CICLO'));
 assert.ok(banner.includes('90.0000')&&banner.includes('97.8711'));
 assert.ok(!banner.includes('Firmada')&&!banner.includes('Objetada'));
 assert.ok(banner.includes('2 NOTAS POR RECONOCER'));
 banner=bannerCtx._ncfHtmlAvisoPendientes(rows.filter(c=>c.id!=='cycle-1'),[]);
 assert.ok(!banner.includes("abrirFirmaNota('cycle-1')")&&banner.includes("abrirFirmaNota('cycle-2')"));
 assert.equal(bannerCtx._ncfHtmlAvisoPendientes([],[]),'');
 banner=bannerCtx._ncfHtmlAvisoPendientes([],[{id:7,tipo_evaluacion:'AEROBICA',ciclo:'1ER CICLO',semestre:2,gestion:2026,nota_final:90,estado:'pendiente'}]);
 assert.ok(banner.includes('efmAbrirFirma(7)'));
 console.log('PASS: un enlace por nota publicada, ciclos/periodos correctos, firmadas/objetadas excluidas, siguiente pendiente y EFM conservada.');

})().catch(e=>{console.error(e);process.exit(1)});
