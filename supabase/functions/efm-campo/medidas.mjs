const redondear=n=>Math.round((n+Number.EPSILON)*100)/100;
export function validarMedidas(peso,talla,nota){
 if(typeof peso!=='number'||!Number.isFinite(peso)||peso<20||peso>300||typeof talla!=='number'||!Number.isFinite(talla)||talla<1||talla>2.5)return 'REVISÁ PESO (20–300 KG) Y TALLA (1–2,50 M).';
 if(nota!=null&&(typeof nota!=='number'||!Number.isFinite(nota)||nota<0||nota>100))return 'LA NOTA DEBE ESTAR ENTRE 0 Y 100.';
 return '';
}
export function calificarMedidas(peso,talla,nota=null){return {peso,talla,nota,motivo:nota==null?'PENDIENTE BAREMO INSTITUCIONAL DE TALLA–PESO':'NOTA INGRESADA POR EL EVALUADOR',version:'talla-peso-registro-v1',origen:nota==null?'pendiente':'evaluador',aporte:nota==null?null:redondear(nota*.29)};}
