// Reemplazos del 2026-10-19 sobre calcos/assets/index-linea-tiempo-20261019.js → index-orden-documentos-20261019.js.
// Lo pidió Sergio con la captura de la F1·P7 Orden Preparatoria N° 1 («Todavía no hay nada en el
// calco para sembrar esta hoja») teniendo cargadas la Orden de Operaciones y sus anexos:
//   «los documentos que yo cargo por ahí, esos deben ser la fuente de información… para cualquiera
//   que suba esos son los documentos para sacar información».
//
// Qué pasaba: las hojas (Orden de Alerta, Órdenes Preparatorias, Guía Inicial, el membrete, los
// pedidos a la IA…) se llenan con la «Orden del escalón superior» de MESA EM (`ordenSup`, el estado
// `Tn`), y esos casilleros sólo se llenaban a mano: la Orden cargada en 📁 Ejercicio → Documentos
// (`en`) no los alimentaba.
// Ahora: cada vez que cambian los documentos o la Orden, `completarOrdenSup`
// (calcos/orden-documentos, código legible) llena los casilleros VACÍOS con lo que dice la Orden
// cargada — membrete, número, carta, situación, intención, concepto, coordinación, comando y, del
// párrafo de NUESTRA unidad en «Tareas de las unidades de maniobra», su misión, sus tareas y su
// organización —. No pisa lo escrito, llena cada casillero una sola vez (`_desdeDocs`) y no toca
// un ejercicio finalizado. Las Órdenes Preparatorias llevan, además, la organización de la tarea
// (nuestros medios: «CE-I: DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo») en «ORGANIZACIÓN (MEDIOS)».
//
// SHA-256 de index-linea-tiempo-20261019.js (antes de estos reemplazos): 52750f47b67a9af7f8059a6277e734c1a4d7c99c557d68294e0f609932e39b43
module.exports = [
  {
    nombre: 'Orden desde los documentos · el módulo calcos/orden-documentos',
    viejo: 'import {usarAutoguardado as SIDusarAutoguardado,sello as SIDselloGuardado} from "../guardado/v1/autoguardado.mjs?v=guardado20261010";',
    nuevo: 'import {usarAutoguardado as SIDusarAutoguardado,sello as SIDselloGuardado} from "../guardado/v1/autoguardado.mjs?v=guardado20261010";import {completarOrdenSup as SIDOrdenDeDocs} from "../orden-documentos/v1/orden.mjs?v=orden20261019";',
    veces: 1,
  },
  {
    nombre: 'Orden desde los documentos · la Orden del escalón superior se completa sola con la Orden cargada',
    viejo: 'const SIDelegirUnidad=je.useCallback(',
    nuevo: 'je.useEffect(()=>{if(Bn)return;let SIDo=null;try{SIDo=SIDOrdenDeDocs(Tn,en,{unidad:Tn?.unidad||ut?.nombre||""})}catch(SIDe){console.warn("Orden desde los documentos:",SIDe)}SIDo&&$s(SIDo)},[en,Tn,ut,Bn]);const SIDelegirUnidad=je.useCallback(',
    veces: 1,
  },
  {
    nombre: 'Orden desde los documentos · las Órdenes Preparatorias llevan la organización de la tarea (nuestros medios)',
    viejo: 'case"prep1":case"prep2":case"prep3":{const Ne={};Z.carta&&(Ne.CARTA=Z.carta),',
    nuevo: 'case"prep1":case"prep2":case"prep3":{const Ne={};Z.carta&&(Ne.CARTA=Z.carta),Z.organizacionTarea&&(Ne["ORGANIZACIÓN (MEDIOS)"]=Z.organizacionTarea),',
    veces: 1,
  },
]
