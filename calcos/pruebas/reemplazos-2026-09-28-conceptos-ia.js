// Reemplazos hechos el 2026-09-28 (tercer paso del día) sobre el compilado de la Mesa
// del EM (calcos/assets/index-nQKdqwIj.js → el que carga hoy calcos/index.html).
// Los pidió Sergio: la hoja F2·P1 «Conceptos entrelazados» tiene que salir LLENA, con
// la forma de la hoja de trabajo del PMTD 2017 (pág. 20) y de su ejemplo (págs. 21-22),
// armada por la aplicación con lo del ejercicio y con la opción de trabajarla con IA
// como las demás hojas (la versión anterior era un formulario vacío y le había sacado
// el panel de IA).
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js comprueba
// que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// La hoja vive en archivos legibles aparte (calcos/conceptos/). Acá sólo:
//   · se importan los módulos nuevos de calcos/conceptos/v2/ (los de la versión
//     anterior quedan intactos: un navegador con el compilado viejo en caché sigue
//     usando los suyos, y ninguna caché mezcla las dos versiones);
//   · se le prestan useMemo/useRef, el encabezado de los pedidos a la IA (Qq) y el
//     corrector de terminología (uU) que usan todas las hojas;
//   · el Tablero del G-3 monta el editor con los datos del ejercicio (orden del
//     escalón superior, fichas, organización de la tarea, fases, hojas del G-3,
//     documentos aportados) y con el expediente para la IA;
//   · el expediente y la carpeta del G-3 muestran la hoja como texto y como láminas;
//   · la guía «¿Para qué es y cómo se llena?» explica la hoja nueva.
module.exports = [
  {
    nombre: 'Conceptos · módulos nuevos (carpeta calcos/conceptos/v2)',
    viejo: 'import SIDEditorConceptos from "../conceptos/editor.js";import {configurarConceptos} from "../conceptos/runtime.js";import {conceptosHTML as SIDConceptosHTML} from "../conceptos/modelo.js";import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/word.js";',
    nuevo: 'import SIDEditorConceptos from "../conceptos/v2/editor.js";import {configurarConceptos} from "../conceptos/v2/runtime.js";import {conceptosHTML as SIDConceptosHTML} from "../conceptos/v2/laminas.js";import {textoConceptos as SIDConceptosTexto} from "../conceptos/v2/modelo.js";import {descargarConceptosWord as SIDConceptosWord} from "../conceptos/v2/word.js";',
    veces: 1,
  },
  {
    nombre: 'Conceptos · React, encabezado de la IA y corrector de terminología de la Mesa',
    viejo: 'configurarConceptos({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,Document:A5e,Packer:loe,Paragraph:Js,ImageRun:kPe,PageOrientation:GD})',
    nuevo: 'configurarConceptos({jsx:f.jsx,jsxs:f.jsxs,useState:je.useState,useMemo:je.useMemo,useRef:je.useRef,Document:A5e,Packer:loe,Paragraph:Js,ImageRun:kPe,PageOrientation:GD,encabezadoIA:Qq,corregirIA:uU})',
    veces: 1,
  },
  {
    nombre: 'Conceptos · el Tablero del G-3 le pasa el ejercicio y el expediente',
    viejo: 'f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})',
    nuevo: 'Ke.tipo==="conceptos"?f.jsx(SIDEditorConceptos,{valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ctx:{...I,unidades:t,orgTarea:a,g3:M,documentos:U?.documentos||[]},onExpediente:j}):f.jsx(yU,{hoja:Ke,valor:M[Ke.id],onValor:at=>Ge(Ke.id,at),ordenSup:I.ordenSup||{},documentos:U?.documentos||[],g3:M})',
    veces: 1,
  },
  {
    nombre: 'Conceptos · fuera del Tablero, el editor recibe lo que tenga (orden superior, documentos, hojas)',
    viejo: 'if(t.tipo==="conceptos")return f.jsx(SIDEditorConceptos,{valor:e,onValor:o});',
    nuevo: 'if(t.tipo==="conceptos")return f.jsx(SIDEditorConceptos,{valor:e,onValor:o,ctx:{ordenSup:r,documentos:u,g3:h}});',
    veces: 1,
  },
  {
    nombre: 'Conceptos · en el expediente (y en los pedidos de las otras hojas) va como texto legible',
    viejo: 'function zle(t,e){if(!e)return"";',
    nuevo: 'function zle(t,e){if(!e)return"";if(t?.tipo==="conceptos")return SIDConceptosTexto(e);',
    veces: 1,
  },
  {
    nombre: 'Conceptos · la carpeta del G-3 lleva las láminas con la unidad y el ejercicio',
    viejo: 'function ED(t,e={},n={}){if(t.tipo==="conceptos")return SIDConceptosHTML(e);',
    nuevo: 'function ED(t,e={},n={}){if(t.tipo==="conceptos")return SIDConceptosHTML(e,{unidad:n?.unidad||"",ejercicio:n?.ejercicio||"",clasificacion:n?.ordenSup?.clasificacion||""});',
    veces: 1,
  },
  {
    nombre: 'Conceptos · guía «¿Para qué es y cómo se llena?»',
    viejo:
      'entrelazados:{para:"Hoja gráfica con relaciones verticales y horizontales, tarea y propósito por unidad.",como:["Identifique los dos escalones superiores según el ejercicio.","Registre la unidad propia, maniobra, apoyo de combate y SPAC con magnitud y denominación.","Transcriba tarea y propósito; agregue fases cuando estén definidas.","Declare las relaciones directas e indirectas.","El texto anterior se conserva en el formulario."],ejemplo:"T = tarea. P = propósito. Los campos sin información muestran SIN DATO."}',
    nuevo:
      'entrelazados:{para:"Te ubica VERTICAL y HORIZONTALMENTE: qué quieren los escalones de arriba, qué hace cada unidad de al lado y cómo se apoyan, no sólo en maniobra sino también en apoyo de combate y de servicio de combate. Es una hoja GRÁFICA (PMTD 2017, pág. 20; ejemplo en las págs. 21-22).",como:["Elegí el NIVEL: tu unidad con sus subordinadas (como el ejemplo del PMTD) o tu unidad entre las adyacentes (análisis de la orden superior).","🌱 La aplicación la arma con la orden del escalón superior, la 🧩 organización de la tarea (OD / OC, tarea y propósito), las fichas del calco y las fases del COA.","🤖 La IA la completa con el expediente entero (también los documentos aportados): tarea y propósito por fase, esfuerzo principal, fuegos (tarea, propósito, PAF, efecto), ingeniería (PE, PT) y SPAC. Sumale tu idea y, si hace falta, orientaciones o archivos.","Cada gráfico lleva magnitud, identificación y denominación; flecha llena = relación directa, discontinua = indirecta.","Revisala, corregila a mano y bajala en Word con el formato del PMTD."],ejemplo:"CE (XXX) — T: Defiende y derrota al CE. I de ROJO. · Div-1 (XX) — T: Defiende y destruye al RIMEC 6 y a la FT-43. · CALAMA (III, OD ☆) — T F4: Ataca y destruye a las unidades de la FT-43 en el AE «YUNQUE». P: Impedir la ejecución del cerco a VIACHA. (PMTD 2017, pág. 21)"}',
    veces: 1,
  },
]
