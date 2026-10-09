// Reemplazos hechos el 2026-10-03 (tercera vuelta) sobre el compilado de la Mesa del EM
// (calcos/assets/index-lector-20261003.js → index-g5-20261003.js).
// Lo pidió Sergio con capturas del panel del G-5 («🏛️ Asuntos Civiles — G-5 → 📋 Mis
// hojas»): la Apreciación Activa de AC/GM (F1·P3, F2·P13) y el Anexo de AC/GM (F7·P1) «se
// bajaban hechos» y no se podían trabajar. Ahora el G-5 está registrado en el motor de
// documentos de Estado Mayor (calcos/estado-mayor/v3/campos/g5.js), como el G-1:
//
//   · el motor pasa a la carpeta v3 (el navegador guarda los módulos: carpeta nueva para
//     que baje los nuevos) y presta sincronizarExtraEM;
//   · configurarEM() se llama una vez más (en la v3 SUMA lo que recibe) con las cuentas del
//     panel del G-5: el inventario de recursos del área (rC), la población (mP), la
//     previsión de evacuación (fN), lo que se descarga al G-4 (SDe) y las clasificaciones
//     (LU); así el motor usa la MISMA cuenta que el panel;
//   · un efecto nuevo le pasa al motor las CAPAS cargadas (ve: centros poblados e
//     infraestructura), de las que salen el inventario y la población.
//
// Ninguna inserción cae dentro de lo que insertaron las listas anteriores (salvo el cambio
// de versión de la carpeta en los imports, como hizo la lista del lector de v1 a v2).
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que aparecer
// «veces» veces) y se cambió por «nuevo». construir-g5.js arma el compilado y comprueba que
// deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: 'G-5 · el motor de documentos pasa a calcos/estado-mayor/v3 (y presta sincronizarExtraEM)',
    viejo:
      'import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v2/editor.js";import {configurarEM,sincronizarEM as SIDEMSync} from "../estado-mayor/v2/runtime.js";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido,rescatarHoja as SIDEMRescatar} from "../estado-mayor/v2/registro.js";',
    nuevo:
      'import SIDEditorEM,{AyudaHoja as SIDEMAyuda} from "../estado-mayor/v3/editor.js";import {configurarEM,sincronizarEM as SIDEMSync,sincronizarExtraEM as SIDEMExtra} from "../estado-mayor/v3/runtime.js";import {fasesConDocumentos as SIDEMFases,esDocumento as SIDEMEs,tieneDocumento as SIDEMTiene,textoDocumento as SIDEMTexto,guiaIA as SIDEMGuia,pedidoHoja as SIDEMPedido,rescatarHoja as SIDEMRescatar} from "../estado-mayor/v3/registro.js";',
    veces: 1,
  },
  {
    nombre: 'G-5 · configurarEM() suma las cuentas del panel del G-5 (inventario, población, evacuación, descarga al G-4)',
    viejo: 't6.createRoot(document.getElementById("root")).render(',
    nuevo: 'configurarEM({inventarioAC:rC,poblacionAC:mP,evacuacionAC:fN,descargaAC:SDe,estadosAC:LU});t6.createRoot(document.getElementById("root")).render(',
    veces: 1,
  },
  {
    nombre: 'G-5 · la Mesa le pasa al motor las capas cargadas (centros poblados e infraestructura)',
    viejo: ',s1=je.useMemo(()=>{const Ee=(Array.isArray(fe)?fe:fe?[fe]:[])',
    nuevo: ',SIDEMcapas=je.useEffect(()=>{SIDEMExtra({capas:ve})},[ve]),s1=je.useMemo(()=>{const Ee=(Array.isArray(fe)?fe:fe?[fe]:[])',
    veces: 1,
  },
]
