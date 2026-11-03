import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calificarExcelencia,esExcelencia} from '../efm-campo/baremos.mjs';
import {resumen,valoresHoja,datosHoja} from '../efm-campo/informes.mjs';
import {snapshotHoja} from '../supabase/functions/efm-campo/hoja-modelo.mjs';
import {validarPlan,asignaciones} from '../efm-campo/organizacion.mjs';
assert.equal(fs.readFileSync('efm-campo/baremos.mjs','utf8'),fs.readFileSync('supabase/functions/efm-campo/baremos.mjs','utf8'));
const fecha='2026-11-03';let checked=0;
for(const sexo of ['M','F'])for(const age of [35,39,40,44,45,49,50,61])for(const prueba of ['natacion','barras','abdominales','flexiones','aerobica']){
 const birth=`${2026-age}-11-03`,a=calificarExcelencia(prueba,1,sexo,birth,fecha);
 if(a.requisito==null){assert.equal(a.nota,null);continue;}
 const timed=['natacion','aerobica'].includes(prueba);
 assert.equal(calificarExcelencia(prueba,a.requisito,sexo,birth,fecha).cumple,true);
 assert.equal(calificarExcelencia(prueba,a.requisito+(timed?.01:-1),sexo,birth,fecha).cumple,false);checked++;
}
assert.equal(calificarExcelencia('natacion',100,'M','1995-11-03',fecha).nota,null);
assert(esExcelencia({color:'NEGRO'}));assert(esExcelencia({color:'AZUL',modalidad:'EXCELENCIA'}));assert(!esExcelencia({color:'AZUL'}));
const c={id:'TEST',nombre_completo:'ALUMNO FICTICIO',ciclo:'1ER CICLO',fecha_nacimiento:'1981-01-01',organizacion:{grupo:'NEGRO',modalidad:'EXCELENCIA'}},p={id:'PLAN',fecha,ciclo:c.ciclo,grupos:[{id:'G',color:'NEGRO',alumnos:[c.id]}]};
const records=['natacion','barras','abdominales','flexiones','aerobica','talla_peso'].map((prueba,i)=>({id:'R'+i,organizacion_id:p.id,cursante_id:c.id,fecha,prueba,valor:prueba==='natacion'?200.15:10,calculo:{modalidad:'EXCELENCIA',nota:100,peso:70,talla:1.7,evaluador_nombre:'PROFESOR '+prueba}}));
const s=resumen(c,records,fecha);assert.equal(s.rows.length,5);assert(!s.rows.some(r=>r.prueba==='talla_peso'));assert.equal(s.final,100);assert(s.rows.every(r=>r.peso===20));assert.equal(valoresHoja(s).length,16);assert.equal(valoresHoja(s)[0],'03:20.15');assert.equal(datosHoja(s,{comandante:'Cnl. ANTIGUO'}).comandante,'Gral. Brig. José Jhonny Pardo Pardo');
const snap=snapshotHoja(c,{fecha_nacimiento:c.fecha_nacimiento,sexo:'M'},p,records);assert(snap.excelencia);assert.equal(snap.rows[1].prueba,'barras');assert.equal(snap.final,100);assert(!snap.rows.some(r=>r.prueba==='talla_peso'));
const before=JSON.stringify(records);resumen(c,records,fecha);assert.equal(JSON.stringify(records),before);
const row=s.rows[1];row.registro.calculo={estado:'NO_CUMPLIO',cumple:false,nota:null};assert.equal(valoresHoja(s)[3],'NO CUMPLIÓ');
for(const model of ['modelo-hoja','modelo-excelencia']){const xml=JSON.parse(fs.readFileSync('efm-campo/'+model+'.json'))['word/document.xml'];assert(xml.includes('{{comandante}}'));for(let i=0;i<5;i++)assert(xml.includes('{{evaluador'+i+'}}'));assert(!xml.includes('Cnl.'));}
console.log(`Excelencia: ${checked} fronteras de edad/sexo/prueba, modalidad, ponderaciones, exclusión de talla/peso, precisión, no cumplió y modelos: OK`);
