// ============================================================
// reemplazos-2026-11-17-linea-tiempo.js
//
// EL PROBLEMA (17-11-2026, en clase). Dos cursantes cargaron la Línea Inicial
// de Tiempo y la hoja no salía: ni la lámina, ni el cuadro, ni los botones de
// 📄 Word e 🖨 imprimir. Arriba, en rojo:
//
//   «Falta la recepción de la orden o el inicio de la operación»
//
// …con los seis campos escritos. El dato que la hoja no sabía leer era el del
// «Inicio de la operación»: habían puesto **`D`**, a secas, que es como lo dice
// la misión («la operación inicia el día D»). El lector de día D exigía SIEMPRE
// la hora —`D (0500)`— y, sin ella, devolvía nulo: para la hoja el campo estaba
// vacío. Y como la lámina, el cuadro, el Word y la impresión cuelgan todos de
// `t.ok`, un dato bien escrito dejaba la hoja entera muda.
//
// EL ARREGLO. La hora pasa a ser opcional: `D`, `D-15` y `D+3` valen, y valen
// las 0000. No se inventa nada y no se calla: el rótulo celeste al lado del
// campo muestra `D (0000)`, y la hoja agrega el aviso «se cargó sin hora: la
// hoja tomó las 0000. Si la Orden dice otra hora, escribila como «D (0500)»».
// De paso se tolera la cola «hrs»/«horas» que se copia del membrete de la Orden.
//
// Dos reemplazos, reversibles byte por byte (`construir-linea-tiempo.js`).
// En el fuente (Vite/React) esto ya está en `src/lib/lineaTiempo.js`
// (`leerDiaD` + el aviso), con sus pruebas en `tests/lineaTiempo.test.mjs`.
// ============================================================

export const REEMPLAZOS = [
  {
    // 1 · `oq` = leerDiaD. La hora deja de ser obligatoria.
    nombre: 'leerDiaD acepta «D», «D-15» y «D+3» sin hora',
    de: 'function oq(t){if(!t)return null;const e=String(t).trim().toUpperCase().match(/^D\\s*([+-]\\s*\\d+)?\\s*\\(?\\s*([0-2]?\\d)[:.]?([0-5]\\d)\\s*\\)?$/);if(!e)return null;const n=Number(e[2]),a=Number(e[3]);return n>23?null:{dias:e[1]?Number(e[1].replace(/\\s+/g,"")):0,hh:n,mm:a}}',
    a: 'function oq(t){if(!t)return null;const e=String(t).trim().toUpperCase().replace(/\\s*(?:HRS?|HS|HORAS?)\\.?$/,"").trim().match(/^D\\s*([+-]\\s*\\d+)?\\s*(?:\\(?\\s*([0-2]?\\d)[:.]?([0-5]\\d)\\s*\\)?)?$/);if(!e)return null;const cH=e[2]!=null,n=cH?Number(e[2]):0,a=cH?Number(e[3]):0;return n>23?null:{dias:e[1]?Number(e[1].replace(/\\s+/g,"")):0,hh:n,mm:a,sinHora:!cH}}',
  },
  {
    // 2 · El aviso. `G` es el arreglo de avisos de calcularLineaTiempo y `t`,
    //     los valores de la hoja. Se dice qué campo quedó sin hora.
    nombre: 'la hoja avisa qué momento quedó en 0000',
    de: 'G=[];r?',
    a: 'G=[];{const aSH=[["emision","la emisión de la orden"],["recepcion","la recepción de la orden"],["inicioOperacion","el inicio de la operación"],["finOperaciones","el fin de las operaciones"],["inicioMovimientos","el inicio de movimientos"]].filter(zz=>{const qq=oq(t[zz[0]]);return!!(qq&&qq.sinHora)}).map(zz=>zz[1]);aSH.length&&G.push(`✎ ${aSH.join(" y ")} ${aSH.length===1?"se cargó":"se cargaron"} sin hora: la hoja tomó las 0000. Si la Orden dice otra hora, escribila como «D (0500)».`)}r?',
  },
]
