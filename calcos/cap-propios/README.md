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
- **FASE I, II, III…** en cada CAP (24-10-2026, Sergio: «CAP 1 fase I se le da clic y se ven las fichas donde están…
  así como muestra en la del enemigo»): tocar una fase la pone en la carta, como en el 🎬 C.A. por fases (cada ficha
  donde está en esa fase, sus tareas, obstáculos y fuegos); la que está a la vista se marca en azul. Si la fase es del
  CAP guardado, la Mesa primero cambia de CAP. Un CAP sin fases todavía dice cómo armarlas.
- **🌱 Llevar el CAP a esta hoja** (F3·P6): llena SÓLO las casillas vacías, marcadas «[Mesa — verificar]».
- **🎬 Armar las 5 fases 🔵 del CAP**: cinco fases, **cada una con su dispositivo**, y se mueven **TODAS las fichas
  propias** (`v1/posiciones.mjs`, 24-10-2026; Sergio: «en la fase I todos están donde está el CE y de ahí se
  disgregan… en la fase dos hacia los lugares donde hay trabajos (el plan de barreras), quienes hacen esos trabajos son
  ellos dentro de su sector… en la fase 3 donde están ya sus posiciones»):
  - FASE I: todas juntas con el CE (alrededor de su PC);
  - FASE II: cada una a los trabajos del plan de barreras de SU sector (los obstáculos del calco más cerca de su puesto
    que la «LÍM. … / …» entre sectores no separa); la reserva, la masa y el apoyo no hacen obras: van a mitad de camino;
  - FASE III: cada una en su puesto: donde la puso el oficial (la ficha ya desplegada, o lo que quedó en la FASE III
    del CAP). Si la ficha todavía está junto al CE, la Mesa la lleva a su lugar con lo que dejó la F3·P4 (las marcas
    «ESFUERZO PRINCIPAL · …», «ESFUERZO SECUNDARIO · …», «RES · …», o donde su avenida corta la LPR). La fuerza de
    retardo (LDE-1) y la masa de contraataque (zona de reserva) las pone siempre la Mesa;
  - FASE IV y V según la forma (la reserva contraataca por el EJE CA; en la defensa móvil el retardo va de la LDE-1 a
    la LPR y la masa contraataca entre las dos).
  Cada unidad del CAP lleva su tarea y su propósito, y la del esfuerzo principal, la ★. El puesto queda en la ficha
  (`puesto`): armar de nuevo con otra fase a la vista da lo mismo, y lo que el oficial corrigió en la FASE III es el
  puesto nuevo. Si el CAP ya tenía fases, pregunta antes de reemplazarlas. Si en las fases de un CAP hay fichas que no
  se mueven (armadas antes), el panel las nombra.
- Las agrupaciones de la organización para el combate (OD, OC 1, OC 2, RES…) no son unidades del CAP (la RES ya no sale
  como «apoyo de fuegos»): en las fases hacen lo de la unidad del CAP de la que salen sus piezas; si no, lo de su
  operación (la OD, el esfuerzo principal; las OC, los otros esfuerzos; la RES, la reserva). Si no hay otras fichas de
  maniobra, el CAP se arma con ellas.
- Los roles salen de la carta: si la F3·P4 marcó «RES · DIV-6» o «ESFUERZO PRINCIPAL · DIV MEC-2», ésos mandan (no
  cambian según la fase que esté a la vista).
- La IA: lo que no nombra (o nombra sin un lugar de la carta) sigue a la Mesa fase por fase; si nombra un lugar que no
  está en la carta, la unidad va donde la pone la Mesa en esa fase.
- **🤖 Trabajar esta hoja con IA** (F3·P6 y F3·P4): el pedido lleva «LO QUE PROPONE LA MESA PARA ESTE EJERCICIO» y la
  tarea de **decir si cada CAP SIRVE o NO para este ejercicio** con las cinco pruebas del PMTD (adecuado, factible,
  aceptable, distinguible, completo), proponer el reemplazo del que no sirva y desarrollar el CAP activo. El juicio
  va al principio de «Razón fundamental» (F3·P6) o de «Forma de maniobra elegida y por qué» (F3·P4).

## 🤖 La IA desarrolla los dos CAP EN LA CARTA (24-10-2026, `v1/carta-ia.mjs`)

Sergio: «tú me los propones los dos con sus fases (con ayuda de la IA: la aplicación me genera el prompt con toda la
situación y la IA me lo genera, yo lo pego y se coloca en la mesa); puedo yo aquí mover fichas, tareas, fuegos,
barreras… y concreto los dos cursos de acción en la mesa».

En el mismo panel, **«🤖 La IA desarrolla los dos CAP EN LA CARTA»** (la caja de la IA de la Mesa: copiar, abrir en
Claude / ChatGPT / Gemini, tamaño, tu indicación, pegar y ✓ Aplicar):

- **El pedido** lleva el expediente completo, la propuesta de la Mesa y **las piezas de la carta**: las unidades
  propias y enemigas con su designación EXACTA y dónde están hoy («a 6 km de Macaya»), los **lugares de la carta**
  (el nomenclátor de los calcos y el terreno clave del CMOC dentro del A.O. y 30 km alrededor) con sus coordenadas,
  las A.I.N., las avenidas y los catálogos de **tareas tácticas** y **obstáculos** de la Mesa. La IA contesta un JSON:
  el juicio de los dos CAP y, para cada CAP, cinco fases con a qué lugar va cada unidad, qué tarea táctica se pone
  (dónde y hacia dónde) y qué obstáculos (dónde; las líneas, de dónde a dónde), y el enunciado de su F3·P6.
- **Al aplicar**: se arman las fases 🔵 de los DOS CAP. En cada fase, cada unidad está donde dijo la IA (las que no
  nombra quedan donde estaban en la fase anterior); las tareas tácticas son de esa fase; los obstáculos se acumulan
  (lo construido queda). El CAP activo queda a la vista (su FASE 1 en la carta); el otro, guardado. La F3·P6 de cada
  CAP se llena SÓLO en lo vacío (lo que había propuesto la Mesa con «[Mesa — verificar]» sí se reemplaza) y el juicio
  va a «Razón fundamental». Si ya había fases, pregunta antes de reemplazarlas.
- **La respuesta se lee aunque venga con los errores de siempre** (`v1/json-tolerante.mjs`, 24-10-2026: a Sergio le
  decía «No se reconoció la respuesta»): comillas rectas dentro de un texto (`"GAAP N° 4 "MIRAFLORES""`), comas de más,
  comentarios, saltos de línea crudos, comillas tipográficas, texto antes y después, los dos CAP en dos bloques ```json
  o como «CAP 1» / «CAP 2», y la respuesta CORTADA (se coloca hasta donde llegó y se avisa). Si igual no se puede, dice
  dónde se rompe el JSON.
- **Lo que no se pudo** lo dice («la unidad «DIV-7» no está en las fichas», «Cerro Comanchi no está en la carta;
  quedó donde estaba»): la Mesa no inventa lugares.
- Los **fuegos** también: la IA pone las concentraciones de cada fase (tipo de fuego, efecto, lugar y el medio que la
  bate) y cada fase queda con su plan de fuegos (ver abajo).

## 🔥 Los fuegos por fase (24-10-2026)

El plan de fuegos (🔥 Fuegos, `planFuegos`) era uno solo para todo el ejercicio. Ahora **cada fase 🔵 del C.A. propio
guarda el suyo**, como ya guardaba las fichas y el calco:

- Al **dejar** una fase propia, su plan de fuegos queda guardado en la fase (con las fichas y el calco).
- Al **tocar** una fase propia que tiene plan, vuelve su plan. Una fase que **no tiene** (las de antes, o una «＋ Fase»
  nueva) se queda con el plan que está a la vista: lo ya hecho no cambia hasta que se tocan los fuegos en una fase.
- La IA de los dos CAP pone las concentraciones de cada fase: el plan de la fase es el de la Mesa más las de esa fase
  (numeradas AB-0xx después de las que hay, con «lo bate RAM-4 — para…» en la descripción). El medio exacto (pieza y
  posición de fuego) se elige en 🔥 Fuegos.

## 📝 El texto de la F3·P6 sale de la carta (24-10-2026, `v1/texto-carta.mjs`)

- **📝 Llevar la carta a la F3·P6 de los dos CAP** (en el panel de la F3·P6): lee las fases 🔵 del CAP activo y las del
  guardado y escribe, al final de las casillas QUIÉN, CUÁNDO, DÓNDE, CÓMO y Bosquejo, el bloque
  «— Según la carta (fases 🔵):» — fase por fase, qué unidad va de dónde a dónde (con los lugares de la carta: «de
  Turco a Macaya», «a 7 km al O de Julo»), con qué tarea, las tareas tácticas, los obstáculos nuevos y los fuegos nuevos
  de cada fase. Lo que escribió el oficial (o la IA) queda arriba sin tocar; si se vuelve a apretar, el bloque se
  reemplaza.
- El pedido de **🤖 Trabajar esta hoja con IA** de la F3·P6 y la F3·P4 lleva «LO QUE YA ESTÁ EN LA CARTA — CAP n, fase
  por fase»: el texto tiene que describir eso; si no coincide con la propuesta, manda la carta.

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
- `v1/carta-ia.mjs` — `piezas` (el nomenclátor y el ubicador de la F3·P4), `pedidoCarta`, `leerRespuesta` (con los
  fuegos de cada fase).
- `v1/posiciones.mjs` — `referencias` (la LPR, la LDE-1, el EJE CA, la LÍM. entre sectores, las marcas de la F3·P4,
  el PC), `trabajos` (el plan de barreras), `movibles` (las fichas que se mueven) y `posicionesCAP`.
- `v1/json-tolerante.mjs` — `leerJSON`, `reparar`, `cerrar` (sin dependencias).
- `v1/texto-carta.mjs` — `describirFases`, `textoDeLaCarta`, `conBloqueCarta`, `hojaConCarta`, `bloqueCartaIA`.
- `v1/panel.js` — el panel (React, la caja de la IA `hU` y los catálogos por `configurarCAP`) y `botonesCAP` del
  🎬 C.A. por fases.
- En el compilado (`pruebas/reemplazos-2026-10-24-cap-propios.js`): el import, `configurarCAP`, `SIDcapAcc` en la
  Mesa (las fases, el G-3, la fase activa, el candado de la BASE), el panel en la F3·P6 y la F3·P4, los botones del
  🎬 C.A. por fases y el pedido de la IA (por `SIDdespues` de la caja de la IA).
- En el compilado (`pruebas/reemplazos-2026-10-24-cap-carta.js`): la caja de la IA y los catálogos al panel,
  `setOps` y el candado del ejercicio finalizado en `SIDcapAcc`, y el expediente al panel.
- En el compilado (`pruebas/reemplazos-2026-10-24-fuegos-fase.js`): `fo` guarda el plan de fuegos en la fase propia,
  `Uo` lo devuelve, `SIDcapAcc` recibe `setPlan` y el pedido pasa por `pedidoCAP` de `panel.js`.
- Pruebas: `pruebas/cap-propios.mjs`, `pruebas/cap-carta.mjs`, `pruebas/cap-texto.mjs`, `pruebas/json-tolerante.mjs`, `pruebas/cap-posiciones.mjs` (con la respuesta de ejemplo
  `pruebas/cap-carta-ejemplo.js`), `pruebas/e2e/cap-propios.cjs`, `pruebas/e2e/cap-carta.cjs` y `pruebas/e2e/fuegos-fase.cjs`.
