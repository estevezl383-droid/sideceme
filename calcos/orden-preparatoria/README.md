# 📄 Las Órdenes Preparatorias del G-3 con el CAP aprobado (sobre todo la F6·P4 «Orden Preparatoria N° 3»)

Lo pidió Sergio el 26-10-2026 con la F6·P4 del CE-I (AO LAUCA) y el Word que bajó: «la Orden Preparatoria N° 3 ya casi
es la Orden de Operaciones… está muy incompleta… ¿por qué lo de la imagen 2 está vacío si ya llenamos todo?». La
imagen 2 era **«III.- EJECUCIÓN · A. Concepto de la operación (el CAP aprobado)»** vacía, y el Word decía «Concepto de
la operación.» sin nada debajo. Además, ✓ Aplicar avisaba como inventadas la «DIV MEC-1» y la «VI División de
Ejército», que están en la Orden superior.

## Por qué pasaba

- **🌱 no traía el CAP**: para la O.P. N° 3 sólo llenaba carta, organización, misión, intención y coordinación. El
  Concepto, las tareas de las unidades (B y C), el apoyo de servicio y el comando quedaban vacíos, aunque el G-3 ya
  tenía la F3·P4, la F3·P6, la decisión de la F5·P1 y las cinco fases del CAP en la carta.
- **🌱 escribía casillas que la F6·P4 no tiene**: la situación iba a «I.- SITUACIÓN · A. Fuerzas enemigas» (es de la
  O.P. N° 1); la F6·P4 tiene una sola, «I.- SITUACIÓN». No se veía, no salía en el Word, pero el aviso de unidades la
  revisaba igual (el «II División de Ejército … (en «I.- SITUACIÓN · A. Fuerzas enemigas»)» de la captura).
- **El pedido a la IA no le daba el CAP aprobado ni le decía que el Concepto es obligatorio**: la IA metió la
  maniobra dentro de la Intención y dejó el Concepto vacío (12 de 13 casillas).
- **Si la IA escribía la clave con otras palabras** («… (CAP aprobado)», «A. Concepto de la operación»), ✓ Aplicar la
  tiraba sin decir nada.
- **El aviso de unidades** confundía la «DIV MEC-1» (adyacente) con la «DIV-1» propia (misma clave `div1`), no
  reconocía «VI DE» como división y, si la brigada enemiga no tenía escalón cargado, decía «el enemigo es BAT. …».

## En la Mesa (G-3 → 📄 Documentos → 6 · Aprobar el CAP → F6·P4)

| Botón | Qué hace ahora |
|---|---|
| **🌱 Traer del calco lo que falte** | Llena SÓLO lo vacío: **A. Concepto** con el CAP aprobado (el que la F5·P1 marcó «RECOMENDADO AL COMANDANTE»; si no hay marca, el activo): su nombre y enunciado (F3·P6), la maniobra (forma, esfuerzo principal, secundarios, reserva — F3·P4), **las fases de la carta** (qué unidad va de dónde a dónde, tareas tácticas, obstáculos y fuegos de cada fase), fuegos, barreras, medidas de control, riesgo y estado final. **B / C**: un subpárrafo por unidad con su tarea en cada fase (las de apoyo en C, con la Asignación de recursos). **D**: vigencia y coordinación de la Orden, medidas de control y ensayo (F6·SAL), puntos de decisión (F4·P4). **V**: comando y comunicaciones de la Orden. La situación va a «I.- SITUACIÓN» (A, B y C juntos) y lo que quedó guardado con un rótulo que la hoja no tiene pasa a su casilla y se borra |
| **🤖 Trabajar esta hoja con IA** | El pedido suma «LA ORDEN PREPARATORIA N° 3 ES CASI LA ORDEN DE OPERACIONES — DESARROLLÁ CADA APARTADO COMPLETO»: el Concepto es OBLIGATORIO y el más largo (no va en la Intención), qué va en cada apartado, usar las claves exactas; y «LO QUE YA TRABAJÓ EL G-3»: F3·P6, F3·P4, las fases de la carta, lo que hace cada unidad en cada fase, la F5·P1, la F4·P2, la F4·P4, la F4·SAL y la F6·SAL |
| **✓ Aplicar** | Lo que la IA dejó vacío (o no mandó) se llena con lo de 🌱 y el mensaje lo dice («La IA dejó vacío 1 apartado (…): se llenó con lo que ya tiene el G-3…»). La clave escrita con otras palabras entra en su casilla (sólo si hay UNA que corresponde) |
| **⚠️ avisos** | Sólo revisan las casillas que la hoja muestra. No avisan la «DIV MEC-1» si la Orden la nombra (el calificativo la distingue de la «DIV-1» propia) ni las divisiones que la Orden pone del lado enemigo («VI DE», «I DE»). El enemigo del aviso es la ficha roja de mayor escalón, con el escalón sacado de la designación si no está cargado |

La F2·P17 (O.P. N° 2) usa lo mismo; la F1·P7 (O.P. N° 1) sólo el reordenamiento (todavía no hay CAP).

## Archivos

- `v1/prep.mjs` — sin dependencias del compilado: `capAprobado`, `conceptoDelCAP`, `tareasPorUnidad`, `semillaPrep`,
  `ordenarHoja`, `trasIA`, `avisoTrasIA`, `claveParecida`, `bloquePrep`, `pedidoPrep`. Las fases en palabras salen de
  `cap-propios/v1/texto-carta.mjs` (`describirFases`); el nomenclátor y los catálogos de la carta, de
  `cartaParaDocumentos` de `cap-propios/v1/panel.js`.
- `cae-enemigo/v1/revisar.mjs` — el calificativo (`cal`) de cada formación, «VI DE», lo que la Orden dice del enemigo
  (`conocidas.ordenEnemigo`), el escalón por la designación y sólo las casillas visibles.
- En el compilado (`pruebas/reemplazos-2026-10-26-op3.js`, `index-op3-20261026.js`): los imports (panel.js y
  revisar.mjs con versión nueva), el 🌱 del Tablero del G-3, el pedido (`SIDdespues`), ✓ Aplicar y la clave parecida
  en `dU`.
- Pruebas: `pruebas/orden-preparatoria.mjs` (9 casos, con el texto de la O.P. N° 3 de Sergio) y
  `pruebas/e2e/orden-preparatoria.cjs` (en la Mesa).
