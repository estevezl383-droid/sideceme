import {edad} from './baremos.mjs';
import {nacimiento,gradoArma,sexoInicial,fechaEvaluacion} from './ui.mjs?v=10';
export const PRUEBAS={talla_peso:'TALLA / PESO',natacion:'NATACIÓN',abdominales:'ABDOMINALES',flexiones:'FLEXIONES EN SUELO',aerobica:'AERÓBICA 3.200 M'};
export const PESOS={talla_peso:29,natacion:11,abdominales:20,flexiones:20,aerobica:20};
export const redondear=n=>Math.round((n+Number.EPSILON)*100)/100;
export function ultima(registros,id,p,fecha){return registros.filter(r=>r.cursante_id===id&&r.prueba===p&&(!fecha||r.fecha===fecha)).sort((a,b)=>String(b.creado_en||'').localeCompare(String(a.creado_en||'')))[0];}
export function resumen(c,registros,fecha){
 const rows=Object.entries(PRUEBAS).map(([p,nombre])=>{const r=ultima(registros,c.id,p,fecha),n=r?.calculo?.nota;const nota=typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100?n:null;return {prueba:p,nombre,registro:r,nota,peso:PESOS[p],aporte:nota==null?null:redondear(nota*PESOS[p]/100)};});
 const completos=rows.filter(r=>r.nota!=null).length,final=completos===5?redondear(rows.reduce((s,r)=>s+r.aporte,0)):null;
 const latest=registros.filter(r=>r.cursante_id===c.id&&r.fecha===fecha).sort((a,b)=>String(b.creado_en||'').localeCompare(String(a.creado_en||'')))[0];
 return {c,fecha,rows,completos,final,nacimiento:c.fecha_nacimiento||latest?.nacimiento,sexo:sexoInicial(c,registros),barras:ultima(registros,c.id,'barras',fecha)};
}
export const tiempo=v=>{const n=Math.floor(Number(v));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
export function marca(row){const r=row.registro;if(!r)return 'PENDIENTE';if(r.calculo?.estado==='NO_REALIZO')return 'NO REALIZÓ';if(row.prueba==='talla_peso')return `${r.calculo.peso} KG / ${r.calculo.talla} M`;return row.prueba==='aerobica'?tiempo(r.valor):String(r.valor);}
export function valoresHoja(s){const r=p=>s.rows.find(x=>x.prueba===p),ausente=p=>r(p).registro?.calculo?.estado==='NO_REALIZO',v=p=>ausente(p)?'N/R':r(p).registro?.valor??'S/R',n=p=>ausente(p)?'N/R':r(p).nota??'S/R',a=p=>ausente(p)?'N/R':r(p).aporte??'S/R';return [ausente('talla_peso')?'N/R':r('talla_peso').registro?.calculo.peso??'S/R',ausente('talla_peso')?'N/R':r('talla_peso').registro?.calculo.talla??'S/R',n('talla_peso'),a('talla_peso'),v('natacion'),n('natacion'),a('natacion'),v('abdominales'),n('abdominales'),a('abdominales'),v('flexiones'),n('flexiones'),a('flexiones'),ausente('aerobica')?'N/R':r('aerobica').registro?tiempo(v('aerobica')):'S/R',n('aerobica'),a('aerobica'),s.final??'PENDIENTE'];}
export function evaluador(s,p){const r=s.rows.find(x=>x.prueba===p)?.registro;return r?.calculo?.evaluador_nombre||r?.evaluador_nombre||'';}
export function datosHoja(s,config){return {estado:`FECHA DE EVALUACIÓN: ${fechaEvaluacion(s.fecha)} · REGISTROS DE PRUEBA · ${s.completos}/5 NOTAS CARGADAS.`,nombre:[gradoArma(s.c),s.c.nombre_completo].filter(Boolean).join(' '),ciclo:s.c.ciclo,curso:s.c.paralelo||'—',nacimiento:fechaEvaluacion(s.nacimiento),edad:edad(s.nacimiento,s.fecha)??'PENDIENTE',ci:s.c.ci||'PENDIENTE',sexo:s.sexo==='F'?'FEMENINO':'MASCULINO',comandante:config.comandante||'Cnl. DAEN. José Jhonny Pardo Pardo',...Object.fromEntries(valoresHoja(s).map((v,i)=>['v'+i,v])),...Object.fromEntries(Object.keys(PRUEBAS).map((p,i)=>['evaluador'+i,evaluador(s,p)]))};}
