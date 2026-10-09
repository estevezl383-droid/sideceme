// Reemplazos hechos el 2026-10-03 (segunda vuelta) sobre el compilado de la Mesa del EM
// (calcos/assets/index-personal-20261003.js → index-lector-20261003.js).
// Lo pidió Sergio con capturas de la F2·P13 del G-1: la IA contestó con el DOCUMENTO
// escrito (títulos y listas en Markdown), no con el JSON, y la Mesa decía «No se encontró
// un JSON válido». Ahora la Mesa lee igual: el JSON reparado (saltos de línea dentro de los
// textos, comas de más, comillas tipográficas), el JSON cortado y el documento escrito por
// sus títulos (calcos/estado-mayor/v2/lector.js).
//
//   · el motor pasa a la carpeta v2 (el navegador guarda los módulos: carpeta nueva para
//     que baje los nuevos, como conceptos v2…v4);
//   · dU (la respuesta de la IA en las hojas de trabajo de siempre, de TODAS las secciones):
//     si no es JSON, intenta el JSON reparado, la tabla de Markdown (renglones), las dos
//     listas o «Casilla: texto» antes de dar el error.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-lector.js arma el compilado y comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: 'Lector · el motor de documentos pasa a calcos/estado-mayor/v2 (y presta rescatarHoja)',
    viejo:
      'import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v1/editor.js";import {configurarEM,sincronizarEM as SIDEMSync} from "../estado-mayor/v1/runtime.js";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido} from "../estado-mayor/v1/registro.js";',
    nuevo:
      'import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v2/editor.js";import {configurarEM,sincronizarEM as SIDEMSync} from "../estado-mayor/v2/runtime.js";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido,rescatarHoja as SIDEMRescatar} from "../estado-mayor/v2/registro.js";',
    veces: 1,
  },
  {
    nombre: 'Lector · las hojas de trabajo de siempre aceptan la respuesta aunque no venga en JSON',
    viejo: 'if(g==null)return{ok:!1,error:"No se encontró un JSON válido en lo que pegaste. Pedile a la IA que reenvíe SÓLO el bloque JSON."};g=uU(g);const v=KS(e,a,n)',
    nuevo: 'if(g==null)g=SIDEMRescatar(i,e,KS(e,a,n));if(g==null)return{ok:!1,error:"No se reconoció la respuesta: no trae un JSON válido ni la hoja escrita con sus columnas o sus títulos. Pegá la respuesta COMPLETA de la IA, desde el principio hasta el final, o pedile que reenvíe SÓLO el bloque JSON."};g=uU(g);const v=KS(e,a,n)',
    veces: 1,
  },
]
