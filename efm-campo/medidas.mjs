import {edad} from './baremos.mjs';
export const VERSION_MEDIDAS='anexo-e-11-25-v1';
export function validarMedidas(peso,talla){
 if(typeof peso!=='number'||!Number.isFinite(peso)||peso<20||peso>300||typeof talla!=='number'||!Number.isFinite(talla)||talla<1||talla>2.5)return 'REVISÁ PESO (20–300 KG) Y TALLA (1–2,50 M).';
 return '';
}
// Anexo E páginas 2–5: ideal = estatura en cm - 100.
// Varones: ±5/6/7/8/9/10 kg. Damas: ±6/7/8/9/10/11 kg.
// Última columna 45–49 (+): 45 años y mayores. Límites inclusivos.
// Criterio confirmado por Morales el 07-OCT-26: normal 100; fuera 0.
export function calificarMedidas(peso,talla,sexo,nacimiento,dia){
 const a=edad(nacimiento,dia),base={peso,talla,edad:a,nota:null,aporte:null,version:VERSION_MEDIDAS,origen:'anexo-e',criterio:'NORMAL_100_FUERA_0'},pendiente=motivo=>({...base,motivo});
 const issue=validarMedidas(peso,talla);if(issue)return pendiente(issue);
 if(a===null)return pendiente('FALTA FECHA DE NACIMIENTO VÁLIDA');
 if(a<20)return pendiente('EDAD FUERA DE TABLA');
 if(!['M','F'].includes(sexo))return pendiente('SELECCIONAR TABLA MASCULINA O FEMENINA');
 const cm=Math.round(talla*100);
 if(Math.abs(talla*100-cm)>1e-7)return pendiente('TALLA ENTRE FILAS: REGISTRAR CENTÍMETROS ENTEROS');
 if(cm<(sexo==='M'?150:141)||cm>(sexo==='M'?200:185))return pendiente('TALLA SIN FILA EN EL ANEXO E');
 const grupo=Math.min(5,Math.floor((a-20)/5)),ideal=cm-100,margen=(sexo==='M'?5:6)+grupo;
 const minimo=ideal-margen,maximo=ideal+margen,cumple=peso>=minimo&&peso<=maximo,nota=cumple?100:0;
 return {...base,nota,aporte:cumple?29:0,ideal,minimo,maximo,cumple,grupo_edad:grupo===5?'45 Y MAYORES':`${20+grupo*5}–${24+grupo*5}`,motivo:cumple?'DENTRO DEL RANGO NORMAL':peso<minimo?'POR DEBAJO DEL RANGO NORMAL':'POR ENCIMA DEL RANGO NORMAL'};
}
