// Reemplazos del 2026-10-27 sobre calcos/assets/index-guia-plan-20261027.js → index-guia-inicial-20261027.js.
// Sergio, con la F1·P6 «Guía Inicial del Comandante» del panel del Comandante y el Word que bajó
// («F1P5_Guía_Inicial_del_Comandante_6.docx»): «está mal y está incompleta». La F1·P6 era una tabla
// (Área / Sección · Guía impartida · Para cuándo) que no es la forma del PMTD 2017 y el Word buscaba los siete
// apartados: salía todo vacío salvo el tiempo, a «Original: FF.TT.T.O.» y con «Autenticación». La lógica está en
// guia-inicial/v1/guia.mjs; acá:
//   · los imports (la Guía Inicial y el calco vivo del motor del Estado Mayor);
//   · la F1·P6 del Comandante pasa a los siete apartados del PMTD y es la MISMA hoja que la del G-3 (compartida);
//   · la del G-3 con la numeración del Comandante (F1·P6), la ayuda de cada apartado y la guía correctas;
//   · 🌱 (l3e) llena los siete apartados con lo del ejercicio; el Word (f3e) con la forma del modelo;
//   · en el panel del Comandante, 📘 la guía y 🌱 arriba de la hoja, y la guía en el pedido de la IA.
//
// SHA-256 de index-guia-plan-20261027.js (antes de estos reemplazos): ab89b41297826a5ec97c8821c20041c0e25674ddee2c585432e7f0e7d1f14ed8
const PRIMERO = 'import SIDEvPanel from "../evento-critico/v1/panel.js?v=ev20261025b";'
const CTX_CMTE = '{...SIDGuiaCalco(),...i,ordenSup:i.ordenSup&&Object.keys(i.ordenSup).length?i.ordenSup:SIDGuiaCalco().ordenSup,documentos:o?.documentos||[],g3:s,cmte:e}'
module.exports = [
  {
    nombre: 'El import de la Guía Inicial',
    viejo: PRIMERO,
    nuevo:
      'import {HOJA_CMTE as SIDGuiaCmte,HOJA_G3 as SIDGuiaG3,GUIA as SIDGuiaGuia,semillaGuia as SIDGuiaSemilla,wordGuia as SIDGuiaWord,AyudaGuia as SIDGuiaAyuda} from "../guia-inicial/v1/guia.mjs?v=guia20261027";' +
      PRIMERO,
    veces: 1,
  },
  {
    nombre: 'El calco vivo del motor del Estado Mayor (en el import que ya existe: siguen siendo 3 imports del motor)',
    viejo: 'sincronizarExtraEM as SIDEMExtra} from "../estado-mayor/v7/runtime.js"',
    nuevo: 'sincronizarExtraEM as SIDEMExtra,calcoActual as SIDGuiaCalco} from "../estado-mayor/v7/runtime.js"',
    veces: 1,
  },
  {
    nombre: 'La F1·P6 del Comandante: los siete apartados del PMTD, compartida con el G-3 (ya no la tabla Área / Guía / Para cuándo)',
    viejo:
      '{id:"guiaInicial",num:"F1·P6",nom:"Guía Inicial del Comandante",tipo:"filas",entrega:"SE DIFUNDE SÓLO AL ESTADO MAYOR",cols:["Área / Sección","Guía impartida","Para cuándo"],nota:"Sale ANTES del análisis de la misión, con lo poco que se sabe: qué quiere que se analice, con qué prioridad y en qué tiempo. Es lo que habilita la Orden Preparatoria N° 1 del G-3."}',
    nuevo: '{id:"guiaInicial",num:"F1·P6",nom:"Guía Inicial del Comandante",...SIDGuiaCmte}',
    veces: 1,
  },
  {
    nombre: 'La del Tablero del G-3: F1·P6 (como en el Comandante), con la ayuda del PMTD en cada apartado',
    viejo:
      '{id:"guiaInicial",num:"F1·P5",nom:"Guía Inicial del Comandante",entrega:"Se difunde al Estado Mayor — orienta, no autoriza el planeamiento definitivo",responsable:"Cmte.",tipo:"campos",campos:["I.- MÉTODO","II.- ASIGNACIÓN INICIAL DEL TIEMPO","III.- OFICIALES DE ENLACE","IV.- RECONOCIMIENTO INICIAL","V.- MOVIMIENTOS","VI.- TAREAS ADICIONALES","VII.- OTROS"],ayudaCampos:{"I.- MÉTODO":"Ej.: «Vamos a analizar dos cursos de acción, uno ofensivo y uno defensivo» (PMTD 2017). Es un texto de ejemplo — no se guarda solo.","II.- ASIGNACIÓN INICIAL DEL TIEMPO":"Se siembra solo desde la hoja «Línea de Tiempo» de esta misma fase (🌱).","III.- OFICIALES DE ENLACE":"A quién se manda y a qué unidad, si corresponde.","IV.- RECONOCIMIENTO INICIAL":"Qué se reconoce ya, sin esperar el plan completo.","V.- MOVIMIENTOS":"Qué unidad se mueve ya, aunque el plan no esté cerrado.","VI.- TAREAS ADICIONALES":"Cualquier tarea que el Cmte. quiera adelantar.","VII.- OTROS":"Lo que no entra en las anteriores."},autollena:"guiaInicial",nota:"Formato de siete secciones del PMTD 2017. Orienta el trabajo del Estado Mayor desde el primer momento; no reemplaza la Guía de Planificación de la fase II."}',
    nuevo: '{id:"guiaInicial",num:"F1·P6",nom:"Guía Inicial del Comandante",...SIDGuiaG3}',
    veces: 1,
  },
  {
    nombre: '📘 La guía de la hoja (y de su pedido a la IA): el MÉTODO es la clase y la forma del planeamiento, no cuántos cursos de acción',
    viejo: 'guiaInicial:{para:"Es lo primero que dice el Comandante después de leer la orden',
    nuevo: 'guiaInicial:SIDGuiaGuia,SIDguiaInicialVieja:{para:"Es lo primero que dice el Comandante después de leer la orden',
    veces: 1,
  },
  {
    nombre: '🌱 (l3e) llena los siete apartados con lo del ejercicio (la Línea de Tiempo, la Orden, las unidades)',
    viejo: 'case"guiaInicial":{const Ne={},Ve=MS(Se.lineaTiempo||{});',
    nuevo:
      'case"guiaInicial":{const SIDc=SIDGuiaCalco()||{};return SIDGuiaSemilla({...SIDc,...e,unidad:Fe,cmte:e.cmte||(SIDc.hojasG||{}).cmte},{lt:MS(Se.lineaTiempo||{}),esReco:Lm,nombre:js})}case"SIDguiaInicialVieja":{const Ne={},Ve=MS(Se.lineaTiempo||{});',
    veces: 1,
  },
  {
    nombre: '📄 El Word (f3e): la forma del modelo, el tiempo en su orden, sólo al Estado Mayor y sin autenticación',
    viejo: 'case"guiaInicial":{const u=h3e(a.lineaTiempo||{});',
    nuevo:
      'case"guiaInicial":return SIDGuiaWord(e,s,{lt:MS(a.lineaTiempo||{}),unidad:qa(n.unidad)||qa((n.ordenSup||{}).unidad),firma:qa(n.firmaCmte)});case"SIDguiaInicialVieja":{const u=h3e(a.lineaTiempo||{});',
    veces: 1,
  },
  {
    nombre: 'El panel del Comandante: 📘 la guía y 🌱 arriba de la F1·P6',
    viejo: 'I.entrega&&f.jsxs("div",{style:Wr.entrega,children:["📤 ",I.entrega]}),',
    nuevo: `I.entrega&&f.jsxs("div",{style:Wr.entrega,children:["📤 ",I.entrega]}),t==="cmte"&&I.id==="guiaInicial"&&f.jsx(SIDGuiaAyuda,{R:{jsx:f.jsx,jsxs:f.jsxs,useState:je.useState},valor:U(I),onValor:H=>G(I,H),semilla:()=>SIDGuiaSemilla(${CTX_CMTE},{lt:MS(s.lineaTiempo||{}),esReco:Lm,nombre:js}),aux:{lt:MS(s.lineaTiempo||{})}},"guia-"+I.id),`,
    veces: 1,
  },
  {
    nombre: '🤖 El pedido a la IA desde el panel del Comandante lleva la guía de la Guía Inicial',
    viejo: 'onPedido:async H=>{const q=await a?.();',
    nuevo: 'onPedido:async H=>{const q=await a?.();if(t==="cmte"&&I.id==="guiaInicial")return SIDEMPedido(t,I,cU(I,U(I),{expediente:q?.md||"",modo:H,seccion:x.seccion,ayuda:SIDGuiaGuia}));',
    veces: 1,
  },
  {
    nombre: 'El formato militar con la versión nueva (la Guía Inicial sin autenticación)',
    viejo: 'formato-militar/v1/runtime.js?v=guiafinal20261027',
    nuevo: 'formato-militar/v1/runtime.js?v=guiainicial20261027',
    veces: 1,
  },
]
