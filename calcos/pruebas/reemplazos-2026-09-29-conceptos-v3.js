// Reemplazos hechos el 2026-09-29 sobre el compilado de la Mesa del EM
// (calcos/assets/index-6Gm5UQ97.js → el que carga hoy calcos/index.html).
// Los pidió Sergio con el Word de la hoja F2·P1 que sacó la versión 2: el TO salía con
// XXX, el CE con XX, la DIV.MEC.-1 en la fila de sus propios regimientos y una «Unidad
// sin nombre» como unidad propia. La jerarquía es: CTO (XXXXX) → FF.TT.T.O. (XXXX) →
// CE (XXX) → División (XX) → regimientos; y la hoja tiene que poder armarse con las
// UNIDADES PURAS (la organización de la tarea de la orden) o con las FT / AGRUPACIONES
// TÁCTICAS que armó el oficial, siempre debajo de la División.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// La hoja vive en archivos legibles aparte (calcos/conceptos/v3/). Acá sólo:
//   · los import apuntan a calcos/conceptos/v3/ (v2 queda intacta para el compilado
//     anterior: un navegador con él en caché sigue usando sus módulos);
//   · la guía «¿Para qué es y cómo se llena?» explica las opciones y la jerarquía.
module.exports = [
  {
    nombre: 'Conceptos · módulos v3 (cadena de mando, unidades puras / FT, IA con jerarquía)',
    viejo: 'import SIDEditorConceptos from "../conceptos/v2/editor.js";import {configurarConceptos} from "../conceptos/v2/runtime.js";import {conceptosHTML as SIDConceptosHTML} from "../conceptos/v2/laminas.js";import {textoConceptos as SIDConceptosTexto} from "../conceptos/v2/modelo.js";import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/v2/word.js";',
    nuevo: 'import SIDEditorConceptos from "../conceptos/v3/editor.js";import {configurarConceptos} from "../conceptos/v3/runtime.js";import {conceptosHTML as SIDConceptosHTML} from "../conceptos/v3/laminas.js";import {textoConceptos as SIDConceptosTexto} from "../conceptos/v3/modelo.js";import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/v3/word.js";',
    veces: 1,
  },
  {
    nombre: 'Conceptos · guía «¿Para qué es y cómo se llena?» con las opciones y la jerarquía',
    viejo:
      'como:["Elegí el NIVEL: tu unidad con sus subordinadas (como el ejemplo del PMTD) o tu unidad entre las adyacentes (análisis de la orden superior).","🌱 La aplicación la arma con la orden del escalón superior, la 🧩 organización de la tarea (OD / OC, tarea y propósito), las fichas del calco y las fases del COA.",',
    nuevo:
      'como:["Arriba va la CADENA DE MANDO, un escalón por caja: CTO (XXXXX) → FF.TT.T.O. (XXXX) → CE (XXX) → tu División (XX). Debajo de tu División, lo que depende de ella.","Elegí con qué unidades: 🪖 UNIDADES PURAS (las de la organización de la tarea de la orden: regimientos, batallones, compañías y las BAJO CONTROL) o 🧩 FT / AGRUPACIONES TÁCTICAS (las que armaste, con su OD / OC / RES / SOST). Para el análisis de la orden superior, ↔️ tu unidad entre las adyacentes (las otras divisiones).","🌱 La aplicación la arma con la orden del escalón superior (unidad, escalón superior, fuerzas amigas, organización de la tarea), la 🧩 organización de la tarea, las fichas del calco y las fases del COA.",',
    veces: 1,
  },
]
