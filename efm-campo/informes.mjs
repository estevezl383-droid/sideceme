import {edad} from './baremos.mjs';
import {nacimiento,gradoArma,sexoInicial} from './ui.mjs';
export const PRUEBAS={talla_peso:'TALLA / PESO',natacion:'NATACIÓN',abdominales:'ABDOMINALES',flexiones:'FLEXIONES EN SUELO',aerobica:'AERÓBICA 3.200 M'};
export const PESOS={talla_peso:29,natacion:11,abdominales:20,flexiones:20,aerobica:20};
export const redondear=n=>Math.round((n+Number.EPSILON)*100)/100;
export function ultima(registros,id,p,fecha){return registros.filter(r=>r.cursante_id===id&&r.prueba===p&&(!fecha||r.fecha===fecha)).sort((a,b)=>String(b.creado_en||'').localeCompare(String(a.creado_en||'')))[0];}
export function resumen(c,registros,fecha){
 const rows=Object.entries(PRUEBAS).map(([p,nombre])=>{const r=ultima(registros,c.id,p,fecha),n=r?.calculo?.nota;const nota=typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100?n:null;return {prueba:p,nombre,registro:r,nota,peso:PESOS[p],aporte:nota==null?null:redondear(nota*PESOS[p]/100)};});
 const completos=rows.filter(r=>r.nota!=null).length,final=completos===5?redondear(rows.reduce((s,r)=>s+r.aporte,0)):null;
 const latest=registros.filter(r=>r.cursante_id===c.id&&r.fecha===fecha).sort((a,b)=>String(b.creado_en||'').localeCompare(String(a.creado_en||'')))[0];
 return {c,fecha,rows,completos,final,nacimiento:latest?.nacimiento||c.fecha_nacimiento,sexo:latest?.sexo||sexoInicial(c,registros),barras:ultima(registros,c.id,'barras',fecha)};
}
export const tiempo=v=>{const n=Math.floor(Number(v));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
export function marca(row){const r=row.registro;if(!r)return 'PENDIENTE';if(row.prueba==='talla_peso')return `${r.calculo.peso} KG / ${r.calculo.talla} M`;return row.prueba==='aerobica'?tiempo(r.valor):String(r.valor);}
export function valoresHoja(s){const r=p=>s.rows.find(x=>x.prueba===p),v=p=>r(p).registro?.valor??'PENDIENTE',n=p=>r(p).nota??'PENDIENTE',a=p=>r(p).aporte??'PENDIENTE';return [r('talla_peso').registro?.calculo.peso??'PENDIENTE',r('talla_peso').registro?.calculo.talla??'PENDIENTE',n('talla_peso'),a('talla_peso'),v('natacion'),n('natacion'),a('natacion'),v('abdominales'),n('abdominales'),a('abdominales'),v('flexiones'),n('flexiones'),a('flexiones'),r('aerobica').registro?tiempo(v('aerobica')):'PENDIENTE',n('aerobica'),a('aerobica'),s.final??'PENDIENTE'];}
export function datosHoja(s,config){return {nombre:[gradoArma(s.c),s.c.nombre_completo].filter(Boolean).join(' '),ciclo:s.c.ciclo,curso:s.c.paralelo||'—',nacimiento:nacimiento(s.nacimiento),edad:edad(s.nacimiento,s.fecha)??'PENDIENTE',ci:s.c.ci||'PENDIENTE',sexo:s.sexo==='F'?'FEMENINO':'MASCULINO',comandante:config.comandante||'',...Object.fromEntries(valoresHoja(s).map((v,i)=>['v'+i,v])),...Object.fromEntries(Object.keys(PRUEBAS).map((p,i)=>['evaluador'+i,config[p]||'']))};}
