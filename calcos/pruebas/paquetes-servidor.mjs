import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import {stripTypeScriptTypes} from 'node:module';
let source=fs.readFileSync(new URL('../../supabase/functions/calcos-paquetes/index.ts',import.meta.url),'utf8').replace(/^import .*;$/m,'');
source=stripTypeScriptTypes(source,{mode:'strip'});
const hash='a'.repeat(64);let db,handler;
function reset(){db={sesiones:[{token:'test',usuario_id:'student',usuario_tabla:'cursantes',expira_en:new Date(Date.now()+3600000).toISOString(),revocado:false}],cursantes:[{id:'student',activo:true,nombre_completo:'Prueba',ciclo:'1ER CICLO',paralelo:'A',mencion:''}],profesores:[],calcos_acceso:[{tipo:'ciclo',valor:'1ER CICLO',activo:true}],calcos_paquetes:[{id:'bolivia-test',manifest_sha256:hash,clave_b64:'testkey',activo:true}]};}
function from(table){let filters=[];const chain={select(){return chain},eq(k,v){filters.push([k,v]);return chain},limit(){return chain},then(resolve){resolve({data:(db[table]||[]).filter(row=>filters.every(([k,v])=>row[k]===v)),error:null})}};return chain;}
vm.runInNewContext(source,{createClient:()=>({from}),Deno:{env:{get:()=>''},serve:fn=>handler=fn},Response,Request,Date,JSON,Array,String,Number});
async function call(extra={}){const r=await handler(new Request('https://example.test',{method:'POST',body:JSON.stringify({token:'test',paquete:'bolivia-test',manifest_sha256:hash,...extra})}));return {status:r.status,body:await r.json(),cache:r.headers.get('cache-control')};}
reset();let r=await call();assert.equal(r.status,200);assert.equal(r.body.key,'testkey');assert.match(r.cache,/no-store/);assert.ok(Date.parse(r.body.expires)<=Date.parse(db.sesiones[0].expira_en));
reset();db.sesiones[0].revocado=true;assert.equal((await call()).status,403);
reset();db.sesiones[0].expira_en='2000-01-01';assert.equal((await call()).status,403);
reset();db.cursantes[0].activo=false;assert.equal((await call()).status,403);
reset();db.calcos_acceso=[];assert.equal((await call()).status,403);
reset();db.calcos_paquetes[0].activo=false;assert.equal((await call()).status,403);
reset();assert.equal((await call({manifest_sha256:'b'.repeat(64)})).status,403);
reset();assert.equal((await call({token:''})).status,403);
reset();assert.equal((await call({paquete:'../x'})).status,400);
reset();db.calcos_acceso=[{tipo:'ciclo_paralelo',valor:'1ER CICLO|B',activo:true}];assert.equal((await call()).status,403);
reset();db.calcos_acceso=[{tipo:'ciclo_paralelo',valor:'1ER CICLO|A',activo:true}];assert.equal((await call()).status,200);
reset();db.sesiones[0].usuario_tabla='profesores';db.profesores=[{id:'student',activo:true,rol:'ciencia_tecnologia',es_auxiliar:false}];db.calcos_acceso=[];assert.equal((await call()).status,200);db.profesores[0].es_auxiliar=true;assert.equal((await call()).status,403);
console.log('13 comprobaciones de autorización del servidor OK');
