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
 const current = {...period,id:'active',materia:'UC. Menciones',nota_final:97.87113000000001};
 const old = {...period,id:'old',materia:'Menciones',nota_final:97.7262,estado:'pendiente',publicado_en:pub};
 const valid = {...current,id:'valid',estado:'pendiente',publicado_en:pub};
 const mismatch = {...period,id:'mismatch',materia:'Otra',nota_final:90,estado:'pendiente',publicado_en:pub};
 const db = {sesiones:[{token:'synthetic',usuario_id:'TEST',usuario_tabla:'cursantes',revocado:false,expira_en:'2099-01-01'}],cursantes:[{id:'TEST',activo:true}],notas_academicas:[current,{...period,materia:'Otra',nota_final:91}],notas_confirmaciones:[old,valid,mismatch]};
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
})().catch(e=>{console.error(e);process.exit(1)});
