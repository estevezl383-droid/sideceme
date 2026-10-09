const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const source = stripTypeScriptTypes(fs.readFileSync('supabase/functions/registros-ops/index.ts','utf8').replace(/^import .*;$/m,''));
function setup(options={}) {
  const inserts=[],updates=[];
  const sb={ from(table) {
    const q={select(){return q;},eq(){return q;},neq(){return q;},maybeSingle(){return q;},single(){return q;},insert(row){inserts.push({table,row});return q;},update(row){updates.push({table,row});return q;},then(resolve,reject){
      let data=table==='sesiones'?{usuario_id:'P030',usuario_tabla:'profesores',revocado:false,expira_en:new Date(Date.now()+3600000).toISOString(),...options.session}:
        table==='profesores'?{nombre_completo:'SERGIO',activo:true,rol:'ciencia_tecnologia',roles:[],es_auxiliar:false,solo_lectura:false,...options.actor}:{id:1,activo:true};
      if(table==='sesiones' && options.noSession) data=null;
      return Promise.resolve({data,error:options.dbError?{message:'failure'}:null}).then(resolve,reject);
    }}; return q;
  }};
  let handler;
  vm.runInNewContext(source,{createClient:()=>sb,Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},Request,Response,Date,console,atob});
  const registro={titulo:'DOCUMENTO DE PRUEBA',archivo_nombre:'prueba.pdf',archivo_dataurl:'data:application/pdf;base64,'+Buffer.from('%PDF-1.7\nPRUEBA').toString('base64'),audiencia:'todos',ciclo:'1er_ciclo',fecha_corte:'2026-09-29',semana_inicio:'2026-09-28',semana_fin:'2026-10-02',subido_por:'OTRO',subido_por_nombre:'FALSO',activo:false,...options.registro};
  return {inserts,updates,async run(){const r=await handler(new Request('https://test.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:options.accion||'horario_subir',token:options.token===undefined?'test-token':options.token,registro,id:1})}));return {status:r.status,data:await r.json()};}};
}
for(const accion of ['horario_subir','planilla_subir']) test(accion+' autorizado y autor real',async()=>{const c=setup({accion});assert.equal((await c.run()).status,200);assert.equal(c.inserts[0].row.subido_por,'P030');assert.equal(c.inserts[0].row.subido_por_nombre,'SERGIO');assert.equal(c.inserts[0].row.activo,true);assert.equal(c.inserts[0].table,accion==='horario_subir'?'horarios_semanales':'planillas_disciplina');});
for(const [name,options,status] of [
 ['sin token',{token:null},401],['sesión inexistente',{noSession:true},401],['alumno',{session:{usuario_tabla:'cursantes'}},403],['profesor común',{actor:{rol:'profesor'}},403],['sesión vencida',{session:{expira_en:'2000-01-01'}},401],['caducidad inválida',{session:{expira_en:'bad'}},401],['revocado',{session:{revocado:true}},401],['solo consulta',{actor:{solo_lectura:true}},403],['cuenta inactiva',{actor:{activo:false}},403],['auxiliar C&T no sube planillas',{accion:'planilla_subir',actor:{es_auxiliar:true}},403],['Estudios no sube planillas',{accion:'planilla_subir',actor:{rol:'jefe_estudios'}},403],['HTML rechazado',{registro:{archivo_dataurl:'data:text/html;base64,PGgxPng8L2gxPg=='}},400],['ciclo inválido',{accion:'planilla_subir',registro:{ciclo:'otro'}},400],['fecha inválida',{registro:{semana_inicio:'2026-02-30'}},400]
]) test(name,async()=>{const c=setup(options);assert.equal((await c.run()).status,status);assert.equal(c.inserts.length,0);});
test('Estudios mantiene permiso para horarios',async()=>{const c=setup({actor:{rol:'jefe_estudios'}});assert.equal((await c.run()).status,200);});
test('planilla acepta PNG existente',async()=>{const c=setup({accion:'planilla_subir',registro:{archivo_nombre:'prueba.png',archivo_dataurl:'data:image/png;base64,aW1hZ2Vu'}});assert.equal((await c.run()).status,200);});
for(const accion of ['horario_eliminar','planilla_eliminar']) test(accion+' existente funciona',async()=>{const c=setup({accion});assert.equal((await c.run()).status,200);assert.equal(c.updates[0].row.activo,false);});
