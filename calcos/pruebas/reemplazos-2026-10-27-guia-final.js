// Reemplazos del 2026-10-27 sobre calcos/assets/index-op3-20261026.js → index-guia-final-20261027.js.
// Sergio, con el Word de la F6·P2 «Guía de Planificación Final» del CE-I: «lo que me está generando la aplicación está
// muy mal, corregí de acuerdo al modelo». La hoja del Comandante era un cuadro «Área / Sección · Guía final impartida ·
// Plazo» y el Word salía como una lista de tareas por sección (A.- G-1 … I.- Defensa Antiaérea). El modelo del TEXTO
// PMTD 2017 tiene seis párrafos: I.- DECISIÓN, II.- INTENCIÓN DEL COMANDANTE, III.- RCIC., IV.- PRIORIDADES PARA LOS
// SISTEMAS OPERATIVOS DEL CAMPO DE BATALLA, V.- ELABORACIÓN DE LOS PLANES U ÓRDENES y VI.- ENSAYOS. La lógica está en
// estado-mayor/v7 (campos/cmte.js); acá:
//   · el motor de documentos de Estado Mayor pasa de la carpeta v6 a la v7 (los 3 imports);
//   · las hojas del Comandante pasan por fasesConDocumentos (como las del G-1, G-4, G-5 y EME): la F6·P2 se trabaja
//     con el editor de documentos (📘, 🌱, 💡, 🤖, vista previa y Word militar); las demás quedan como estaban;
//   · el avance «n de m hojas con contenido» del Comandante cuenta la F6·P2 por lo que tiene escrito;
//   · el formato militar (formato-militar/v1/runtime.js) con versión nueva: respeta el título SIN número
//     (`spec.sinNumero`), como el modelo de la Guía de Planificación Final.
//
// SHA-256 de index-op3-20261026.js (antes de estos reemplazos): 4ebbd3ab59a83a5dbb023a585a14262f2d53ea7a045bd5eb6c04dd143e70dc90
module.exports = [
  {
    nombre: 'El motor de documentos de Estado Mayor en la carpeta v7 (con la Guía de Planificación Final del Comandante)',
    viejo: '"../estado-mayor/v6/',
    nuevo: '"../estado-mayor/v7/',
    veces: 3,
  },
  {
    nombre: 'Las hojas del Comandante pasan por el motor: la F6·P2 es un documento con la forma del PMTD 2017',
    viejo: 'hse={cmte:PLe,jem:OLe}',
    nuevo: 'hse={cmte:SIDEMFases({id:"cmte"},PLe),jem:OLe}',
    veces: 1,
  },
  {
    nombre: 'El avance del Comandante cuenta la F6·P2 por lo que tiene escrito',
    viejo: 'function LLe(t,e={}){const n=jLe(t);let a=0;for(const i of n){const o=e[i.id];if(o){if(Array.isArray(o))',
    nuevo: 'function LLe(t,e={}){const n=jLe(t);let a=0;for(const i of n){const o=e[i.id];if(o){if(SIDEMEs(i)){SIDEMTiene(i,o)&&a++;continue}if(Array.isArray(o))',
    veces: 1,
  },
  {
    nombre: 'El formato militar con versión nueva (el título sin «No. 01» cuando el documento no lleva número)',
    viejo: 'formato-militar/v1/runtime.js?v=sigla20261011',
    nuevo: 'formato-militar/v1/runtime.js?v=guiafinal20261027',
    veces: 1,
  },
]
