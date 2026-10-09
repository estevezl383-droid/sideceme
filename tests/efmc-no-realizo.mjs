import * as organizacion from '../efm-campo/organizacion.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validarNacimiento} from '../efm-campo/perfil.mjs';
import {calificar,edad} from '../efm-campo/baremos.mjs';
import {calificarMedidas,validarMedidas} from '../efm-campo/medidas.mjs';
import {resumen,datosHoja,valoresHoja,marca} from '../efm-campo/informes.mjs';
let handler,stored=null,attempt=null;
const owner={usuario_id:'P030',usuario_ci:'4889191',usuario_tabla:'profesores',revocado:false,es_master:false,expira_en:new Date(Date.now()+3600000).toISOString(),soporte_actor_id:null,soporte_actor_ci:null};
const actor={activo:true,grado:'TCNL. DEM.',especialidad:'DEM.',nombre_completo:'EVALUADOR AUTENTICADO'};
const sb={from(table){return {select(){return this;},eq(){return this;},insert(row){attempt=row;return this;},maybeSingle(){return Promise.resolve({data:table==='sesiones'?owner:{id:'TEST'}});},single(){if(table==='profesores')return Promise.resolve({data:actor});if(attempt){const row=attempt;attempt=null;if(stored)return Promise.resolve({error:{code:'23505'}});stored=row;return Promise.resolve({data:row});}return Promise.resolve({data:stored});}};}};
const source=fs.readFileSync(new URL('../supabase/functions/efm-campo/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/:number|:any|:Request/g,'');
vm.runInNewContext(source,{...organizacion,createClient:()=>sb,validarNacimiento,calificar,edad,calificarMedidas,validarMedidas,console,Response,Date,Number,Deno:{env:{get:()=>''},serve:fn=>handler=fn}});
const body={token:'test',accion:'registrar',id:'11111111-1111-1111-1111-111111111111',cursante_id:'TEST',prueba:'talla_peso',fecha:'2026-10-07',valor:0,sexo:'M',nacimiento:'1986-01-01',no_realizo:true,evaluador_nombre:'NOMBRE FALSIFICADO',nota:100};
const call=b=>handler({method:'POST',json:async()=>b});
for(const prueba of ['talla_peso','natacion','flexiones','abdominales','aerobica','barras']){
 stored=null;const b={...body,prueba};let response=await call(b);assert.equal(response.status,200);let data=await response.json();assert.equal(data.registro.calculo.nota,null);assert.equal(data.registro.calculo.estado,'NO_REALIZO');assert.equal(data.registro.calculo.evaluador_nombre,'TCNL. DEM. EVALUADOR AUTENTICADO');assert.equal((await call(b)).status,200);assert.equal((await call({...b,no_realizo:false,talla:1.71,valor:70})).status,409);
}
assert.equal((await call({...body,no_realizo:'true'})).status,400);assert.equal((await call({...body,valor:10})).status,400);
const c={id:'TEST',nombre_completo:'CURSANTE FICTICIO',fecha_nacimiento:body.nacimiento};const r={...body,calculo:{estado:'NO_REALIZO',nota:null,evaluador_nombre:'TCNL. DEM. EVALUADOR AUTENTICADO'}};const s=resumen(c,[r],body.fecha);assert.equal(s.final,null);assert.equal(s.completos,0);assert.equal(valoresHoja(s)[0],'N/R');assert.equal(marca(s.rows[0]),'NO REALIZÓ');const d=datosHoja(s,{talla_peso:'MANUAL INCORRECTO'});assert.equal(d.evaluador0,r.calculo.evaluador_nombre);assert.equal(d.evaluador1,'');assert(d.estado.includes('07-OCT-2026'));console.log('No realizó: seis pruebas, reintentos, conflictos, identidad autenticada y exportación: OK');
