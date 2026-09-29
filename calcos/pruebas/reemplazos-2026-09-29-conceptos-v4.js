// Reemplazos hechos el 2026-09-29 (segundo paso del día) sobre el compilado de la Mesa
// del EM (calcos/assets/index-nDtcWpLo.js → el que carga hoy calcos/index.html).
// La hoja F2·P1 pasó a calcos/conceptos/v4/ (la v3 con todas las unidades de las filas
// con flecha directa a la unidad propia). Se publica en carpeta NUEVA porque el docente
// siguió viendo la v3 vieja: el navegador guardaba en caché los módulos con la misma
// dirección. Con otra carpeta (y otro compilado) los baja de nuevo.
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.
module.exports = [
  {
    nombre: 'Conceptos · módulos v4 (todas las unidades con flecha directa a la unidad propia)',
    viejo: 'import SIDEditorConceptos from "../conceptos/v3/editor.js";import {configurarConceptos} from "../conceptos/v3/runtime.js";import {conceptosHTML as SIDConceptosHTML} from "../conceptos/v3/laminas.js";import {textoConceptos as SIDConceptosTexto} from "../conceptos/v3/modelo.js";import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/v3/word.js";',
    nuevo: 'import SIDEditorConceptos from "../conceptos/v4/editor.js";import {configurarConceptos} from "../conceptos/v4/runtime.js";import {conceptosHTML as SIDConceptosHTML} from "../conceptos/v4/laminas.js";import {textoConceptos as SIDConceptosTexto} from "../conceptos/v4/modelo.js";import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/v4/word.js";',
    veces: 1,
  },
]
