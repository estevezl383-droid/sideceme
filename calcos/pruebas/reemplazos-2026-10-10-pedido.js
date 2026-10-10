// Reemplazos del 2026-10-10 sobre calcos/assets/index-fichas-20261009.js →
// index-pedido-20261010.js. Lo pidió Sergio con capturas de la F1·P3 Apreciación Activa del
// Comandante: «Pedido copiado (456.419 caracteres)» y la IA contestaba «La información se cortó…
// ¿Cuál es el producto que requiere?» o un documento en prosa; y los Word de la F1·P3 y de la
// F1·P5 Guía Inicial salieron con «[IA — verificar]» en cada párrafo y con las horas repetidas.
//
//   · el motor pasa a calcos/estado-mayor/v6 (pedido.js: la tarea, el JSON y la indicación AL
//     PRINCIPIO del pedido y el expediente recortado al tamaño elegido);
//   · el panel «🤖 Trabajar esta hoja con IA» (hU) suma el selector «Tamaño: Corto / Normal /
//     Completo», dice cuando el expediente fue recortado, y la indicación «va al principio y al
//     final»;
//   · el EXPEDIENTE suma las hojas del COMANDANTE y del JEM (antes no entraban: la IA de
//     ninguna sección veía la apreciación, la guía ni la intención del Comandante);
//   · el Word del documento (Mx: el militar y el de la hoja con membrete) sale sin «[IA — verificar]»;
//   · la Guía Inicial (y la Línea de Tiempo) sin la hora repetida «D-15 (2300) — D-15 (2300)»
//     cuando el ejercicio no tiene calendario.
module.exports = [
  {
    nombre: 'Motor de documentos: estado-mayor/v5 → v6',
    viejo: '"../estado-mayor/v5/',
    nuevo: '"../estado-mayor/v6/',
    veces: 3,
  },
  {
    nombre: 'Motor: los ganchos nuevos del pedido (tamaño, aviso) y del Word sin la marca de la IA',
    viejo: 'errorRespuesta as SIDEMError,wordPRC as SIDEMWordPRC} from',
    nuevo: 'errorRespuesta as SIDEMError,wordPRC as SIDEMWordPRC,tamanosPedido as SIDEMTamanos,tamanoDelPedido as SIDEMTamano,elegirTamanoPedido as SIDEMElegirTamano,avisoDelPedido as SIDEMAviso,sinMarcaWord as SIDEMSinMarca} from',
    veces: 1,
  },
  {
    // (las dos ramas: la F1·P3 del Comandante no tiene modelo militar registrado y sale por
    // SIDHojaWord, con membrete igual)
    nombre: 'Word del documento (Mx): sin «[IA — verificar]»',
    viejo: 'async function Mx(t,e,n={}){return SIDEsMilitar(n.registro)?SIDMilWord(t,e,n):SIDHojaWord(t,e)}',
    nuevo: 'async function Mx(t,e,n={}){t=SIDEMSinMarca(t);return SIDEsMilitar(n.registro)?SIDMilWord(t,e,n):SIDHojaWord(t,e)}',
    veces: 1,
  },
  {
    nombre: 'Guía Inicial / Línea de Tiempo: la hora no se repite cuando no hay calendario',
    viejo: 'n=(a,i,o)=>({texto:`${a} : ${o} — ${i}`})',
    nuevo: 'n=(a,i,o)=>({texto:i&&i!==o?`${a} : ${o} — ${i}`:`${a} : ${o}`})',
    veces: 1,
  },
  {
    nombre: 'Guía Inicial: «hasta el D-10 (1700) (D-10 (1700))» → una sola vez',
    viejo: 'hasta el ${e.limitePlaneamientoTxt} (${e.limitePlaneamientoD})`}',
    nuevo: 'hasta el ${e.limitePlaneamientoTxt}${e.limitePlaneamientoD&&e.limitePlaneamientoD!==e.limitePlaneamientoTxt?` (${e.limitePlaneamientoD})`:""}`}',
    veces: 1,
  },
  {
    nombre: 'Expediente: suma las hojas del Comandante y del JEM',
    viejo: 'function w6e(t={}){const e=[];for(const[n,a]of Object.entries(Nx)){',
    nuevo: 'function w6e(t={}){const e=[];for(const[n,a]of Object.entries(hse)){const SIDn=(EU[n]||{}).nom||n,i=l9(t?.[n],a,`las hojas del ${SIDn}`);i&&!i.startsWith("Ninguna hoja")&&e.push(`### ${SIDn}\n\n${i}`)}for(const[n,a]of Object.entries(Nx)){',
    veces: 1,
  },
  {
    nombre: 'Expediente: el título del apartado 11 bis',
    viejo: 'Td("11 bis · HOJAS DE TRABAJO DEL G-1, G-4 Y G-5",w6e(t.hojasG))',
    nuevo: 'Td("11 bis · HOJAS DE TRABAJO DEL COMANDANTE, DEL JEM, DEL G-1, DEL G-4, DEL G-5 Y DEL EME",w6e(t.hojasG))',
    veces: 1,
  },
  {
    nombre: 'Expediente: el aviso cuando nadie llenó hojas',
    viejo: 'El G-1, el G-4 y el G-5 todavía no llenaron ninguna de sus hojas de trabajo.',
    nuevo: 'El Comandante, el JEM, el G-1, el G-4, el G-5 y el EME todavía no llenaron ninguna de sus hojas de trabajo.',
    veces: 1,
  },
  {
    nombre: 'Panel de la IA: el estado del tamaño del pedido',
    viejo: '[H,q]=je.useState(""),K=',
    nuevo: '[H,q]=je.useState(""),[SIDT,SIDTset]=je.useState(SIDEMTamano),K=',
    veces: 1,
  },
  {
    nombre: 'Panel de la IA: la indicación va al principio y al final',
    viejo: 'children:"Va al FINAL del pedido, que es donde más pesa: la IA lo lee último, justo antes de contestar."',
    nuevo: 'children:"Va AL PRINCIPIO y AL FINAL del pedido: la IA la lee antes que nada y otra vez justo antes de contestar."',
    veces: 1,
  },
  {
    nombre: 'Panel de la IA: el selector «Tamaño: Corto / Normal / Completo»',
    viejo: 'f.jsx("div",{style:Ir.paso,children:"2 · Copiá el pedido"}),',
    nuevo: 'f.jsx("div",{style:Ir.paso,children:"2 · Copiá el pedido"}),f.jsxs("div",{style:Ir.modos,children:[f.jsx("span",{style:{fontSize:10,color:"#7f8ea6",alignSelf:"center",whiteSpace:"nowrap"},children:"Tamaño:"}),...SIDEMTamanos().map(pe=>f.jsx("button",{style:{...Ir.modo,...pe.id===SIDT?{...Ir.modoOn,borderColor:o}:null},title:pe.ayuda,onClick:()=>SIDTset(SIDEMElegirTamano(pe.id)),children:pe.nom},pe.id))]}),f.jsx("div",{style:Ir.ayuda,children:"Tamaño del pedido: "+((SIDEMTamanos().find(pe=>pe.id===SIDT)||{}).ayuda||"")+"."}),',
    veces: 1,
  },
  {
    nombre: 'Panel de la IA: «Pedido copiado» dice si el expediente fue recortado',
    viejo: 'Pegalo en la IA y traé su respuesta a la caja de abajo.`',
    nuevo: 'Pegalo en la IA y traé su respuesta a la caja de abajo.${SIDEMAviso()}`',
    veces: 1,
  },
  {
    nombre: 'Panel de la IA: el pedido descargado se adjunta CON la orden de cumplirlo',
    viejo: 'Pedido descargado. Adjuntalo en la IA que uses.',
    nuevo: 'Pedido descargado. Adjuntalo en la IA y escribí en el mismo mensaje: «Cumplí el pedido del archivo: contestá SÓLO con el bloque JSON».',
    veces: 1,
  },
  {
    nombre: 'Panel de la IA: con qué empieza el pedido',
    viejo: 'children:"«Sos OFICIAL DE ESTADO MAYOR…»"}),". Si ves código o cualquier otra cosa, el portapapeles tenía algo distinto: copiá desde acá."',
    nuevo: 'children:"«# PEDIDO DE TRABAJO PARA LA IA…»"}),", «CONTEXTO — ESTO ES UN EJERCICIO ACADÉMICO» o «Sos OFICIAL DE ESTADO MAYOR…». Si ves código o cualquier otra cosa, el portapapeles tenía algo distinto: copiá desde acá."',
    veces: 1,
  },
]
