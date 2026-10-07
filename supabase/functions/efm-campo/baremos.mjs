// Transcripción de Anexo D, Directiva 11/25. No extrapolar celdas vacías.
export const VERSION='anexo-d-11-25-v1';
export function edad(fecha, dia){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha||'')||!/^\d{4}-\d{2}-\d{2}$/.test(dia||''))return null;
 const f=new Date(fecha+'T12:00:00Z'),d=new Date(dia+'T12:00:00Z');
 if(!Number.isFinite(+f)||!Number.isFinite(+d)||f.toISOString().slice(0,10)!==fecha||d.toISOString().slice(0,10)!==dia||f>d)return null;
 return d.getUTCFullYear()-f.getUTCFullYear()-(dia.slice(5)<fecha.slice(5)?1:0);
}
export function calificar(prueba,valor,sexo,nacimiento,dia){
 const a=edad(nacimiento,dia),v=Number(valor), pendiente=motivo=>({nota:null,motivo,edad:a,version:VERSION});
 if(a===null)return pendiente('FALTA FECHA DE NACIMIENTO VÁLIDA');
 if(a<20)return pendiente('EDAD FUERA DE TABLA');
 if(!['M','F'].includes(sexo))return pendiente('SELECCIONAR TABLA MASCULINA O FEMENINA');
 if(!Number.isFinite(v)||v<0)return pendiente('MARCA INVÁLIDA');
 const g=Math.min(6,Math.floor((a-20)/5));
 if(prueba==='barras'){
  if(!Number.isInteger(v))return pendiente('USAR REPETICIONES ENTERAS');
  const e=a<=26?0:Math.min(6,1+Math.floor((a-27)/5));
  const requisito=(sexo==='M'?[15,13,11,9,7,5,3]:[9,8,7,6,5,4,3])[e];
  return {...pendiente('EXCELENCIA: SIN BONIFICACIÓN NUMÉRICA EN EL ANEXO'),requisito,cumple:v>=requisito};
 }
 let nota;
 if(['flexiones','abdominales'].includes(prueba)){
  if(!Number.isInteger(v))return pendiente('USAR REPETICIONES ENTERAS');
  const max=(sexo==='M'?70:55)-5*g;nota=100-(max-v);
  // Celdas finales explícitas de la tabla: no convertir blancos a notas.
  const min=sexo==='M'?[20,15,10,5,0,1,1][g]:[5,1,1,1,1,1,1][g];
  if(v<min)return pendiente('MARCA SIN CELDA EN EL ANEXO');
 }else if(prueba==='natacion'){
  const factor=a<35?1:2;nota=v*factor;
  if(!Number.isInteger(v)||nota<10)return pendiente('DISTANCIA SIN CELDA EN EL ANEXO');
 }else if(prueba==='aerobica'){
  const base=(sexo==='M'?900:930)+g*50;
  if(v>1800||v<=0)return pendiente('TIEMPO FUERA DEL ANEXO');
  if(v<base)return pendiente('TIEMPO MEJOR QUE PRIMERA CELDA: VALIDAR TOPE');
  if(v%10!==0)return pendiente('TIEMPO ENTRE FILAS: PENDIENTE CRITERIO DE REDONDEO');
  nota=100-(v-base)/10;
 }else return pendiente('PRUEBA DESCONOCIDA');
 if(nota>100)return pendiente('MARCA SUPERIOR A TABLA: VALIDAR TOPE');
 return {nota,motivo:'',edad:a,version:VERSION};
}
