// Reemplazos hechos el 2026-10-03 (quinta vuelta) sobre el compilado de la Mesa del EM
// (calcos/assets/index-coordenadas-20261003.js → index-respuestas-20261003.js).
// Lo pidió Sergio con una captura de la F2·P3 del G-5 («Completar y mejorar»): «No se
// reconoció la respuesta: no trae un JSON válido…» — y dijo que el error era RECURRENTE.
// Pasaban dos cosas:
//   · el pedido de las hojas de trabajo terminaba con «CÓMO CONTESTAR» y, si el oficial
//     escribía una indicación, ésta iba DESPUÉS («es lo último que leés… tiene prioridad»):
//     la IA redactaba la hoja en vez de devolver el JSON;
//   · la Mesa sólo leía el JSON con las claves exactas o la tabla de Markdown.
// Ahora (calcos/estado-mayor/v4):
//   · el motor pasa a la carpeta v4 y presta cierreIndicacion, filasDeRespuesta, celdaFila,
//     listasDe y claveCasilla; pedidoHoja deja «FORMATO DE TU RESPUESTA» al FINAL del
//     pedido de las hojas de TODAS las secciones, con la cabecera exacta de la tabla;
//   · Boe (la indicación del oficial al final del pedido): después de la indicación, el
//     recordatorio de que cambia el estilo, no el formato;
//   · dU (la respuesta de las hojas de trabajo de siempre, de todas las secciones): los
//     renglones en otra clave ({ "tareas": […] }), las columnas sin tildes o con otro nombre,
//     las dos listas con sus nombres ({ "hechos": […] }) y las casillas con el rótulo largo.
//     (Lo que no es JSON lo lee rescatarHoja, que ya llamaba dU: la tabla copiada de la
//     pantalla, los renglones rotulados, las listas, el JSON cortado.)
//
// Ninguna inserción cae dentro de lo que insertaron las listas anteriores (salvo los
// `import` del motor, como en las vueltas anteriores).
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-respuestas.js arma el compilado y
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: 'Respuestas · el motor de documentos pasa a calcos/estado-mayor/v4 (y presta los lectores tolerantes)',
    viejo:
      'import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v3/editor.js";import {configurarEM,sincronizarEM as SIDEMSync,sincronizarExtraEM as SIDEMExtra} from "../estado-mayor/v3/runtime.js";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido,rescatarHoja as SIDEMRescatar} from "../estado-mayor/v3/registro.js";',
    nuevo:
      'import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v4/editor.js";import {configurarEM,sincronizarEM as SIDEMSync,sincronizarExtraEM as SIDEMExtra} from "../estado-mayor/v4/runtime.js";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido,rescatarHoja as SIDEMRescatar,cierreIndicacion as SIDEMIndicacion,filasDeRespuesta as SIDEMFilasDe,celdaFila as SIDEMCelda,listasDe as SIDEMListas,claveCasilla as SIDEMClave} from "../estado-mayor/v4/registro.js";',
    veces: 1,
  },
  {
    nombre: 'Respuestas · después de la indicación del oficial, el recordatorio de que el formato no cambia (Boe)',
    viejo: 'function Boe(t,e){',
    nuevo: 'function Boe(t,e){return SIDEMIndicacion(SIDBoe0(t,e),e)}function SIDBoe0(t,e){',
    veces: 1,
  },
  {
    nombre: 'Respuestas · hojas de renglones: los renglones aunque vengan en otra clave ({ "tareas": […] })',
    viejo: 'te=Array.isArray(g)?g:Array.isArray(g.filas)?g.filas:null',
    nuevo: 'te=Array.isArray(g)?g:Array.isArray(g.filas)?g.filas:SIDEMFilasDe(g)',
    veces: 1,
  },
  {
    nombre: 'Respuestas · hojas de renglones: las columnas aunque vengan sin tildes o con otro nombre',
    viejo: 'for(const re of G){const X=E(q[re]);X&&(K[re]=X)}',
    nuevo: 'for(const re of G){const X=E(SIDEMCelda(q,re));X&&(K[re]=X)}',
    veces: 1,
  },
  {
    nombre: 'Respuestas · hojas de dos listas: también { "hechos": […], "suposiciones": […] }',
    viejo: 'const G=(g.a||g.A||[]).map(E).filter(Boolean),te=(g.b||g.B||[]).map(E).filter(Boolean)',
    nuevo: 'const SIDL=SIDEMListas(g,e.cols||[]),G=(SIDL.a||[]).map(E).filter(Boolean),te=(SIDL.b||[]).map(E).filter(Boolean)',
    veces: 1,
  },
  {
    nombre: 'Respuestas · hojas de casillas: la casilla aunque la clave venga sin tildes o con el rótulo largo',
    viejo: 'for(const[G,te]of Object.entries(g)){const H=S.get(G);',
    nuevo: 'for(const[SIDG,te]of Object.entries(g)){const G=S.has(SIDG)?SIDG:SIDEMClave(SIDG,v.claves)||SIDG,H=S.get(G);',
    veces: 1,
  },
]
