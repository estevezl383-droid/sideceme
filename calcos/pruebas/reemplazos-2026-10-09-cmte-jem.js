// Reemplazos hechos el 2026-10-09 sobre el compilado de la Mesa del EM
// (calcos/assets/index-areas-20261009.js → index-cmte-jem-20261009.js).
// Lo pidió Sergio con capturas de los paneles del Comandante y del Jefe de Estado Mayor: las hojas
// no llenaban nada, la F2·P1 y la F7·P2 «se bajaban hechas», la Guía Inicial del Comandante era
// una tabla inventada (el G-3 ya tiene la de siete partes del PMTD) y lo que hacía el Estado Mayor
// no llegaba al Comandante ni al revés. Todo lo nuevo está en calcos/estado-mayor/v6
// (campos/cmte.js, campos/jem.js, campos/mando.js). Menos texto: lo que explicaba qué son las hojas
// y qué hace la IA queda apagado con `!1&&` (no se borra: se deshace byte por byte).
//
// Ninguna inserción cae dentro de lo que insertaron las listas anteriores (salvo los `import` del motor).
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer «veces»
// veces) y se cambió por «nuevo». construir-cmte-jem.js arma el compilado y comprueba que
// deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: "Comandante y JEM · el motor de documentos pasa a calcos/estado-mayor/v6 (editor, runtime y registro)",
    viejo:
      "\"../estado-mayor/v5/editor.js\"",
    nuevo:
      "\"../estado-mayor/v6/editor.js\"",
    veces: 1,
  },
  {
    nombre: "(runtime)",
    viejo:
      "\"../estado-mayor/v5/runtime.js\"",
    nuevo:
      "\"../estado-mayor/v6/runtime.js\"",
    veces: 1,
  },
  {
    nombre: "(registro)",
    viejo:
      "\"../estado-mayor/v5/registro.js\"",
    nuevo:
      "\"../estado-mayor/v6/registro.js\"",
    veces: 1,
  },
  {
    nombre: "Comandante · F1·P6 Guía Inicial: es la del tablero del G-3 (siete partes del PMTD, los mismos datos)",
    viejo:
      "{id:\"guiaInicial\",num:\"F1·P6\",nom:\"Guía Inicial del Comandante\",tipo:\"filas\",entrega:\"SE DIFUNDE SÓLO AL ESTADO MAYOR\",cols:[\"Área / Sección\",\"Guía impartida\",\"Para cuándo\"],nota:\"Sale ANTES del análisis de la misión, con lo poco que se sabe: qué quiere que se analice, con qué prioridad y en qué tiempo. Es lo que habilita la Orden Preparatoria N° 1 del G-3.\"}",
    nuevo:
      "{...ev.flatMap(SIDf=>SIDf.hojas).find(SIDh=>SIDh.id===\"guiaInicial\"),num:\"F1·P6\",compartida:\"g3\"}",
    veces: 1,
  },
  {
    nombre: "Comandante · F2·P1 Conceptos entrelazados: la misma hoja del tablero del G-3 (antes «se baja hecha»)",
    viejo:
      "{id:\"conceptos\",num:\"F2·P1\",nom:\"Hoja de trabajo de los Conceptos Entrelazados\",tipo:\"remite\",entrega:\"NO SE DIFUNDE\",nota:\"El cuadro la pone en la columna del Comandante pero la responsabilidad es de todo el Estado Mayor. La hoja ya está en el tablero del G-3 (F2·P1): se llena una sola vez, ahí.\"}",
    nuevo:
      "{...ev.flatMap(SIDf=>SIDf.hojas).find(SIDh=>SIDh.id===\"entrelazados\"),num:\"F2·P1\",nom:\"Hoja de trabajo de los Conceptos Entrelazados\",compartida:\"g3\"}",
    veces: 1,
  },
  {
    nombre: "Comandante · F7·P2 Revisión y aprobación de las órdenes: un cuadro de control (orden, responsable, estado, revisión) en vez de «se baja hecha»",
    viejo:
      "{id:\"aprobacionOgo\",num:\"F7·P2\",nom:\"Revisión y aprobación de las órdenes\",tipo:\"remite\",entrega:\"SE DIFUNDE con la Orden\",nota:\"El cuadro dice expresamente que acá NO HAY DOCUMENTO: es el acto de revisar y firmar antes de diseminar. Queda anotado para que el paso no desaparezca del proceso.\"}",
    nuevo:
      "{id:\"aprobacionOgo\",num:\"F7·P2\",nom:\"Revisión y aprobación de las órdenes\",tipo:\"filas\",entrega:\"SE DIFUNDE con la Orden\",cols:[\"Orden o anexo\",\"Responsable\",\"Estado\",\"Revisión del Cmte.\"],nota:\"Revisión y aprobación de las órdenes antes de diseminarlas: un renglón por orden o anexo.\"}",
    veces: 1,
  },
  {
    nombre: "Menos texto · el panel de hojas ya no explica qué son las hojas",
    viejo:
      "f.jsxs(\"div\",{style:Wr.ayuda,children:[\"Éstas son las hojas de trabajo que \",f.jsx(\"b\",{children:x.nom}),\" tiene que presentar a lo largo del PMTD. Cada una lleva su propio botón de IA, que trabaja con todo lo que hay en la mesa.\"]}),",
    nuevo:
      "!1&&f.jsxs(\"div\",{style:Wr.ayuda,children:[\"Éstas son las hojas de trabajo que \",f.jsx(\"b\",{children:x.nom}),\" tiene que presentar a lo largo del PMTD. Cada una lleva su propio botón de IA, que trabaja con todo lo que hay en la mesa.\"]}),",
    veces: 1,
  },
  {
    nombre: "Menos texto · sin la nota de cada hoja en el tablero del G-3",
    viejo:
      "Ke.nota&&f.jsx(\"div\",{style:At.nota,children:Ke.nota}),",
    nuevo:
      "!1&&Ke.nota&&f.jsx(\"div\",{style:At.nota,children:Ke.nota}),",
    veces: 1,
  },
  {
    nombre: "Menos texto · sin la nota de cada hoja en el tablero del G-2",
    viejo:
      "nt.nota&&f.jsx(\"div\",{style:qt.nota,children:nt.nota}),",
    nuevo:
      "!1&&nt.nota&&f.jsx(\"div\",{style:qt.nota,children:nt.nota}),",
    veces: 1,
  },
  {
    nombre: "Menos texto · sin la leyenda «Este documento reúne los datos vigentes»",
    viejo:
      "\"Este documento reúne los datos vigentes del ejercicio.\"",
    nuevo:
      "!1&&\"Este documento reúne los datos vigentes del ejercicio.\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · sin el pie «Fuente del reparto»",
    viejo:
      "f.jsxs(\"div\",{style:Wr.fuente,children:[\"Fuente del reparto: \",v?MLe:hDe,\".\"]})",
    nuevo:
      "!1&&f.jsxs(\"div\",{style:Wr.fuente,children:[\"Fuente del reparto: \",v?MLe:hDe,\".\"]})",
    veces: 1,
  },
  {
    nombre: "Menos texto · el panel de IA no explica lo que hace (hU: nota, descripción del modo, aviso de la indicación, pie)",
    viejo:
      "e&&f.jsx(\"div\",{style:Ir.nota,children:e}),",
    nuevo:
      "!1&&e&&f.jsx(\"div\",{style:Ir.nota,children:e}),",
    veces: 1,
  },
  {
    nombre: "(hU: descripción del modo)",
    viejo:
      "K?.ayuda&&f.jsx(\"div\",{style:Ir.ayuda,children:K.ayuda}),",
    nuevo:
      "!1&&K?.ayuda&&f.jsx(\"div\",{style:Ir.ayuda,children:K.ayuda}),",
    veces: 1,
  },
  {
    nombre: "(hU: aviso de la indicación)",
    viejo:
      "H.trim()&&f.jsx(\"div\",{style:Ir.extraOk,children:\"Va al FINAL del pedido, que es donde más pesa: la IA lo lee último, justo antes de contestar.\"}),",
    nuevo:
      "!1&&H.trim()&&f.jsx(\"div\",{style:Ir.extraOk,children:\"Va al FINAL del pedido, que es donde más pesa: la IA lo lee último, justo antes de contestar.\"}),",
    veces: 1,
  },
  {
    nombre: "(hU: pie)",
    viejo:
      "f.jsx(\"div\",{style:Ir.pie,children:\"Lo que entre queda marcado «[IA — verificar]»: es una propuesta, no una fuente.\"})",
    nuevo:
      "!1&&f.jsx(\"div\",{style:Ir.pie,children:\"Lo que entre queda marcado «[IA — verificar]»: es una propuesta, no una fuente.\"})",
    veces: 1,
  },
  {
    nombre: "Comandante y JEM · la Mesa le presta al motor (antes de wDe, el panel del Comandante y del JEM) el autollenado del G-3 (l3e) y el Programa General (HD, WD, Pie)",
    viejo:
      "function wDe({puesto:t,hojas:e={},onHojas:n",
    nuevo:
      "configurarEM({semillaG3:l3e,plazosPrograma:HD,responsablesPrograma:WD,eventosPrograma:Pie});function wDe({puesto:t,hojas:e={},onHojas:n",
    veces: 1,
  },
  {
    nombre: "Menos texto · la ayuda de cada casilla de las hojas de campos va de texto de ayuda (placeholder y título), no escrita debajo",
    viejo:
      "((j=t.ayudaCampos)==null?void 0:j[T])&&f.jsxs(\"div\",{style:Wt.ayudaCampo,children:[\"📕 \",t.ayudaCampos[T]]}),f.jsx(\"textarea\",{style:Wt.area,value:v[T]||\"\",rows:2,onChange:G=>o({...v,[T]:G.target.value})})",
    nuevo:
      "!1&&((j=t.ayudaCampos)==null?void 0:j[T])&&f.jsxs(\"div\",{style:Wt.ayudaCampo,children:[\"📕 \",t.ayudaCampos[T]]}),f.jsx(\"textarea\",{style:Wt.area,value:v[T]||\"\",rows:2,placeholder:t.ayudaCampos?.[T]||\"\",title:t.ayudaCampos?.[T]||void 0,onChange:G=>o({...v,[T]:G.target.value})})",
    veces: 1,
  },
  {
    nombre: "Menos texto · la nota de cada hoja del panel de hojas (Wr.nota) no se muestra",
    viejo:
      "nota:{fontSize:10.5,color:\"#9fb0c8\",lineHeight:1.45,background:\"rgba(255,255,255,0.04)\",borderRadius:6,padding:\"7px 9px\"},remite:",
    nuevo:
      "nota:{display:\"none\",fontSize:10.5,color:\"#9fb0c8\",lineHeight:1.45,background:\"rgba(255,255,255,0.04)\",borderRadius:6,padding:\"7px 9px\"},remite:",
    veces: 1,
  },
  {
    nombre: "Menos texto · los Conceptos Entrelazados pasan a calcos/conceptos/v5 (editor)",
    viejo:
      "\"../conceptos/v4/editor.js\"",
    nuevo:
      "\"../conceptos/v5/editor.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · los Conceptos Entrelazados pasan a calcos/conceptos/v5 (laminas)",
    viejo:
      "\"../conceptos/v4/laminas.js\"",
    nuevo:
      "\"../conceptos/v5/laminas.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · los Conceptos Entrelazados pasan a calcos/conceptos/v5 (modelo)",
    viejo:
      "\"../conceptos/v4/modelo.js\"",
    nuevo:
      "\"../conceptos/v5/modelo.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · los Conceptos Entrelazados pasan a calcos/conceptos/v5 (runtime)",
    viejo:
      "\"../conceptos/v4/runtime.js\"",
    nuevo:
      "\"../conceptos/v5/runtime.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · los Conceptos Entrelazados pasan a calcos/conceptos/v5 (word)",
    viejo:
      "\"../conceptos/v4/word.js\"",
    nuevo:
      "\"../conceptos/v5/word.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · la Organización de la tarea pasa a calcos/organizacion/v2 (carta)",
    viejo:
      "\"../organizacion/v1/carta.js\"",
    nuevo:
      "\"../organizacion/v2/carta.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · la Organización de la tarea pasa a calcos/organizacion/v2 (documento)",
    viejo:
      "\"../organizacion/v1/documento.js\"",
    nuevo:
      "\"../organizacion/v2/documento.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · la Organización de la tarea pasa a calcos/organizacion/v2 (editor)",
    viejo:
      "\"../organizacion/v1/editor.js\"",
    nuevo:
      "\"../organizacion/v2/editor.js\"",
    veces: 1,
  },
  {
    nombre: "Menos texto · la Organización de la tarea pasa a calcos/organizacion/v2 (runtime)",
    viejo:
      "\"../organizacion/v1/runtime.js\"",
    nuevo:
      "\"../organizacion/v2/runtime.js\"",
    veces: 1,
  },
]
