// Reemplazos del 2026-10-20 sobre calcos/assets/index-plantilla-ajuste-20261020.js → index-objetivos-indicados-20261020.js.
// Lo pidió Sergio con la captura de la H.T. 16: «primero le dije que me calcule los objetivos… no me
// convenció, entonces en mis sugerencias para la IA le puse que considere como el objetivo 1 al terreno
// clave 13; sin embargo le pongo Acostar y no da».
//
// Qué pasaba: «🎯 Acostar los OBJETIVOS» (Tv) llama a sK, que mide desde la plantilla y nada más. La
// indicación de la caja de la IA (hU) era un estado suelto de esa caja: no se guardaba y nadie la leía.
//
// Qué se hace (la lógica está en calcos/objetivos-indicados/v1/objetivos.mjs):
//   · la caja de la IA del tablero del G-2 guarda la indicación de cada hoja en picb._indic[hoja]
//     (se guarda con el ejercicio y vuelve al reabrir la hoja);
//   · Acostar (Tv) y el acostado previo del esquema de maniobra (iw) pasan el resultado de sK por
//     objetivosIndicados: el terreno clave que nombre la indicación de la H.T. 16 o sus celdas
//     «Objetivo intermedio» / «Objetivo final» manda sobre lo calculado;
//   · el aviso dice qué objetivo se puso en qué terreno clave, o que ese terreno clave no existe.
//
// SHA-256 de index-plantilla-ajuste-20261020.js (antes de estos reemplazos): dd55976a19d94b472e35a05fd26586cd944021bcd54e1798c6d04f39c7bb2b0d

module.exports = [
  {
    nombre: 'Import del módulo de objetivos indicados',
    viejo: 'import {entradaPlantilla as SIDEntradaPl,',
    nuevo: 'import {objetivosIndicados as SIDObjInd,avisoIndicados as SIDAvisoInd} from "../objetivos-indicados/v1/objetivos.mjs?v=objind20261020";import {entradaPlantilla as SIDEntradaPl,',
    veces: 1,
  },
  {
    nombre: 'Acostar objetivos (Tv): lo indicado por el G-2 manda',
    viejo: 'const ot=sK(Qe.p,Lt.areaOps,Jt,{coa:"probable"});',
    nuevo: 'const ot=SIDObjInd(sK(Qe.p,Lt.areaOps,Jt,{coa:"probable"}),$i,Jt,{coa:"probable"});',
    veces: 1,
  },
  {
    nombre: 'Acostar objetivos (Tv): el aviso dice qué se puso por indicación',
    viejo: 'apoyado(s) en terreno clave · profundidad del A.O. ${ot.resumen.profundidadAOkm} km. Arrastralos o borralos a mano.`',
    nuevo: 'apoyado(s) en terreno clave · profundidad del A.O. ${ot.resumen.profundidadAOkm} km. Arrastralos o borralos a mano.`+SIDAvisoInd(ot)',
    veces: 1,
  },
  {
    nombre: 'Acostar objetivos (Tv): depende de la PICB',
    viejo: ':""))},[uu,Lt.areaOps,Jt,la,ll,Nl,za]),iw=',
    nuevo: ':""))},[uu,Lt.areaOps,Jt,la,ll,Nl,za,$i]),iw=',
    veces: 1,
  },
  {
    nombre: 'Esquema de maniobra (iw): los objetivos que acuesta antes también siguen lo indicado',
    viejo: 'const Ht=sK(ct.p,Lt.areaOps,Jt,{coa:"probable"});',
    nuevo: 'const Ht=SIDObjInd(sK(ct.p,Lt.areaOps,Jt,{coa:"probable"}),$i,Jt,{coa:"probable"});',
    veces: 1,
  },
  {
    nombre: 'Esquema de maniobra (iw): depende de la PICB',
    viejo: '[uu,Lt.objetivos,Lt.areaOps,Jt,la,ll,Nl,za]),LP=',
    nuevo: '[uu,Lt.objetivos,Lt.areaOps,Jt,la,ll,Nl,za,$i]),LP=',
    veces: 1,
  },
  {
    nombre: 'Caja de la IA (hU): recibe y avisa la indicación guardada',
    viejo: 'function hU({titulo:t="🤖 Pedirle a la IA",nota:e="",modos:n=null,onPedido:a,onAplicar:i,color:o="#c69cff",abiertoPorDefecto:s=!1}){',
    nuevo: 'function hU({titulo:t="🤖 Pedirle a la IA",nota:e="",modos:n=null,onPedido:a,onAplicar:i,color:o="#c69cff",abiertoPorDefecto:s=!1,SIDindicacion:SIDind0="",SIDonIndicacion:SIDonInd=null}){',
    veces: 1,
  },
  {
    nombre: 'Caja de la IA (hU): la indicación arranca con la guardada y se guarda al escribir',
    viejo: '[H,q]=je.useState(""),[SIDT,SIDTset]',
    nuevo: '[H,SIDqInd]=je.useState(SIDind0||""),q=SIDv=>{SIDqInd(SIDv),SIDonInd?.(SIDv)},[SIDT,SIDTset]',
    veces: 1,
  },
  {
    nombre: 'Tablero del G-2: la caja de la IA guarda la indicación de cada hoja en picb._indic',
    viejo: 'onPedido:ne,onAplicar:Ke})',
    nuevo: 'onPedido:ne,onAplicar:Ke,SIDindicacion:(t._indic||{})[nt.id]||"",SIDonIndicacion:SIDv=>it("_indic",{...t._indic||{},[nt.id]:SIDv})},`ia-${nt.id}`)',
    veces: 1,
  },
  {
    nombre: 'H.T. 16: la ayuda de Acostar dice que se puede indicar el terreno clave',
    viejo: 'y el OBJETIVO FINAL en profundidad, sobre el eje del esfuerzo principal. Después se arrastran o se borran a mano."',
    nuevo: 'y el OBJETIVO FINAL en profundidad, sobre el eje del esfuerzo principal. Después se arrastran o se borran a mano. 📌 Si en «Tu indicación para esta hoja» (la caja de la IA) o en la hoja nombrás un terreno clave —«C13 es el objetivo 1 (final)», «Oa en C4»—, ese objetivo va ahí."',
    veces: 1,
  },
]
