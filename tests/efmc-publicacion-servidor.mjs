import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as org from '../efm-campo/organizacion.mjs';
let handler,actor='P030',changes={},rpcArgs=null,calls=0,ok=true;
const plan={id:'11111111-1111-1111-1111-111111111111',fecha:'2026-11-03',version:1,modo:'EVALUACION',habilitado:true,grupos:[]};
const session=()=>({usuario_id:actor,usuario_ci:'CI-FICTICIA',usuario_tabla:'profesores',revocado:false,es_master:false,expira_en:'2099-01-01',...changes});
const sb={from(table){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:table==='sesiones'?session():plan};},async single(){return {data:{id:actor,activo:true,grado:'My.'}};}};},async rpc(name,args){calls++;rpcArgs=args;assert.equal(name,'efmc_publicar_diagnostica');return {data:{ok,error:ok?null:'LAS NOTAS CAMBIARON'}};}};
const source=fs.readFileSync(new URL('../supabase/functions/efm-campo/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/:number|:any|:Request/g,'');
vm.runInNewContext(source,{...org,createClient:()=>sb,console,Response,Date,Number,Deno:{env:{get:()=>''},serve:f=>handler=f}});
const call=b=>handler({method:'POST',json:async()=>({token:'FICTICIO',organizacion_id:plan.id,version:1,semestre:2,...b})});
for(actor of ['P019','P020','P030']){
 assert.equal((await call({accion:'preparar_publicacion',p_actor:'OTRO'})).status,200);assert.equal(rpcArgs.p_actor,actor);assert.equal(rpcArgs.p_publicar,false);
 assert.equal((await call({accion:'publicar_diagnostica',huella:'FICTICIA'})).status,200);assert.equal(rpcArgs.p_publicar,true);assert.equal(rpcArgs.p_huella,'FICTICIA');
}
let before=calls;actor='P018';assert.equal((await call({accion:'publicar_diagnostica'})).status,403);assert.equal(calls,before);
actor='P030';for(const c of [{es_master:true},{revocado:true},{usuario_tabla:'cursantes'},{soporte_actor_id:'P030'}]){changes=c;assert([401,403].includes((await call({accion:'publicar_diagnostica'})).status));}changes={};assert.equal(calls,before);
for(const b of [{semestre:3},{version:'1'},{organizacion_id:null}])assert.equal((await call({accion:'publicar_diagnostica',...b})).status,400);
ok=false;assert.equal((await call({accion:'publicar_diagnostica'})).status,409);
plan.publicada_en='2026-11-03T20:00:00Z';assert.equal((await call({accion:'registrar'})).status,409);assert.equal((await call({accion:'condicion'})).status,409);
console.log('Publicación servidor: tres jefes, identidad desde sesión, semestre, permisos, master/soporte/cursante, conflicto y evaluación cerrada: OK');
