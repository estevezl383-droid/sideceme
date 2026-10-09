import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calificarMedidas} from '../efm-campo/medidas.mjs';
const dia='2026-10-07',dob=a=>`${2026-a}-01-01`;
// Cada fila y las seis columnas de edad de ambas tablas.
let n=0;
for(const sex of ['M','F'])for(let cm=sex==='M'?150:141;cm<=(sex==='M'?200:185);cm++)for(let g=0;g<6;g++){
 const a=20+5*g,ideal=cm-100,margen=(sex==='M'?5:6)+g,min=ideal-margen,max=ideal+margen;
 for(const [peso,nota] of [[min,100],[max,100],[ideal,100],[min-.1,0],[max+.1,0]]){
  const r=calificarMedidas(peso,cm/100,sex,dob(a),dia);assert.equal(r.nota,nota);assert.equal(r.minimo,min);assert.equal(r.maximo,max);assert.equal(r.aporte,nota===100?29:0);n++;
 }
}
// Celdas cotejadas visualmente, cambios de edad y límites de cobertura.
for(const [sex,cm,a,min,max] of [['M',150,20,45,55],['M',170,44,61,79],['M',200,55,90,110],['F',141,20,35,47],['F',165,39,56,74],['F',166,40,56,76],['F',185,50,74,96]]){
 const r=calificarMedidas(min,cm/100,sex,dob(a),dia);assert.equal(r.minimo,min);assert.equal(r.maximo,max);assert.equal(r.nota,100);
}
assert.equal(calificarMedidas(62,1.71,'M','1986-10-08',dia).nota,0);
assert.equal(calificarMedidas(62,1.71,'M','1986-10-07',dia).nota,100);
for(const [peso,talla,sexo,nac] of [[70,1.711,'M',dob(40)],[70,1.49,'M',dob(40)],[70,1.86,'F',dob(40)],[70,1.71,'',dob(40)],[70,1.71,'M','1984-02-30'],[70,1.71,'M','2026-04-16'],[0,1.71,'M',dob(40)]])assert.equal(calificarMedidas(peso,talla,sexo,nac,dia).nota,null);
assert.equal(fs.readFileSync(new URL('../efm-campo/medidas.mjs',import.meta.url),'utf8'),fs.readFileSync(new URL('../supabase/functions/efm-campo/medidas.mjs',import.meta.url),'utf8'));
console.log(`${n} comprobaciones talla-peso, celdas fuente, cumpleaños, límites y servidor: OK`);
