# 📋 La Guía Inicial del Comandante (F1·P6) con la forma del PMTD 2017

Lo pidió Sergio el 27-10-2026 con la captura del panel del Comandante (F1·P6) y el Word que bajó
(«F1P5_Guía_Inicial_del_Comandante_6.docx»), el modelo de la Escuela («guia_de_planificacion_inicial.docx») y el texto
del PMTD 2017: «mirá cómo me está desarrollando la guía de planificación inicial, está mal y está incompleta, revisá
completa de acuerdo a lo más aplicable».

## Lo que estaba mal

| | Antes | Lo que dice el PMTD 2017 (Parte Tercera, Cap. II, III.- Técnica para la elaboración de las guías) |
|---|---|---|
| La hoja del Comandante (F1·P6) | Una TABLA «Área / Sección · Guía impartida · Para cuándo» | Siete apartados: I.- MÉTODO · II.- ASIGNACIÓN INICIAL DEL TIEMPO · III.- OFICIALES DE ENLACE · IV.- RECONOCIMIENTO INICIAL · V.- MOVIMIENTOS · VI.- TAREAS ADICIONALES · VII.- OTROS |
| El Word que bajaba | Buscaba los siete apartados en una tabla: **todos vacíos** salvo el tiempo | Cada apartado con su contenido |
| Dos hojas para el mismo documento | La F1·P6 del Comandante (tabla) y la F1·P5 del G-3 (siete apartados), cada una con lo suyo | Un solo documento, del Comandante |
| I.- MÉTODO | La guía decía «cuántos cursos de acción quiere» («dos, uno ofensivo y uno defensivo») | «Se determina la CLASE y la FORMA de planeamiento que se va a realizar y se justifica el mismo» (deliberado / en tiempo restringido; paralelo). Los cursos de acción son de la Guía de Planificación (Fase II) |
| 🌱 | Sólo el tiempo y «Elementos de reconocimiento disponibles: …» | Los siete apartados (ver abajo) |
| II.- El tiempo | Sin «Tiempo para preparar (2/3)» ni «Tiempo disponible para las Unidades subordinadas», en otro orden | El orden del modelo: tiempo total disponible, emisión, recepción, inicio de la operación, inicio de los movimientos, 1/3, 2/3, UU. subordinadas |
| La distribución | «Original: FF.TT.T.O. · Copia 1-12: UU. DEP. · Copia 13: ARCHIVO» | «Las Guías por regla general son emitidas para el Estado Mayor»: Original JEM., Copia 1-5 G-1 a G-5, Copia 6 ARCHIVO |
| La autenticación | «Autenticación: JEM. … / CMTE …» | El modelo no la tiene: la firma «EL COMANDANTE DE …» |
| El título | «GUÍA INICIAL DEL COMANDANTE No. 01» | «GUÍA INICIAL DEL COMANDANTE» (hay una sola) |

## Ahora

- **⭐ CMTE. → Mis hojas → F1·P6** y **Tablero del G-3 → F1·P6** son la MISMA hoja (`compartida: 'g3'`): lo que
  escribe uno lo ve el otro. Los siete apartados con la instrucción del PMTD en cada uno (📕).
- **📘 ¿Para qué es y cómo se llena?** y **🌱 Traer del calco y de la Línea de Tiempo lo que falte** arriba de la hoja
  del Comandante (en el G-3 ya estaban). 🌱 llena SÓLO lo vacío:

| Apartado | Lo que trae |
|---|---|
| I.- MÉTODO | El TD, el 1/3 del Estado Mayor (hasta cuándo) y los 2/3 de las subordinadas; la CLASE: **deliberado** o **en tiempo restringido** (si el 1/3 es menor de 48 h — criterio de la Mesa, el PMTD no da cifra), la FORMA **paralela** (con la O.P. N° 1), y la participación del Comandante (el ejemplo del PMTD) |
| II.- ASIGNACIÓN INICIAL DEL TIEMPO | «La línea de tiempo inicial para la operación es la siguiente:» y los renglones en el orden del modelo, de la Línea Inicial de Tiempo |
| III.- OFICIALES DE ENLACE | Ante el escalón superior, ante las adyacentes que nombra la Orden, de las unidades BAJO CONTROL y de las de refuerzo; lo que la Orden dice del enlace |
| IV.- RECONOCIMIENTO INICIAL | Por ahora sólo en la carta; en el terreno desde la O.P. N° 1, con los elementos de reconocimiento (las fichas y la organización de la tarea); lo que la Orden dispone |
| V.- MOVIMIENTOS | Las unidades BAJO CONTROL a la NZR. desde el inicio de los movimientos; si los movimientos empiezan antes de que termine el 1/3, lo dice; lo que la Orden dispone (NZR., zonas de reunión) |
| VI.- TAREAS ADICIONALES | JEM. (Programa General de Planeamiento y la Orientación del Análisis de la Misión al fin de su fase en la Línea de Tiempo), G-3 (O.P. N° 1 a las subordinadas y la coordinación con las BAJO CONTROL), G-2 (PICB), G-1/G-4/G-5 (apreciaciones). Los renglones de la tabla de antes («G-4: … (para el D-40).») se pasan acá para no perderlos |
| VII.- OTROS | Dónde trabaja el Estado Mayor (la Orden de Alerta) y la clasificación de los documentos |

- **🤖 la IA**: el pedido lleva la guía del PMTD (para qué es y qué va en cada apartado), también desde el panel del
  Comandante.
- **📄 Word (formato militar)**: «F1P6_…», los siete apartados (las tareas y los oficiales de enlace letrados A.-,
  B.-…), el tiempo con guiones en el orden del modelo, la firma «EL COMANDANTE DEL CE-I / DE LA DIV.MEC.-1», la
  distribución sólo al Estado Mayor, sin autenticación y sin número en el título.

## Archivos

- `v1/guia.mjs` — sin dependencias del compilado: la hoja (`HOJA_CMTE`, `HOJA_G3`), la guía (`GUIA`, `AYUDA_CAMPOS`),
  🌱 (`semillaGuia`, `sembrarGuia`), el Word (`wordGuia`, `lineasTiempo`) y el panel (`AyudaGuia`). Las unidades
  (propia, superior, subordinadas, BAJO CONTROL y adyacentes) las lee con `lecturaDelEjercicio` de
  `conceptos/v4/modelo.js` (las mismas cuentas que la hoja de Conceptos Entrelazados).
- `formato-militar/v1/word.js` (`spec.sinAutenticacion`) y `runtime.js` (`spec.sinNumero`, versión `guia20261027`).
- En el compilado (`pruebas/reemplazos-2026-10-27-guia-inicial.js`, `index-guia-inicial-20261027.js`): los imports,
  las dos hojas, la guía, 🌱 (`l3e`), el Word (`f3e`), el panel del Comandante y su pedido a la IA.
- Pruebas: `pruebas/guia-inicial.mjs` (10 casos, con las funciones REALES del compilado) y `pruebas/e2e/guia-inicial.cjs`
  (en la Mesa, escritorio y teléfono, con el Word bajado y leído).

## Qué es doctrina y qué es criterio de la Mesa

- Los siete apartados, sus instrucciones, que va sólo al Estado Mayor y la firma del Comandante: PMTD 2017 y el modelo
  de la Escuela. La regla de los tercios (1/3 para el Estado Mayor, 2/3 para las subordinadas): PMTD 2017, Fase I.
- Las 48 h para decir «en tiempo restringido», que el reconocimiento en el terreno se autorice con la O.P. N° 1 y el
  plazo de la Orientación del Análisis de la Misión (el fin de la primera fase del reparto del 1/3 de la Línea de
  Tiempo) son criterio de la Mesa: el Comandante los corrige en la hoja.
