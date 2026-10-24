# 💡 Los cursos de acción propios que propone la Mesa — y los dos CAP en el mismo ejercicio

Lo pidió Sergio el 24-10-2026 con el CE-I en el AO LAUCA. El PMTD pide «al menos dos» cursos de acción propios que
cumplan los criterios de calidad, y en el Juego de Guerra «el Estado Mayor escoge el orden en el cual se someterán»
los CAP. La Mesa guardaba UNO solo. Pidió «que la aplicación sugiera y que lo lleve a la IA, o sea si es o no es lo
que estoy haciendo precisamente para este ejercicio… en este caso defensa móvil, pero lo que quiero más que todo es
construir la aplicación».

## En la Mesa

**Tablero del G-3 → 📄 Documentos → «3 · Desarrollar los cursos de acción propios» → F3·P6** (y también la F3·P4):

- **💡 La Mesa propone 2 cursos de acción propios para ESTE ejercicio**. Lee las fichas, las avenidas del CMOC, la
  Orden y lo que ya dice la F3·P4, y propone:
  - **CAP 1**: lo que ya dice el ejercicio (la forma de maniobra de la F3·P4 o la modalidad del A.O.). Con Sergio:
    *Defensa de área (tenaz), esfuerzo en la AA-1*: DIV MEC-2 esfuerzo principal sobre la AA-1, DIV-1 esfuerzo
    secundario, DIV-6 reserva, RAM-4 y GALM-1 con prioridad de fuegos al esfuerzo principal.
  - **CAP 2**: la forma que más se diferencia de ésa. Con Sergio: *Defensa móvil*: DIV MEC-2 retarda desde la LDE-1
    hasta la LPR en la LF «PUMA», DIV-1 fija, DIV-6 es la masa de contraataque.
  - Cada CAP dice **en qué se distingue EN LA CARTA** («se RETIENE el terreno» / «se CEDE terreno para destruir al
    enemigo») y trae sus **cinco fases** con lo que hace cada unidad en cada una.
  - La forma de cada CAP **se cambia** en su lista (defensa de área, móvil, de área con el esfuerzo en la otra
    avenida; en la ofensiva: ruptura, envolvimiento, desbordamiento; en la retrógrada: retardatriz, repliegue).
  - Avisa lo que falta: sin fichas de maniobra, sin avenidas, menos de tres unidades (no queda reserva), defensa
    móvil sin unidades mecanizadas o blindadas.
- **CAP 1 / CAP 2**: el que se toca pasa a ser el ACTIVO. Sus **fases 🔵**, su **F3·P4** y su **F3·P6** quedan donde la
  Mesa las busca siempre (por eso los documentos, el Word, la OPORD y el Juego de Guerra siguen funcionando con «el»
  CAP activo); el otro queda **guardado tal cual** y vuelve al elegirlo. También se cambia desde el
  **🎬 C.A. por fases** (los botones debajo de «🔵 Curso de acción PROPIO»).
- **🌱 Llevar el CAP a esta hoja** (F3·P6): llena SÓLO las casillas vacías, marcadas «[Mesa — verificar]».
- **🎬 Armar las 5 fases 🔵 del CAP**: cinco fases con el dispositivo de ahora; cada unidad lleva su tarea y su
  propósito de esa fase, y la del esfuerzo principal, la ★. **La Mesa no inventa lugares**: fase por fase se mueven
  las fichas a donde van. Si el CAP ya tenía fases, pregunta antes de reemplazarlas.
- **🤖 Trabajar esta hoja con IA** (F3·P6 y F3·P4): el pedido lleva «LO QUE PROPONE LA MESA PARA ESTE EJERCICIO» y la
  tarea de **decir si cada CAP SIRVE o NO para este ejercicio** con las cinco pruebas del PMTD (adecuado, factible,
  aceptable, distinguible, completo), proponer el reemplazo del que no sirva y desarrollar el CAP activo. El juicio
  va al principio de «Razón fundamental» (F3·P6) o de «Forma de maniobra elegida y por qué» (F3·P4).

## Cómo lee el ejercicio (`analizar`)

- **Tipo de operación**: el del Área de Operaciones (ofensiva, defensiva, retrógrada); si no tiene, la misión
  («ataca…» → ofensiva; si no, defensiva).
- **Unidad propia y sus unidades de maniobra**: la de la Orden (o la unidad considerada) y las fichas azules un
  escalón abajo que no son de apoyo; **móviles** = mecanizada, blindada, caballería. El **apoyo de fuegos** y los
  **ingenieros**, aparte.
- **Reserva**: con tres o más unidades de maniobra, la que está más lejos del frente (el frente del A.O. o las
  fichas rojas).
- **Avenidas**: las del CMOC; la principal es la de mayor escalón. Cada unidad de adelante mira a la más cercana.
- **LF «…», LDE-n y la hora D**: de la Orden y de la F3·P4 / F3·P6.

## Dónde se guarda

`g3._caps = { activo: 1 | 2, formas: { 1, 2 }, guardados: { <el otro>: { fases, coa, concepto } } }`. El expediente
de la IA no lo lee (sólo las hojas conocidas). Las piezas del concepto que están EN LA CARTA (obstáculos, fuegos) son
del calco y no cambian con el CAP.

## Archivos

- `v1/proponer.mjs` — sin dependencias: `analizar`, `proponer`, `armarCAP`, `bloqueIA`, `pedido`, `cambiarCAP`,
  `conForma`, `conFormas`, `fasesPorCAP`, `llevarAHoja`, `armarFases`, `accion`.
- `v1/panel.js` — el panel (React por `configurarCAP`) y `botonesCAP` del 🎬 C.A. por fases.
- En el compilado (`pruebas/reemplazos-2026-10-24-cap-propios.js`): el import, `configurarCAP`, `SIDcapAcc` en la
  Mesa (las fases, el G-3, la fase activa, el candado de la BASE), el panel en la F3·P6 y la F3·P4, los botones del
  🎬 C.A. por fases y el pedido de la IA (por `SIDdespues` de la caja de la IA).
- Pruebas: `pruebas/cap-propios.mjs` y `pruebas/e2e/cap-propios.cjs`.
