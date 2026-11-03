import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calificar,VERSION} from '../efm-campo/baremos.mjs';
import {resumen} from '../efm-campo/informes.mjs';
const fecha='2026-11-03';
assert.equal(fs.readFileSync(new URL('../efm-campo/baremos.mjs',import.meta.url),'utf8'),fs.readFileSync(new URL('../supabase/functions/efm-campo/baremos.mjs',import.meta.url),'utf8'));
assert.equal(VERSION,'anexo-d-11-25-v2');
for(const sexo of ['M','F'])for(let g=0;g<7;g++){
 const nacimiento=`${2026-(20+5*g)}-01-01`,max=(sexo==='M'?70:55)-g*5,base=(sexo==='M'?900:930)+g*50;
 for(const p of ['abdominales','flexiones']){
  for(const [v,n] of [[max-1,99],[max,100],[max+1,100],[max+50,100]])assert.equal(calificar(p,v,sexo,nacimiento,fecha).nota,n);
  assert.equal(calificar(p,max+0.5,sexo,nacimiento,fecha).nota,null);
 }
 for(const [v,n] of [[base-10,100],[base-1,100],[base,100],[base+0.01,99],[base+1,99],[base+9,99],[base+10,99],[base+10.01,98],[base+25,97],[1800,100-(1800-base)/10]])assert.equal(calificar('aerobica',v,sexo,nacimiento,fecha).nota,n);
 for(const v of [0,-1,1800.01,Infinity,NaN])assert.equal(calificar('aerobica',v,sexo,nacimiento,fecha).nota,null);
 assert.equal(calificar('natacion',500,sexo,nacimiento,fecha).nota,100);
}
// Casos de los PDF: conservar marca exacta y redondear sólo la fila de calificación.
const cases=[['1980-01-01','M',60,50,927,100],['1984-01-01','M',55,55,1078,100],['1984-01-01','M',50,50,1105,99],['1987-01-01','F',42,40,997,100],['1987-01-01','F',22,19,1283,79]];
const finals=[];
for(const [nacimiento,sexo,abd,flex,aero,aeroNota] of cases){
 const c={id:'FICTICIO',fecha_nacimiento:nacimiento,sexo};
 const records=Object.entries({abdominales:abd,flexiones:flex,aerobica:aero,natacion:50}).map(([prueba,valor])=>({id:prueba,cursante_id:c.id,prueba,fecha,valor,calculo:calificar(prueba,valor,sexo,nacimiento,fecha)}));
 assert.equal(records.find(r=>r.prueba==='aerobica').calculo.nota,aeroNota);
 assert.equal(records.find(r=>r.prueba==='aerobica').valor,aero);
 records.push({id:'peso',cursante_id:c.id,fecha,prueba:'talla_peso',calculo:{nota:100}});
 assert.equal(resumen(c,records,fecha).completos,5);
 finals.push(resumen(c,records,fecha).final);
}
assert.deepEqual(finals,[100,100,99.8,100,88]);
console.log('Criterios v2: siete grupos, ambos sexos, topes, segundos y fracciones, fronteras, paridad servidor y cinco casos PDF: OK');
