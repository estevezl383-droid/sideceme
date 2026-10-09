# Cambios hechos directamente sobre el compilado de la Mesa del EM

El código fuente de la Mesa del EM (Vite/React) no está en este repositorio:
`calcos/assets/index-*.js` es el compilado. Los cambios de abajo se hicieron
sobre ese compilado. **Si se vuelve a compilar desde el fuente, hay que pasarlos
al fuente o se pierden.**

## 2026-10-06 (3) — 🧭 F3·P3 Formación inicial de las fuerzas, en orden y sobre el terreno (`index-organizacion-20261006.js`)

Parte de `index-prc-20261006.js`: trae todo eso y suma esto. Lo pidió Sergio con capturas de la
F3·P3 «Organización inicial de las fuerzas», del calco de la Mesa, del calco de la Escuela (las
tareas con OD / OC 1 / OC 2 / OC 3 y los triángulos al lado), de la Organización de la Tarea en
forma gráfica y del panel 🧩: el ejercicio se había hecho fuera de orden y quería que la hoja
lleve el orden de la doctrina («3.- Formación inicial de las fuerzas»): con el CAE más probable y
los objetivos, las tareas tácticas en la carta; su operación (OD, OC…); las unidades genéricas
(triángulos y cuadrados) de lo que tiene, sobre el terreno; la forma gráfica; y recién ahí la
Organización de la Tarea. La lista EXACTA está en
`calcos/pruebas/reemplazos-2026-10-06-organizacion.js` (13); `construir-organizacion.js` arma el
compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también lo
comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué pasaba

- La hoja era un cuadro de cuatro columnas sin la carta, sin proporciones calculadas y sin
  vínculo con la Organización de la Tarea; 🌱 la llenaba con cada unidad con su NOMBRE (lo
  contrario de la doctrina: unidades genéricas, sin nombres propios todavía).
- Las tareas tácticas de la carta no tenían operación (OD / OC) ni sabían con qué se cumplían.
- Al consolidar en el panel 🧩, las fichas iban al centro de la vista, no al terreno.

### Qué se tocó en el compilado (13 reemplazos)

- `import` del módulo nuevo (`calcos/organizacion/v1`: `editor.js`, `runtime.js`, `carta.js`),
  justo después de los de la logística (sin partir lo que insertaron otras listas).
- La hoja `organizacion` (F3·P3): «Formación inicial de las fuerzas», las columnas
  «Operación · Agrupación / unidad genérica · Tarea que cumple · Enemigo en su sector ·
  Proporción requerida… · Relación de comando», nota nueva. La guía 📘: la doctrina.
- 🌱 `l3e` caso `organizacion` → `SIDOIFilas` (el cuadro sale de la carta; sin tareas con
  operación no inventa nada).
- `wLe` (Tablero del G-3): para la F3·P3, `SIDEditorOrgInicial` (los pasos) y debajo el cuadro de
  siempre (`yU`); `onG3` con función (sin pisar cambios seguidos).
- `Sze`: el estado `modoOI` (mientras se coloca una tarea tocando la carta la Mesa está
  «dibujando»: `dibujando:gp||modoOI`); al Tablero del G-3 le llegan `cmoc` y `SIDdn` (las
  unidades SIN descontar las piezas consolidadas: con las descontadas los id de las piezas no
  coinciden con los del panel 🧩); el efecto `SIDOISync` (la capa de la carta y lo que necesita
  para cambiar el calco: `setOps`, `setG3`, deshacer, `setOrgTarea`, `setUnidades`, `irA`).
- `_a` (consolidar en el panel 🧩): la ficha de una agrupación que salió de la F3·P3 va junto a
  su tarea (`SIDOIPos`); las demás, como siempre.
- `SIDOIConfig`: React, `eN`, `cb`, `tN`, `js`, `lP`, `zg` y Leaflet, antes del primer render
  (justo antes del `configurarEM` del G-5, sin partirlo).
- `Aoe` («📄 Word (hoja de trabajo)»): para la F3·P3, `SIDOIWord` — apaisado, el cuadro como
  TABLA (antes, como en todas las hojas «filas», salía en renglones de texto) y la
  Organización de la Tarea en forma gráfica (un SVG que `preparar` convierte en imagen).
- `wLe` (👁️ Vista previa): `SIDOIPrevia` pone la forma gráfica debajo del cuadro.

### En el fuente

- `calcos/organizacion/v1/` no toca React del compilado más que por `runtime.js`. Ver
  `calcos/organizacion/README.md` (los pasos, dónde se guarda cada cosa, qué es doctrina y qué
  es criterio de la Mesa).
- En el fuente de la Mesa: la hoja, la guía y el caso de `l3e`; la rama de `wLe`; `modoOI`,
  `cmoc`/`SIDdn` y el efecto en `Sze`; la posición en `_a`; la configuración del módulo.

### Cómo se comprobó

- `node organizacion.cjs` (10): con `tN`, `lP`, `js`, `zg` y `l3e` REALES del compilado; las
  proporciones y la propuesta según la operación; los escalones y las genéricas del enemigo; el
  balance (la OD primero, lo requerido, lo que sobra, la deficiencia); el reparto y mover piezas
  (una pieza en un solo lugar); el cuadro y la forma gráfica con «bajo control»; la
  Organización de la Tarea (crea, reusa la de la misma operación con su nombre y su propósito,
  no duplica, no repite piezas, actualiza las fichas consolidadas); partir de lo ya armado;
  🌱; los reemplazos, y que ninguno parte lo que insertaron las 258 entradas de las listas
  anteriores.
- `node e2e/organizacion.cjs` (Chromium): en escritorio, los siete pasos tocando la carta (OD,
  OC 1, OC 2, OC 3), el reparto, los rótulos en la carta y en el 3D, la forma gráfica, el panel
  🧩 con las agrupaciones hechas, la ficha de la OD junto a su tarea, el cuadro y el guardado;
  en el teléfono, la hoja sin desborde y «⬅️ Partir de lo que ya armé» con la Organización de
  la Tarea armada antes (como en la captura) y el cuadro viejo.
- `npm test` entero. Las e2e de la PRC, el plan de fuegos, el estudio, el reconocimiento y el
  tablero del G-4 con este compilado.

### Segunda vuelta (lo que faltaba)

- **Sin tocar la carta**: en el teléfono la carta queda tapada por las barras de la Mesa. La
  tarea nueva se pone «🎯 en Oa / Ob…» o «⊕ en el centro de la vista»; cada tarea tiene
  «📍 Mover» y «→ Oa / → el centro de la vista». En una pantalla angosta (tableta parada), al
  tocar la carta el panel se esconde y vuelve solo.
- **El Word y la vista previa** llevan la forma gráfica (y el cuadro como tabla, apaisado).
- **«2 compañías genéricas», «1 compañía genérica», «3 batallones genéricos»** (concordancia).
- **La capa de la carta** ya no se rehace en cada cambio del calco: sólo si cambió lo que
  dibuja (y sin tareas con operación no agrega nada a la carta).
- **Pruebas que fallaban desde la edición de figuras (03-10-2026)**, con este compilado y con
  el anterior (se comprobó: con `index-trazos-20261003.js` pasaban, con
  `index-edicion-20261003.js` ya no). No era la Mesa: las pruebas no se habían puesto al día
  con lo que esa vuelta cambió A PROPÓSITO:
  - `e2e/plan-fuegos.js`: un área se elige tocando su BORDE (no el relleno) y el rótulo dice
    «✋ Arrastrá un punto…». Ahora toca el borde.
  - `e2e/trazos.cjs` (15 casos): con una herramienta encendida y sin trazo en curso, tocar una
    figura ya dibujada la ELIGE (Alt + clic la atraviesa); la prueba trazaba todo encima de lo
    anterior, sobre los mismos tres puntos. Ahora cada trazo va en su propio lugar libre de la
    carta (elegido en la pantalla, en 2D y en el 3D inclinado) y en una pantalla más grande.
  - `e2e/plan-barreras-3d.js`: el toque largo (el clic derecho del dedo) ya no TERMINA la línea:
    borra el último punto. La prueba ahora comprueba eso y termina con el doble toque, en un
    lugar libre (no encima de la alambrada del caso anterior).
  - `e2e/tablero-g4.cjs`: a veces el globo de la instalación se cerraba solo (la Mesa se volvía
    a dibujar) y la prueba esperaba 30 s el botón; ahora vuelve a tocar la instalación.
- Probado en un iPad parado (820×1180) y acostado (1180×820) con el dedo.

### Tercera vuelta (09-10-2026): varias tareas, orientadas; las fuerzas por tipo; la OD y las OC al final

Sergio, con capturas del calco (una «Seguir y asumir» que tenía que apuntar al otro lado), de
la tarjeta de la tarea y del cuadro de la organización de la Orden (RCB-1 «CALAMA», RCB-2,
RIM-8 «AYACUCHO», RIM-23 «MAX TOLEDO», RIAT-30, RAM-2, RAA-6, BATING., BAT. LOG., BAT. COM.,
COMP. ICIA., la Comp. Av. Ejto. bajo control):

- **La orientación de cada tarea**: «↺ 15°», «↻ 15°», «↻ 90°», «⇄ Al otro lado» y los grados,
  en la tarea nueva (antes de colocarla) y en cada una ya puesta; el símbolo gira en la carta
  (y en el 3D y el KMZ, que ya usaban `rot`).
- **Varias tareas tácticas**: se colocan todas las que hagan falta («➕ Otra tarea táctica (la
  T2)»), SIN operación todavía: se llaman T1, T2… (en la carta, con su rótulo gris). La que ya
  estaba en el calco (la del análisis de la misión) entra también; «🚫 No entra» la saca y
  «↩» la vuelve a poner.
- **③ Las fuerzas de cada tarea**: el enemigo de su sector, la proporción y **cuántas de cada
  tipo** —caballería, infantería, artillería, ingeniería, comunicaciones, logística…— con
  «−» y «+» (la Mesa elige la pieza de la misma unidad, para no partirlas) y de qué unidad
  salen; quedan junto a su tarea en la carta. La reserva, igual. «⚡ Proponer el reparto de la
  maniobra» completa lo que falta para la proporción.
- **④ Recién entonces la OD y las OC** (hasta la OC 5, y SOST): botones en cada tarea; si la
  operación ya la tiene otra, se intercambian («🔁 OD pasó a T1; T4 quedó como OC 1»). «✨
  Proponer»: la OD donde más fuerzas hay y las demás OC en el orden en que se colocaron. La
  Organización de la Tarea pide que estén todas designadas.
- **«📄 Traer las unidades de la Orden»** (pasos ① y ③): lee el cuadro de la organización de
  un documento del ejercicio (o lo que se pegue): la sigla, el nombre entre comillas, el arma y
  el escalón por la sigla (RIM = infantería mecanizada, RCB con Tq = blindada, RAA =
  antiaérea, BATING = ingeniería, COMP. ICIA = inteligencia…) y cuántas subunidades de combate
  tiene (sin la de comando ni la de C y S). Se revisa (lo dudoso dice ⚠️: el RIAT, ¿aerotrans-
  portado o antitanque?) y quedan como fichas en la carta, sin repetir las que ya están. Si no
  hay infantería en el calco, la Mesa lo avisa.
- Compilado (`reemplazos-2026-10-06-organizacion.js`, mismo `index-organizacion-20261006.js`):
  OC 4 y OC 5; la artillería **antiaérea se disgregaba como INFANTERÍA** (no tenía pieza) →
  ADA; la pieza y el arma **Inteligencia** (ICIA); `escalonPiezas` (el BAT. LOG. o el BATING. de
  la Orden tienen compañías, no secciones); los documentos del ejercicio llegan a la hoja.
- Como después se armaron las áreas (`index-areas-20261008.js`) y los frentes
  (`index-areas-20261009.js`, el vigente) ENCIMA de este compilado, se rehicieron con sus mismas
  listas (`construir-organizacion.js` ahora lo hace solo) y se actualizaron sus «anterior» en
  `reemplazos-compilado.js`; `calcos/index.html` sigue cargando `index-areas-20261009.js` (con
  `?v=frentes-f3p3-20261009`, para que el navegador no use el de antes).
- `edicion-figuras.cjs` no arrancaba desde los frentes (`SIDdT is not defined`): ahora carga
  `SIDdT` y `SIDkm`. Queda un caso de los frentes que no es de esta hoja: con el cuadro nuevo,
  un Área de 10,6 km de frente en defensiva ofrece División y Cuerpo (la prueba espera sólo
  Cuerpo).

### Lo que falta

- No se probó con un ejercicio real ni en un iPad de verdad (sí en Chromium con su tamaño y
  con toque).
- La lectura del cuadro de la Orden depende de cómo salga el texto del PDF o del Word: si las
  columnas salen mezcladas, las subunidades no se reparten (cada unidad queda con 3 piezas y
  ⚠️ para revisar).

## 2026-10-06 (2) — PRC: la tarea y el formato también AL PRINCIPIO del pedido (sin cambiar el compilado)

Sergio pegó la respuesta entera de Gemini: un análisis METT-TC/OCOKA y «Conclusiones y
decisiones de Estado Mayor» del expediente, sin ninguna fila de la hoja, y otra vez «¿Desea
que profundicemos…?». Con un expediente largo, Gemini (sobre todo cuando convierte lo pegado en
un archivo adjunto) lee el principio —el rol de oficial del G-3 y la Orden— y «analiza el
documento»: la tarea y el formato estaban recién al final.

- `estado-mayor/v5/prc.js`: el pedido de la PRC EMPIEZA con «Sos OFICIAL DE ESTADO MAYOR… ESTO
  ES UN PEDIDO, NO UN DOCUMENTO PARA ANALIZAR NI RESUMIR», «TU ÚNICA TAREA» (el cuadro, el
  JSON, lo que NO hay que escribir: análisis METT-TC u OCOKA, conclusiones, la Orden, anexos,
  la matriz, preguntas); el expediente va entre «===== INICIO / FIN DEL EXPEDIENTE =====» como
  DATOS; al final, después del formato, «ANTES DE ENVIAR, revisá…». Lo demás del pedido no
  cambió.
- `errorRespuesta`: una respuesta LARGA que no se pudo leer dice «La IA no escribió esta hoja:
  escribió otra cosa…» y las dos causas (chat que venía hablando de otra cosa → chat nuevo;
  pedido convertido en archivo → escribir debajo «Cumplí el pedido del archivo: contestá SÓLO
  con el bloque JSON del final»). Vale para todas las hojas.
- El compilado no cambió (los módulos de `v5/` se bajan de nuevo cuando vence su caché).
- `prc.cjs` (19) y `e2e/prc.cjs` (escritorio y teléfono, con la respuesta fuera de tema de
  `prc-ejemplo.js`) pasan; `npm test` entero.

## 2026-10-06 — ⚔️ F3·P1 Potencia Relativa de Combate con el formato de la Escuela (`index-prc-20261006.js`)

Parte de `index-tablero-g4-20261003.js`: trae todo eso y suma esto. Lo pidió Sergio con una
captura de la F3·P1 del G-3: «Completar y mejorar» con la indicación de las fases («ocupación de
la defensa, otra fase de desorganización, otra de canalización y finalmente una de canalización
y destrucción»); la IA contestó con una Orden General de Operaciones y una matriz de
sincronización, cerró con «¿Desea que profundicemos…?», y al pegar ese final la Mesa dijo «No se
reconoció la respuesta». Mandó el modelo de la Escuela (`01._HT._POTENCIA_RELATIVA_DE_COMBATE_1.docx`),
un ejemplo llenado y el texto doctrinario (Pasos 1, 2 y 3), y pidió que la hoja tenga ese formato
y que la Mesa arme un pedido que saque una buena respuesta con los documentos y los calcos. La
lista EXACTA está en `calcos/pruebas/reemplazos-2026-10-06-prc.js` (11); `construir-prc.js` arma
el compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también lo
comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué pasaba

- **La hoja no era la de la Escuela**: «Sistema operativo / PROPIAS / ENEMIGO / Relación y
  deducción» con ocho sistemas operativos (maniobra, apoyo de fuegos, defensa antiaérea,
  movilidad…), sin la columna de las TTP y sin el método (puntos fuertes y débiles →
  deducciones → TTP). La guía hablaba de «sistema por sistema» y de la relación numérica.
- **El pedido** no traía la doctrina de la PRC, pedía casillas con claves como
  «MANIOBRA|ENEMIGO», llevaba «BUSCÁ EN LA WEB» (que para un enemigo supuesto no sirve) y, en el
  G-3, no terminaba con «FORMATO DE TU RESPUESTA» (la v4 lo puso en las hojas de las secciones;
  el panel del G-3 arma su pedido aparte y había quedado afuera). Lo último y más concreto que
  leía la IA era la indicación de las fases: escribió la operación entera.
- **La respuesta**: una hoja «tabla» se leía como casillas sueltas. Si la IA contestaba con la
  tabla, todas las columnas caían en la primera (o nada); un JSON por fila
  (`{ "MANIOBRA": { … } }`) escribía «[object Object]».
- **El error** no decía que lo pegado era sólo la pregunta final de la IA.
- **«📄 Word (hoja de trabajo)»** salía como renglones «MANIOBRA — PROPIAS: …», no como el cuadro.
- En la Mesa, el primer casillero de cada fila de una hoja «tabla» no tenía ni rótulo ni
  placeholder: «Fuerzas enemigas» quedaba sin nombre.

### Qué se tocó en el compilado (13 reemplazos)

- Los tres `import` del motor pasan a `../estado-mayor/v5/` y el de `registro.js` presta además
  `pedidoG3`, `tablaDeRespuesta`, `migrarG3`, `errorRespuesta` y `wordPRC`.
- La hoja `potencia` del G-3 (`ev`): columnas «Potencia de combate · Fuerzas enemigas · Fuerzas
  propias · Deducciones · Tácticas, técnicas y procedimientos (TTP.)», filas «MANIOBRA · POTENCIA
  DE FUEGO · PROTECCIÓN · LIDERAZGO · INFORMACIÓN E INTELIGENCIA» (las del .docx), nota nueva.
- La guía `potencia` (la de `ese`): la de `prc.js` (los Pasos 1, 2 y 3).
- 🌱 `l3e` caso `potencia`: unidades enemigas y propias con sus nombres, la relación de fuerzas
  y el avance (EAA-15-25), el apoyo de fuegos de cada bando con su mayor alcance y quién supera a
  quién, el plan de barreras y la ingeniería, el reconocimiento de cada bando — en las claves
  nuevas.
- `wLe` (panel del G-3): `onPedido` pasa por `SIDEMPedidoG3` (con el expediente, el modo, la
  semilla de 🌱 y lo del G-2); la prop `g3` pasa por `SIDEMMigrarG3` (lo escrito con la forma
  vieja se ve y se guarda con la nueva); «🔎 Lo que entregó el G-2» también en la PRC.
- `dU`: después de leer el JSON, `g=SIDEMTabla(g,e)` (una hoja «tabla», venga como venga, a sus
  casillas). Lo que no es JSON lo lee `rescatarHoja` del motor (la tabla, la copiada de la
  pantalla, los títulos por fila).
- `hU` («✓ Aplicar», todas las hojas y documentos): el error pasa por `SIDEMError` con lo pegado.
- `Aoe`: `potencia` → `SIDEMWordPRC` (el .docx de la Escuela).
- El editor de las hojas «tabla»: el nombre de la columna arriba de cada casillero (y el
  placeholder en el primero).

### En el fuente

- `calcos/estado-mayor/v5/prc.js` no toca React: la hoja, la guía, el pedido, la migración, el
  aviso y el Word (`docxPRC` arma el .docx con XML y un ZIP sin comprimir; `bajarWordPRC` lo baja).
- `lector.js` (v5): `leerTablaHoja` y `normalizarTabla` sirven para cualquier hoja «tabla».
- En el fuente de la Mesa: la hoja y la guía de `potencia`, el caso de `l3e`, los ganchos de
  `wLe`, `dU`, `hU` y `Aoe`, y los rótulos del editor de las hojas «tabla».

### Cómo se comprobó

- `node prc.cjs` (18): con `VM`, `ese`, `l3e`, `cU`, `dU`, `Boe`, `sP`, `KS` y `Aoe` REALES del
  compilado; la hoja y la guía, la migración, 🌱, el pedido (expediente, calco, G-2, aportes,
  doctrina, columnas, fases, ejemplo, «qué no hacer», el formato al final y después la
  indicación), sólo completar, las demás hojas del G-3 con el formato al final, la respuesta en
  JSON por fila / en lista / plano / tabla de Markdown / tabla copiada / por títulos, sólo
  completar no pisa, el error con lo pegado de la captura, el Word (partes del ZIP, carta
  apaisada, márgenes, título, cabecera, anchos del modelo, sin la marca de la IA, pie), los
  reemplazos y que ningún gancho cae dentro de lo que insertaron las listas anteriores.
- `node e2e/prc.cjs` (Chromium, escritorio y teléfono): la hoja y la guía, lo viejo migrado, 🌱,
  el pedido con «Completar y mejorar» y la indicación de las fases, lo pegado de la captura (el
  aviso), la respuesta (20 celdas), la vista previa, el Word bajado de la Mesa y el guardado.
- El Word se miró con `ver-docx.cjs` (docx-preview) al lado del .docx de la Escuela: igual. En el
  entorno LibreOffice no abre ningún .docx (tampoco el de la Escuela): no se probó con Word ni
  con LibreOffice.
- `npm test` entero. `tablero-g4.cjs` fijaba el nombre del compilado vigente: ahora comprueba
  que el vigente trae sus cambios. `estado-mayor.cjs` y `respuestas-hojas.cjs` pasan el gancho
  nuevo de `dU`. Las e2e de `personal`, `g5`, `riesgo`, `reconocimiento` y `conceptos` pasan
  con este compilado (escritorio y teléfono).

### Lo que falta

- Las hojas «Aporte de G-x a la potencia relativa de combate» de las otras secciones quedaron
  como estaban (van al pedido de la PRC). Si la Escuela quiere que cada sección llene también el
  cuadro de cinco columnas, es otro cambio.
- No se probó con una IA real ni en un iPad.

## 2026-10-03 (8) — 📊 Tablero G-4 de la instalación y 🎯 propuesta del ASDI con la PICB (`index-tablero-g4-20261003.js`)

Parte de `index-edicion-20261003.js`: trae todo eso y suma esto. Lo pidió Sergio: la ficha de
la instalación era puro texto; quiere ver a qué unidades apoya (la FT TORREZ), cuánta gente y
vehículos, cuánto consumen en la defensa (munición incluida), cuántos vehículos y con qué
frecuencia, en gráficos y números; y que la Mesa proponga dónde va el ASDI con la PICB. La
lista EXACTA está en `calcos/pruebas/reemplazos-2026-10-03-tablero-g4.js` (4);
`construir-tablero-g4.js` arma el compilado y comprueba que deshaciéndolos se vuelve byte por
byte al anterior (también lo comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué se tocó en el compilado (4 reemplazos)

- `import SIDFichaInstalacion` apunta a `../fichas-instalacion/v2/tablero.js` (el tablero) en
  vez de la ficha documental v1 (mismas props).
- `SIDLogSync` recibe además `cmoc: Jt`, la acción `agregarOps: xm` (agregar un área al calco
  como si se trazara, con su magnitud) y `portal: Ife.createPortal` (la propuesta «en grande»
  va en `<body>`: el panel del G-4 recorta lo `position: fixed`). Dependencias `+ Jt, xm`.
- El globo de la instalación: el botón dice «📊 ABRIR TABLERO G-4» y lleva un `<div>` que se
  llena al abrirse (`popupopen` → `window.SIDResumenInst(id, div)`, lo define el tablero).
- El clic en la instalación manda `sideceme:instalacion-tocada` en vez de abrir la ficha: en
  2D se ve el globo; el tablero lo abre su botón (o, si ya está abierto o se está en 3D, el
  tablero pasa directo a esa instalación).

### En el fuente

- `planeamiento.js`, `asdi-picb.js` y `graficos.js` no tocan React ni Leaflet: van tal cual.
- El tablero recibe React por props (como la v1) y lee el calco con `useCalco()` del módulo de
  logística; en el fuente conviene pasarle `ops` y `cmoc` por props.

### Cómo se comprobó

- `node tablero-g4.cjs` (13) y `npm test` entero.
- `node e2e/tablero-g4.cjs` (escritorio y teléfono, Chromium; 3D en escritorio), `e2e/logistica.cjs`,
  `e2e/ejes.js`, `e2e/ejes-fichas.js`, `e2e/asdi.js`, `e2e/edicion.cjs`, `e2e/trazos.cjs`,
  `e2e/conceptos.cjs` y `e2e/riesgo.cjs`.
- `e2e/asdi.js` fallaba en 3D desde el paso (7): trazaba el segundo ASDI encima del primero y
  el primer clic, sobre el borde, seleccionaba el área vieja (es lo que pide el paso 7; Alt +
  clic atraviesa). La prueba ahora traza el segundo al lado; la Mesa no cambió por esto.

### Lo que falta

- No se probó en un iPad real; en Safari la imagen puede bajar como `.svg`.

## 2026-10-03 (7) — ✏️ Las figuras se editan como en Google Earth (`index-edicion-20261003.js`)

Parte de `index-trazos-20261003.js`: trae todo eso y suma esto. Lo pidió Sergio, harto de que
el Área de Operaciones «ya no funciona cuando dibujo»: poder tocar una línea o un área ya
dibujada, agregarle o quitarle puntos y borrar un punto o toda la figura, y que el clic derecho
mientras se traza el frente borre sólo el último punto. La lista EXACTA está en
`calcos/pruebas/reemplazos-2026-10-03-edicion.js` (52); `construir-edicion.js` arma el compilado
y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también lo comprueba
`reemplazos-compilado.js`, como primer paso de la cadena).

### Qué pasaba

- Con una herramienta de línea o de área encendida (y se quedan encendidas) `dibujando` era
  verdadero y NINGUNA figura respondía al clic: no se podía editar ni borrar la línea recién
  dibujada. Había que apagar la herramienta.
- `VN` (mover vértice) sólo conocía límites, zonas, sectores, ejes, líneas del EM, flechas y
  obstáculos, y `GN` (borrar) tampoco tenía `areaOps`: el Área de Operaciones no se podía mover
  ni borrar (el clic derecho preguntaba «¿Borrar el Área de Operaciones?» y no hacía nada).
- El clic derecho mientras se trazaba el FRENTE del Área de Operaciones llamaba `Te(null),ge([]),
  Ae([])`: borraba TODOS los puntos. En las demás líneas el clic derecho TERMINABA el trazo.
- Las manijas sólo movían vértices (no había cómo agregar o quitar uno) y el clic derecho
  borraba la figura entera tras un `window.confirm`.
- Al borrar un límite con magnitud quedaba la marca flotando (`limite-N`) y las demás se corrían.
- Los polígonos eran tocables en todo su relleno: con una herramienta encendida, el primer
  clic de una línea trazada ADENTRO de un área habría elegido el área.

### Qué se hizo

- Ayudantes a nivel del módulo (antes de `Ave`): `SIDEditaVertices(ops, cat, idx, acc)` —lógica
  pura: mover, agregar (después del vértice i; en un área el último tramo cierra al primero) y
  borrar (mínimo 2 puntos en una línea y 3 en un área; si no se puede devuelve las MISMAS ops)—,
  `SIDAjustaAO` (el frente es siempre el principio de la lista de vértices: al agregar o borrar
  uno del frente crece o achica; frente, profundidad y azimut se recalculan), `SIDMenuFigura` /
  `SIDMenuDe` (el menú de clic derecho), `SIDManijas` (manijas de vértice y ⚪ de punto medio),
  `SIDBorde` (el borde de un área como línea tocable), `SIDResalte` (halo) y el CSS de la manito.
- `Ave`: las líneas y áreas editables (límites, Área de Operaciones, Área de Influencia, áreas y
  sectores logísticos, ejes, líneas del EM, flechas, obstáculos) son tocables aunque haya una
  herramienta encendida **mientras no haya un trazo en curso** (`SIDed`). Un clic las selecciona:
  halo celeste, manijas arrastrables en cada vértice y un ⚪ en el medio de cada tramo (clic o
  arrastre = agregar un punto). Con **Alt (Opción) + clic** el clic atraviesa la figura (para
  empezar un trazo encima de otra; con Mayús no: MapLibre lo usa para el zoom por recuadro). Sólo el **borde** de las áreas se toca. Esc suelta la figura.
- `yo` (clic derecho en TODAS las figuras, también las del CMOC): ya no es un `window.confirm`;
  abre el menú «📍 Borrar este punto» (o «el punto más cercano», marcado con un aro rojo; apagado
  si ya no se puede) / «🗑 Borrar toda la figura» / «✕ Cancelar». Clic derecho sobre una manija
  (vértice o ⚪) abre el mismo menú.
- Clic derecho **mientras se traza** = `deshacer` (el de «↶ BORRAR ÚLTIMO»): en el frente saca el
  último punto y vuelve al anterior; en el contorno saca el último vértice y, sin vértices, reabre
  el frente. En las demás líneas ya no termina el trazo (terminar: doble clic, Enter o la barra).
- Mesa: `VN` pasa por `SIDEditaVertices` (ahora también el Área de Operaciones y el Área de
  Influencia), `SIDAV`/`SIDBV` agregan y borran un vértice, `GN` borra el Área de Operaciones, el
  Área de Influencia y la marca de magnitud de un límite (y renumera las demás).
- **Área de Influencia**: la dibuja el oficial (`ops.influenciaTrazada = {coords}`, herramienta
  `influencia` en el panel «◌ Á. Influencia» → «✏️ Dibujar el Área de Influencia»). Se edita como
  cualquier figura. La app ya no la dibuja sola; el cálculo por el alcance del arma enemiga queda
  como referencia plegada en el panel. El Área de Interés se establece a partir de la que se
  trazó (si no, del Área de Operaciones), la H.T. 2 y el expediente para la IA usan la trazada.
- **Borde del Área de Interés**: botón «▣ Borde Á. Interés» en la barra (junto a «📐 Área de
  Interés»); apaga y prende `verCapa.areaInteres`, que ya mandaba en 2D y en 3D.
- **Panel del Área de Operaciones**: se sacaron «Es el sector que viene en la Orden…», el cuadro
  «Textual del reglamento / Estimación» y «Cómo se traza, en dos tiempos»; el bloque del Área de
  Influencia calculada; y el aviso de arriba quedó en una línea.
- **«Magnitud que se va a colocar»** (y «Magnitud del límite» / «Qué escalón marca» de Medidas):
  con un Área de Operaciones trazada sólo ofrece el escalón que le toca por su frente
  (`SIDEscalonesAO`: el de su banda, o los dos vecinos si queda entre dos), y se acomoda sola al
  cambiar el área. Sin Área de Operaciones sigue libre.
- 3D: el cursor sobre una figura editable es la manito (`grab`), no el dedo.

### En el fuente

- Los ayudantes pueden ir a un módulo propio (`SIDEditaVertices` y `SIDEscalonesAO` no tocan
  React ni Leaflet). `Ua` es el que arma la selección dentro del efecto de `Ave`; `yo` es global.
- `SIDEd` es un registro de módulo (`agregarV`, `borrarV`, `deseleccionar`) que la Mesa y `Ave`
  llenan en cada render; en el fuente conviene pasarlos por props.

### Cómo se comprobó

- `node edicion-figuras.cjs` (17): la lógica pura sobre las funciones TEXTUALES del compilado.
- `node e2e/edicion.cjs` (9, en 2D y en 3D, Chromium): la línea sin magnitud con la herramienta
  encendida (se toca, se agrega con ⚪, se arrastra un vértice, clic derecho = borrar este punto,
  borrar toda la figura); el Área de Operaciones del ejercicio (se toca el borde, un clic adentro
  no la selecciona, no se puede dejar de ser triángulo, ⚪ agrega un vértice, se arrastra uno y
  cambia la profundidad, se borra entera; el cursor es `grab`); clic derecho en el frente (borra
  sólo el último punto, y sin contorno vuelve al frente); el panel sin las explicaciones y con una
  sola magnitud para un frente de Cuerpo de Ejército; el Área de Influencia (se dibuja, se toca,
  se borra); el borde del Área de Interés; y Alt + clic.
- `reemplazos-compilado.js` pasa ENTERO con el paso nuevo. NO se volvió a correr entera la regresión de `e2e/trazos.cjs`, `plan-barreras-3d.js`, `ejes.js`, `ejes-fichas.js` y `asdi.js` sobre este compilado (la de `trazos.cjs` en 2D pasó con la primera versión de los cambios): correrlas antes de publicar.

### Lo que falta

- No se probó en un iPad real ni con el dedo: el menú de clic derecho en el 3D sale con una
  pulsación larga (como ya salía el borrado), pero la edición con el dedo no tiene prueba.
- «Magnitud que se va a colocar»: se entendió como «la marca del límite es del escalón del Área
  de Operaciones». Si lo que se quería es que el TRAZO del área no pueda ser más chico ni más
  grande que el escalón elegido (rechazar vértices fuera de la banda de frente y de fondo), es otro
  cambio y hay que pedirlo.

## 2026-10-03 (6) — ✏️ Los trazos terminan: clic otra vez en el último punto, Enter o «✓ TERMINAR» (`index-trazos-20261003.js`)

Parte de `index-respuestas-20261003.js`: trae todo eso y suma esto. Lo pidió Sergio con una
captura del Área de Operaciones («Doble clic = el frente es éste» y el frente seguía sumando
vértices) y dijo que pasaba en TODAS las secciones: la Línea de Extraviados y la de reunión
del G-1, el eje humanitario del G-5, los ejes de abastecimiento y las áreas. La lista EXACTA
está en `calcos/pruebas/reemplazos-2026-10-03-trazos.js` (14); `construir-trazos.js` arma el
compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también lo
comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué pasaba

- Todos los trazos de la Mesa (`Ave`: Área de Operaciones, límites y líneas, obstáculos,
  Línea de Extraviados y de PP.GG., eje humanitario, EPA/EPE, ASDI) y los del CMOC del G-2
  (`cve`) terminaban SÓLO con el evento `dblclick` del navegador.
- Safari del iPad / iPhone no manda `dblclick` después de un doble toque. En 3D la Mesa lo
  arma desde el 27-09 (`mando` del espejo 3D); en la carta 2D quedaba la simulación de
  Leaflet, que tampoco lo arma (descarta el segundo toque si viene con `detail` 2 y pide los
  dos toques en menos de 200 ms). Reproducido en Chromium cortando el `dblclick` del doble
  toque, como en la prueba del 27-09: en 2D el trazo NO terminaba nunca, ni con toques de
  120 ms.
- Un doble clic más lento que el del sistema son dos clics: dos vértices más, y el trazo
  siguiente se pegaba al anterior (la e2e nueva lo muestra: «extraviados:5» en vez de 2).
- En 3D el doble clic se pierde si algo vuelve a prender el zoom por doble clic de la carta
  escondida (el CMOC lo prende al montarse): el espejo sólo lo reenvía con ese zoom apagado.

### Qué se tocó en el compilado (14 reemplazos)

- Ayudantes a nivel del módulo, antes de `Ave`: `SIDEsToque` (dedo o lápiz: `pointerType`,
  `sourceCapabilities` o un `touchstart` en el último 1,2 s; un `pointerdown` del ratón lo
  olvida), `SIDCercaUltimo` (el clic cayó a ≤ 12 px del último punto con el ratón, ≤ 30 px con
  el dedo, medido con `pxVista`: en la vista que se mira, 2D o 3D), `SIDT` (la hora del evento,
  no la de cuando se procesa: si la Mesa tarda en redibujar, las guardas siguen midiendo el
  gesto real), `SIDSinRepetidos` y `SIDBarraTrazo` (la barra, en `<body>`, fija abajo al
  centro, máx. 560 px, para que se vea en 2D y en 3D; sus botones no se quedan con el foco,
  así Enter y Esc siguen siendo terminar y cancelar; si ya hay otra barra se apila encima).
- `Ave`:
  - Clic (o toque) OTRA VEZ SOBRE EL ÚLTIMO PUNTO = terminar (`SIDTermina`). En el frente del
    Área de Operaciones es «el frente es éste». En el contorno con un solo vértice: si ese
    vértice lo puso el primer clic del mismo gesto (< 600 ms), cierra en paralelo a su
    profundidad, como el doble clic; si lo puso antes, cierra con ese vértice, como «✓ CERRAR
    EL ÁREA» y Enter. No cuenta el primer vértice del Área de Operaciones ni del ASDI (ésos
    cierran como antes). Si faltan vértices no agrega uno repetido: avisa «MARCÁ AL MENOS…» y
    el `dblclick` del mismo gesto ya no borra el trazo.
  - Sólo cuando termina el ratón o el dedo: el clic que llega hasta 450 ms después (900 ms si
    es el segundo de un doble clic del sistema, `detail` 2) no empieza otro trazo, y el
    `dblclick` hasta 900 ms después no termina dos veces. Después de Enter o del botón no hay
    guarda: el clic siguiente empieza el trazo nuevo enseguida.
  - Al terminar con el clic sobre el último punto, el Área de Operaciones, el ASDI y los ejes
    apagan la herramienta y el efecto de siempre volvía a prender el zoom por doble clic antes
    de que llegara el `dblclick` del mismo gesto: la carta 2D se acercaba un nivel. Ahora, si
    se acaba de terminar, lo prende 900 ms después (salvo que haya otro trazo).
  - Enter = terminar y Esc = cancelar en todos los trazos (el ASDI y los ejes ya los tenían);
    Enter sostenido no repite.
  - La barra «✓ TERMINAR TRAZO / ↶ BORRAR ÚLTIMO / ✕ CANCELAR» mientras hay un trazo empezado
    («✓ EL FRENTE ES ÉSTE» y después «✓ CERRAR EL ÁREA» en el Área de Operaciones; «✓ CERRAR
    ÁREA» en los obstáculos de área), con el aviso si falta algo. «↶ BORRAR ÚLTIMO» en el
    contorno sin vértices vuelve al frente. El ASDI y los ejes del G-4 no la llevan: ya
    tienen sus botones en el panel desde el 30-09 (y la e2e de ellos los busca por nombre).
  - Mientras se traza, el zoom por doble clic de la carta queda apagado aunque otra parte lo
    vuelva a prender (después de cada render y en cada clic).
- `cve` (CMOC): los puntos en una referencia (como el ASDI), clic otra vez sobre el último
  punto = terminar cuando ya alcanzan los vértices (avenida y corredor ≥ 2; restringido, sev.
  restringido y área de empeño ≥ 3; terreno defensivo ≥ 1; si no alcanzan, el clic agrega el
  vértice como siempre), Enter (no en un SELECT ni sostenido; sin trazo del CMOC empezado no
  hace nada), la barra («🪖 Trazo del CMOC») y el mismo cuidado con el doble clic. Al cambiar
  de herramienta se vacía el trazo pendiente, y terminar nunca manda puntos con «Terreno
  clave» (antes, el clic derecho con puntos pendientes y «Terreno clave» elegido dejaba la
  Mesa en blanco; con Enter pasaba lo mismo).
- Textos: el rótulo del Área de Operaciones («Doble clic o Enter = el frente es éste», «doble
  clic o Enter = cerrar») y las siete ayudas «Clic = vértice · doble clic = terminar.» de los
  paneles → «… para terminar: doble clic, Enter o clic otra vez en el último punto.».

### En el fuente

- En el componente de los trazos de la Mesa (`Ave`) y en el del CMOC (`cve`): lo mismo. Los
  ayudantes pueden ir a un módulo propio; la barra puede pasar a un componente React con un
  portal a `<body>` (tiene que verse también con el 3D abierto).

### Cómo se comprobó

- `node e2e/trazos.cjs` (26 casos, Chromium). En 2D y en 3D con el ratón (11 cada uno): el
  Área de Operaciones (doble clic = el frente, doble clic = cerrar el contorno sin que la carta
  cambie de zoom, con la barra de cada paso; y un vértice de contorno puesto antes que se toca
  otra vez = polígono frente + vértice), la Línea de Extraviados del G-1 con un doble clic
  LENTO (900 ms), con un doble clic justo sobre el último vértice y con un doble clic del
  sistema de 480 ms (`detail` 2, por el protocolo de Chrome): termina una vez y no deja trazo
  fantasma; el eje humanitario del G-5 con Enter; una alambrada con «↶ BORRAR ÚLTIMO» y
  después Enter, con «✓ TERMINAR TRAZO» enseguida después, y Esc; un campo minado con un
  doble clic de 2 vértices (avisa y no borra) y el tercero con Enter; y en el CMOC una avenida
  con dos clics en el último punto, Enter sin trazo (sin aviso), «Terreno clave» con una
  avenida empezada y Enter (la Mesa no queda en blanco), y un restringido con un vértice a
  8 px del anterior. Ningún `window.alert`. Con el dedo como Safari (sin `dblclick`), en 2D y
  en 3D (4): una alambrada con doble toque de 300 ms y el frente del Área de Operaciones con
  doble toque.
- Contra el compilado anterior (`COMPILADO=…/index-respuestas-20261003.js`) fallaban los 8
  casos de 2D de la primera versión de esta prueba (ratón y dedo). Contra la primera versión
  de este arreglo (commit 173f25f) fallan 7 de los 11 de 2D con el ratón: son los defectos que
  encontró una revisión adversarial (12 confirmados, todos corregidos acá).
- Las e2e de trazado de antes siguen pasando con éste: `plan-barreras-3d.js` (14),
  `ejes.js`, `ejes-fichas.js` y `asdi.js`. Las demás pruebas de Node pasan.
- `reemplazos-compilado.js` pasa ENTERO. Además del paso nuevo, ahora retoma la cadena desde
  `index-5bpBlYsz.js` (campo `desde`) donde están los pasos de `construir-*.py` que no figuran
  en ella; así dejan de fallar los 10 casos históricos que tenían en rojo «Validar conceptos
  entrelazados» y «Validar matriz de administración del riesgo» desde el PR #55.
- La barra en 390 px de ancho: entra sin desborde horizontal.

### Lo que falta

- No se pudo probar en un iPad real (no hay WebKit acá): el caso de Safari se reprodujo en
  Chromium cortando el `dblclick` del doble toque, como el 27-09.
- En el teléfono (390 px) los botones de la barra superior tapan casi toda la carta: se
  puede trazar poco. Es de antes y no se tocó acá.

## 2026-10-03 (5) — 🤖 Las hojas de trabajo: la IA contesta en el formato y la Mesa lee lo que venga (`index-respuestas-20261003.js`)

Parte de `index-coordenadas-20261003.js`: trae todo eso y suma esto. Lo pidió Sergio con
una captura de la F2·P3 del G-5 («Completar y mejorar»): «No se reconoció la respuesta: no
trae un JSON válido ni la hoja escrita…», y dijo que el error era RECURRENTE. La lista EXACTA
está en `calcos/pruebas/reemplazos-2026-10-03-respuestas.js` (6); `construir-respuestas.js`
arma el compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también
lo comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué pasaba

- El pedido de las hojas de trabajo (`cU`, el de TODAS las secciones) terminaba con «CÓMO
  CONTESTAR» y el JSON; pero si el oficial escribía «Tu indicación para esta hoja», `Boe` la
  pegaba DESPUÉS («es lo último que leés… tiene prioridad sobre cualquier criterio propio»),
  y en «Completar y mejorar» el pedido insiste en «reescribilo como producto de Estado Mayor…
  agregá el efecto». La IA redactaba la hoja en párrafos.
- `dU` sólo leía el JSON con las claves exactas y, desde el lector, la tabla de Markdown. Una
  tabla COPIADA DE LA PANTALLA de la IA (sale con tabuladores), renglones rotulados, una lista
  numerada, un JSON cortado o `{ "tareas": […] }` daban el error.

### Qué se hizo (código legible en `calcos/estado-mayor/v4/`)

- `pedidoHoja` deja «FORMATO DE TU RESPUESTA» AL FINAL del pedido de las hojas de TODAS las
  secciones: sólo el bloque ```json; lo que se pida sobre el estilo («para exponer», más
  corto) va DENTRO de los textos; y si no puede, la TABLA con su cabecera exacta para copiar
  (o las dos listas / «Casilla: texto»).
- Si hay indicación del oficial, después de ella: «EL FORMATO DE TU RESPUESTA NO CAMBIA» (la
  indicación cambia el estilo, no el formato). Vale también para los documentos.
- `lector.js` lee, en las hojas de renglones: la tabla de Markdown con nombres de columna
  aproximados; cada `{ … }` de un JSON cortado; la tabla copiada de la pantalla (con y sin
  cabecera); los renglones rotulados («**Tipo:** Implícita», «Fuente:», «Responsable:»); los
  títulos numerados con viñetas; las listas agrupadas por tipo («Tareas específicas») con
  « — » entre columnas; «(Implícita)» entre paréntesis; el título con su párrafo debajo (como
  la captura); y, como último recurso, cada párrafo con contenido. Una negativa («Lo siento,
  no puedo…») sigue dando el error. En dos listas: «- Hecho: …» y `{ "hechos": […] }`. En
  casillas: «Casilla<TAB>texto», la tabla «Casilla | Texto» y la clave sin tildes.

### Qué se tocó en el compilado (6 reemplazos)

- Los `import` del motor: `../estado-mayor/v3/` → `../estado-mayor/v4/`, y `cierreIndicacion`,
  `filasDeRespuesta`, `celdaFila`, `listasDe`, `claveCasilla`.
- `Boe` → `SIDEMIndicacion(SIDBoe0(t,e),e)` (el `Boe` de antes queda entero como `SIDBoe0`).
- `dU`: los renglones en otra clave (`SIDEMFilasDe`), las columnas con otro nombre
  (`SIDEMCelda`), las dos listas con sus nombres (`SIDEMListas`), las casillas con la clave
  aproximada (`SIDEMClave`).

### En el fuente

- Lo mismo en `Boe` y `dU`; `pedidoHoja` y `rescatarHoja` de `calcos/estado-mayor/v4/registro.js`.

### Cómo se comprobó

- `node respuestas-hojas.cjs` (18 casos) con `cU`, `Boe` y `dU` REALES del compilado: el
  final del pedido (formato con la cabecera exacta; formato → indicación → recordatorio; una
  hoja del G-2; una de casillas) y cada forma de respuesta de arriba, incluida la de la
  captura; lo que ya entraba sigue entrando igual.
- `node e2e/g5.cjs` en Chromium, escritorio y teléfono: la F2·P3 con «Completar y mejorar» y
  la indicación «Escribilo para exponer en 3 minutos» → el pedido termina en ese orden; la
  respuesta en párrafos y la tabla copiada de la pantalla entran, sin el error.
- `estado-mayor.cjs` y `estado-mayor-g5.cjs` (ahora el formato va al final, también en el
  G-4), las demás pruebas de Node y las e2e de G-1, logística, reconocimiento, riesgo y
  conceptos; `reemplazos-compilado.js` pasa el paso nuevo y conserva los 10 fallos
  históricos.

## 2026-10-03 (4) — 📍 Las coordenadas acarrean los segundos: no más «60"» (`index-coordenadas-20261003.js`)

Parte de `index-g5-20261003.js`: trae todo eso y suma esto. Al mirar los Word del G-5
apareció «68°20'60"O»; `Sc` (la coordenada en grados, minutos y segundos que la Mesa escribe
en los documentos, los Word, los paneles y los pedidos a la IA) redondeaba los segundos sin
acarrear al minuto, ni el minuto al grado. La lista EXACTA está en
`calcos/pruebas/reemplazos-2026-10-03-coordenadas.js` (1); `construir-coordenadas.js` arma el
compilado y comprueba que deshaciéndolo se vuelve byte por byte al anterior (también lo
comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué se tocó en el compilado (1 reemplazo)

- `Sc`: redondea primero a segundos TOTALES (`Math.round(Math.abs(a)*3600)`) y recién
  después parte en grados, minutos y segundos. -68,35 sale «68°21'00"O»; lo que ya salía
  bien no cambia. Es la única copia de esa cuenta en el compilado (el plan de fuegos tiene
  la suya en `calcos/fuegos/plan-fuegos.js` y ya acarreaba).

### En el fuente

- La misma cuenta en la función que da la coordenada en grados, minutos y segundos.

### Cómo se comprobó

- `node coordenadas.cjs`: con la función TEXTUAL del compilado, el caso de los Word
  (-68,35; el compilado anterior escribía «68°20'60"O»), el acarreo del minuto al grado,
  una grilla fina alrededor de cada segundo (±0,4") en varios grados y 20.000 coordenadas
  al azar: ninguna con «60"» ni «60'», y cada una leída de vuelta queda a medio segundo. La
  misma grilla encuentra el fallo en el compilado anterior. El reemplazo aparece una vez, se
  deshace byte por byte y no cae dentro de lo que insertaron las listas anteriores.
- `node e2e/g5.cjs`: el Word del Anexo de AC/GM trae «17°00'00"S 68°21'00"O» para el PC de
  AC/GM y ninguna coordenada con 60. Las demás pruebas de Node y las e2e de G-1, logística,
  reconocimiento, riesgo y conceptos siguen pasando; `reemplazos-compilado.js` pasa el paso
  nuevo y conserva los 10 fallos históricos.

## 2026-10-03 (3) — 🏛️ G-5 Asuntos Civiles / GM: todas sus hojas se trabajan con guía, 🌱 calco, IA y Word militar (`index-g5-20261003.js`)

Parte de `index-lector-20261003.js`: trae todo eso y suma esto. Lo pidió Sergio con
capturas del panel del G-5 («🏛️ Asuntos Civiles — G-5 → 📋 Mis hojas»): la F1·P3
Apreciación Activa de AC/GM, la F2·P13 y el F7·P1 Anexo de AC/GM decían «se baja hecha».
Se hizo con el skill `.claude/skills/habilitar-hojas-seccion/`. La lista EXACTA de
reemplazos está en `calcos/pruebas/reemplazos-2026-10-03-g5.js` (3); `construir-g5.js` arma
el compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también lo
comprueba `reemplazos-compilado.js`, como primer paso de la cadena). Ninguna inserción cae
dentro de lo que insertaron las listas anteriores, salvo el cambio de versión de la carpeta
del motor en los `import` (lo comprueba `estado-mayor-g5.cjs` con todas las listas).

### Qué pasaba

- La Apreciación de AC/GM (F1·P3 y F2·P13) y el Anexo de AC/GM (F7·P1) eran hojas «remite»:
  sin IA, sin ideas del oficial, sin la forma del modelo de la Escuela.
- Las hojas de trabajo del G-5 (F2·P3, F2·P5, F2·P6, F2·P8, F2·P11, F3·P1, F5·P1, F6·P3)
  tenían IA pero no la guía ni «🌱 Traer del calco lo que falte», y su pedido no llevaba lo
  que calcula el panel del G-5 (población, recursos clasificados, evacuación) ni su doctrina.
- El motor no recibía las CAPAS cargadas: sin ellas no hay inventario de recursos ni
  población (salen de «Centros poblados» e «Infraestructura»).

### Qué se hizo (código legible en `calcos/estado-mayor/v3/`, ver `calcos/estado-mayor/README.md`)

- `campos/g5.js`: la **Apreciación de Situación de AC/GM** con la forma EXACTA del modelo de
  la Escuela que ya está en el catálogo (`aprec-acgm`): 89 apartados en orden y al mismo
  nivel; las instrucciones del modelo quedan literales como ayuda con un rótulo
  descriptivo; el ANÁLISIS es por FUNCIÓN (como el modelo) y los CAP aparecen en la
  COMPARACIÓN. El **Anexo de AC/GM**: la Escuela no tiene modelo de anexo del G-5 en el
  catálogo; por pedido de Sergio («ya había formatos cargados por cada sección con membrete
  con OCA») sale con la estructura del Anexo de AC/GM que ya bajaba la Mesa (`fNe`) y el
  formato militar común (membrete, OCA, letra del anexo, Orden, autenticación).
- La doctrina (el modelo, la secuencia de planeamiento de AC/GM del panel del G-5, el DICA
  —IV Convenio de Ginebra, La Haya 1954, Protocolo I arts. 53, 54 y 56—, el PMTD), lo que
  calcula la Mesa con SUS cuentas (inventario `rC`, población `mP`, evacuación `fN`,
  descarga al G-4 `SDe`), los ejes humanitarios y cuánto se montan sobre el EPA, las
  instalaciones de AC/GM, los bienes protegidos, lo que entregaron la Orden, el G-1, el G-2,
  el G-3 y el G-4; la guía y la 🌱 de las once hojas.
- Motor v3: un apartado puede tener texto PROPIO y subapartados («B.- Fuerzas propias.»);
  los CAP se nombran y agregan en la comparación cuando el documento no analiza por CAP;
  `configurarEM` SUMA lo que recibe; `sincronizarExtraEM({ capas })`; `registroWord` saca
  con el formato militar común un documento sin modelo dedicado; el lector reconoce la
  instrucción del modelo repetida como título y «- Ventajas: …» en viñeta.

### Qué se tocó en el compilado (3 reemplazos)

- Los `import` del motor: `../estado-mayor/v2/` → `../estado-mayor/v3/`, y
  `sincronizarExtraEM` (`SIDEMExtra`).
- Antes de montar la app: `configurarEM({inventarioAC:rC,poblacionAC:mP,evacuacionAC:fN,descargaAC:SDe,estadosAC:LU})`.
- En `Sze`, un efecto nuevo: `SIDEMcapas=je.useEffect(()=>{SIDEMExtra({capas:ve})},[ve])` (las
  mismas capas `ve` que recibe el panel del G-5).

### En el fuente

- Montar el motor desde `v3`; llamar a `configurarEM` con esas cinco funciones del panel
  del G-5 y pasarle las capas cargadas con `sincronizarExtraEM` cada vez que cambian.

### Cómo se comprobó

- `node estado-mayor-g5.cjs` (30 casos): la forma contra el catálogo apartado por apartado
  y nivel por nivel (y contra los títulos del anexo REAL de la Mesa, `fNe`); el motor v3; el
  G-5 con un ejercicio ficticio (`g5-ejemplo.js`) y las funciones REALES del compilado
  (inventario 18, 12.600 habitantes, 3780 evacuados, faltan 23 albergues, 11,8 km del eje
  humanitario sobre el EPA); el pedido; la respuesta en JSON (no pisa, CAP nuevo), ESCRITA
  como documento (`respuesta-prosa-g5.md` y el anexo), con el JSON roto y cortado; la guía y
  la 🌱 de las once hojas; el registro con las hojas REALES del compilado; los reemplazos.
- `node estado-mayor.cjs` (31 casos) ahora prueba el G-1 sobre la carpeta que importa el
  compilado vigente (v3).
- `node e2e/g5.cjs` en Chromium, escritorio y teléfono: las capas puestas en el estado de la
  Mesa llegan al panel y al motor; F2·P11 (guía, 🌱, IA, tabla de Markdown); Apreciación
  (🌱, ideas, IA, CAP nuevo, vista previa y Word con sus dos cuadros); F2·P13 (respuesta
  escrita como documento); Anexo (🌱, IA, Word de anexo «ANEXO “I” (Asuntos Civiles y
  Gobierno Militar) A LA ORDEN GENERAL DE OPERACIONES No. 3» con sus cuadros); avance (7 de
  11), guardado y sin errores de JavaScript. Los Word se miraron como imagen (membrete,
  SECRETO, numeración, cuadros, firma y autenticación, sin emojis ni marcas de la IA).
- `node e2e/personal.cjs` (el G-1 sobre v3) y las e2e de logística, reconocimiento, riesgo y
  conceptos; las demás pruebas de Node; `reemplazos-compilado.js` pasa el paso nuevo y
  conserva los 10 fallos históricos. No hay LibreOffice: el Word se mira con docx-preview.

## 2026-10-03 (2) — 🤖 La respuesta de la IA se reconoce aunque no venga en JSON (`index-lector-20261003.js`)

Parte de `index-personal-20261003.js`: trae todo eso y suma esto. Lo pidió Sergio con
capturas de la F2·P13 del G-1: pegó la respuesta de la IA («Completar y mejorar») y la Mesa
dijo «No se encontró un JSON válido»; la IA había escrito el DOCUMENTO (Markdown, «**A.-
…**», listas numeradas) en vez del bloque JSON. La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-10-03-lector.js` (2); `construir-lector.js` arma el
compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también lo
comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué se hizo (código legible en `calcos/estado-mayor/v2/`, ver `calcos/estado-mayor/README.md`)

- `lector.js`: lee la respuesta como venga — JSON; JSON reparado (saltos de línea crudos,
  comas de más, comillas tipográficas); fragmentos de un JSON cortado; el documento escrito,
  repartido por los títulos del formato en orden, con los CAP y las fases por su número y
  un «B.-» sin título por su lugar. En las hojas de siempre: tabla de Markdown, dos listas,
  «Casilla: texto».
- El pedido de los documentos termina con «FORMATO DE TU RESPUESTA»; el de las hojas del
  G-1 lo lleva antes de «CÓMO CONTESTAR».
- Los CAP de la respuesta se reconocen también por su número («CAP N° 1»), así no se
  duplican cuando la IA no devuelve su `id`.
- El motor pasa a la carpeta `v2/` (el navegador guarda los módulos); `v1/` queda para el
  compilado anterior.

### Qué se tocó en el compilado (2 reemplazos)

- Los `import` del motor: `../estado-mayor/v1/` → `../estado-mayor/v2/`, y `rescatarHoja`
  (`SIDEMRescatar`).
- `dU` (la respuesta de la IA de las hojas de trabajo de siempre, de TODAS las secciones):
  si no hay JSON, `SIDEMRescatar(i,e,KS(e,a,n))` antes de dar el error (que ahora dice qué
  hacer).

### En el fuente

- En `dU`, antes del error de «no hay JSON», llamar a `rescatarHoja` de
  `calcos/estado-mayor/v2/registro.js`; montar el motor desde `v2`.

### Cómo se comprobó

- `node estado-mayor.cjs` (31 casos): suma la respuesta escrita como documento
  (`respuesta-prosa-personal.md`: cada apartado, los dos CAP sin duplicar, las fases, las
  ventajas, las recomendaciones numeradas, sin negritas; «Sólo completar» no pisa), el JSON
  con saltos de línea crudos, comas de más y comillas tipográficas, el JSON cortado, el
  error sin JSON ni títulos, el «FORMATO DE TU RESPUESTA» al final del pedido, las hojas de
  siempre con tabla, listas y casillas, y el `dU` REAL del compilado vigente con la tabla.
- `node e2e/personal.cjs` en Chromium, escritorio y teléfono: además de lo anterior, en la
  F2·P13 «Completar y mejorar» con la respuesta escrita (entra apartado por apartado, dos
  CAP) y en la F2·P3 una tabla de Markdown. Las demás e2e y pruebas de Node siguen pasando;
  `reemplazos-compilado.js` pasa los pasos nuevos y conserva los 10 fallos históricos.

## 2026-10-03 — 👥 G-1 Personal: todas sus hojas se trabajan con guía, 🌱 calco, IA y Word militar (`index-personal-20261003.js`)

Parte de `index-logistica-20261002.js`: trae todo eso y suma esto. Lo pidió Sergio con
capturas del panel del G-1 y de las hojas del G-2 y el G-3 como ejemplo. La lista EXACTA de
reemplazos está en `calcos/pruebas/reemplazos-2026-10-03-estado-mayor.js` (11);
`construir-estado-mayor.js` arma el compilado y comprueba que deshaciéndolos se vuelve byte
por byte al anterior (también lo comprueba `reemplazos-compilado.js`, como primer paso de la
cadena). Ninguna inserción cae dentro de lo que insertaron las listas anteriores (lo
comprueba `estado-mayor.cjs` con los 123 textos de antes).

### Qué pasaba

- La F1·P3 «Apreciación Activa de PERSONAL», la F2·P13 y el F7·P1 Anexo de Personal eran
  hojas «remite»: «se baja desde el botón de Apreciación», con casi todo «[…]». No había IA,
  ni lugar para las ideas del oficial, ni la forma del modelo de la Escuela.
- Las hojas de trabajo del G-1 (F2·P3, F2·P5, F2·P6, F2·P8, F3·P1, F5·P1, F6·P3) tenían IA
  pero no la guía «¿Para qué es y cómo se llena?» ni «🌱 Traer del calco lo que falte», y su
  pedido no llevaba lo que la Mesa calculó para el G-1 (las bajas por fase) ni su doctrina.

### Qué se hizo (código legible en `calcos/estado-mayor/v1/`, ver `calcos/estado-mayor/README.md`)

- Un **motor genérico** de documentos de Estado Mayor (`motor.js`, `registro.js`,
  `editor.js`, `runtime.js`) y la configuración del G-1 (`campos/g1.js`): la Apreciación de
  Situación de Personal y el Anexo de Personal con la forma EXACTA de los modelos
  `aprec-personal` y `plan-personal` del catálogo del formato militar; 📘 guía, 🔎 lo que
  entregaron las otras secciones, 🌱 calco y hojas, 💡 ideas, 🤖 IA (el panel `hU`) con el
  expediente completo, lo calculado, la doctrina y el formato del documento, 👁️ vista previa
  y 📄 Word militar (el anexo con el cuadro de bajas por fase).
- Las hojas de trabajo de siempre del G-1: guía y 🌱 arriba (`AyudaHoja`), y su pedido a la
  IA con la guía (`ayuda` de `cU`) y lo calculado, lo entregado y la doctrina antes de
  «CÓMO CONTESTAR».
- Para el G-5 (o el EME) basta escribir `campos/<g>.js` y registrarlo: los ganchos ya son
  genéricos (skill `.claude/skills/habilitar-hojas-seccion/`).

### Qué se tocó en el compilado (13 reemplazos)

- Los `import` de `calcos/estado-mayor/v1/` y `configurarEM(...)` (React, `hU`, `Qq`, `uU`,
  `Mx`, `SIDMilHoja`, `SIDMilVista`, `SIDMilMostrar`, `Ni`, `Sc`, `iC`, `voe`).
- `uN` pasa por el registro (`SIDEMFases`): en el G-1, `aprecActiva`, `aprecOrientacion` y
  `anexo` pasan a `tipo:"docEM"` (los demás campos siguen como estaban).
- `dN` («Mis hojas»): para `docEM` monta `SIDEditorEM`; en las demás hojas, `SIDEMAyuda`
  (guía y 🌱) debajo de la nota; el pedido de la IA pasa por `SIDEMPedido` con la guía.
- `KS`: un `docEM` no es hoja de renglones. `Foe` y `mDe`: cuenta si tiene texto (no por su
  `esquema`). `zle` (expediente): va como texto.
- Componente principal: un efecto que le pasa al motor el calco vivo (`Lt`, `dn`, `Yn`, `Xr`,
  `pn`, `_`, `ho`, `Rr`, `uc`, `Tn`, `Kr`, `Ya`, `$i`) y las acciones (`Ep`, `ur`).

### En el fuente

- Montar `calcos/estado-mayor/v1/editor.js` (`EditorDocumento` para el tipo `docEM`,
  `AyudaHoja` en las demás hojas de «Mis hojas»), el registro en las hojas de `uN`, el efecto
  de sincronización y los ganchos de `dN`, `KS`, `Foe`, `mDe` y `zle`. Modelo, IA y Word no
  dependen de React.

### Cómo se comprobó

- `node estado-mayor.cjs` (23 casos): la forma de los dos documentos contra el catálogo,
  apartado por apartado; el motor (sin pisar, partir de, revisión, Word con la numeración y
  los CAP por fase, HTML); el G-1 con un ejercicio FICTICIO y la cuenta REAL de bajas sacada
  del compilado (`iC`); pedido y respuesta de la IA (sólo completar no pisa; mejorar
  reescribe; CAP por nombre; fases); guías y 🌱 de las hojas de trabajo sin duplicar; el
  registro; los reemplazos y que los de antes quedan enteros.
- `node e2e/personal.cjs` en Chromium, escritorio y teléfono: F2·P3 (guía, 🌱, IA con lo
  calculado y la doctrina), Apreciación (🌱, ideas, pedido con el expediente y los documentos
  aportados, respuesta sin pisar, vista previa del Word real, Word militar descargado y
  leído), F2·P13, Anexo (🌱, IA, Word de anexo con el cuadro de bajas), avance y guardado;
  sin errores de JavaScript. Las e2e del G-4, reconocimiento, riesgo y conceptos siguen
  pasando; `reemplazos-compilado.js` pasa los dos pasos nuevos y conserva los 10 fallos
  históricos que ya tenía. `logistica.cjs` comprobaba que `calcos/index.html` cargara
  justo el compilado del 02-10: ahora comprueba que el compilado vigente conserva sus
  reemplazos.
- No hay LibreOffice Writer en el entorno: los Word se revisaron dibujados con docx-preview
  (el mismo visor de la Mesa).

## 2026-10-02 — 🚚 Logística del G-4: ASDI paso a paso, Apreciación de Logística con IA y Matriz de Sincronización (`index-logistica-20261002.js`)

Parte de `index-reconocimiento-20261001.js`: trae todo eso y suma esto. Lo pidió Sergio
con capturas del panel del G-4 y tres textos de la Escuela (UU. CMDO. LOG. 2022, Texto UU.
CMDO. LOG. y Texto CLFFTTTO 2016). La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-10-02-logistica.js` (14); `construir-logistica.js` arma el
compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior (también lo
comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué pasaba

- La F1·P3 «Apreciación Activa de LOGÍSTICA» (y la F2·P13) era una hoja «remite»: sólo
  decía que se baja desde el botón de Apreciación, que sacaba una plantilla con casi todo
  «[…]». No había IA ni lugar para las ideas del oficial.
- La pestaña «▣ ASDI» trazaba y desplegaba, pero no explicaba qué diferencia hay entre el
  ASDI y el ARCE ni cómo se elige el área (proponer, verificar los datos generales,
  evaluar con los factores de la Escuela, elegir).
- No existía la Matriz de Sincronización Logística.

### Qué se hizo (código legible en `calcos/logistica/v1/`, ver `calcos/logistica/README.md`)

- **🧭 Paso a paso** arriba de la pestaña ASDI: 1 entender (ASDI, ARCE, esquema en
  profundidad, SEGAR, método), 2 proponer las áreas A, B… (trazadas con la herramienta de
  siempre; quedan con su letra), 3 verificar tamaño, distancia de seguridad (desde la LPR
  del AO), DMA, EPA y tonelaje, y **acostar las medidas en la carta**, 4 evaluar con la
  matriz de la Escuela (lo medido, el oficial y la IA, conclusión y Word), 5 elegir y
  desplegar el Batallón Logístico.
- **F1·P3 / F2·P13 Apreciación de Situación de Logística**: tipo `aprecLog` (sólo en el
  G-4; los demás campos siguen como estaban), con 🌱 calco y hojas, 💡 ideas, 🤖 IA (el
  panel `hU`), vista previa y Word con el formato militar.
- **F7·P2 Matriz de sincronización logística**: hoja nueva del G-4, tipo `matrizLog`, con
  🌱, ideas, IA, Word apaisado y botones para trazar/ver en el calco.
- **F7·P1 Anexo de Apoyo de Servicio de Combate** del G-4: tipo `anexoLog`, con 🌱 (calco,
  concepto por fase, SEGAR de la matriz, hipótesis de la apreciación), ideas, IA y Word
  militar (nivel anexo: el cuadro de revisión pide letra y Orden).
- En la carta, las áreas propuestas no elegidas van con línea discontinua y «ÁREA A
  (PROPUESTA)».

### Qué se tocó en el compilado (14 reemplazos)

- Los `import` de `calcos/logistica/v1/` y `configurarLogistica(...)` (React, `hU`, `Qq`,
  `uU`, `Mx`, `SIDMilHoja`, `SIDMilVista`, `SIDMilMostrar`, `Ni`, `Sc`, `Rt`).
- `uN` (hojas del G-1/G-4/G-5/EME): en el G-4, `aprecActiva` y `aprecOrientacion` pasan a
  `tipo:"aprecLog"` y la fase 7 suma `matrizSinc` (F7·P2, `tipo:"matrizLog"`).
- `dN` («Mis hojas»): para esos tipos monta `SIDEditorLog` (con las hojas del G-4, el
  expediente y el contexto) en lugar de los botones y el panel genéricos.
- `Foe` y `mDe`: una hoja de logística cuenta si tiene texto (no por su `esquema`).
- `KS`: no son hojas de renglones. `zle` (expediente): van como texto.
- `yDe` (panel del G-4), pestaña ASDI: monta `SIDLogPaso` arriba (con `hojas`, `onHojas`,
  el expediente, `ctxDoc`, la orden y el selector del área a desplegar).
- Componente principal: un efecto que le pasa al módulo el calco vivo (`Lt`, `dn`, `Yn`,
  `pn`, `_`, `ba`, `Hi`) y las acciones para acostar (`AC`, `Sn`, `Ep`, `Tr`, `tw`).
- Carta 2D (`Rt.polygon` de `zonasLog`) y GeoJSON del 3D/exportación (`m2`): las áreas
  propuestas con línea discontinua y su letra.

### En el fuente

- Montar `calcos/logistica/v1/editor.js` (`PasoAPaso` en la pestaña ASDI y el editor de
  las hojas `aprecLog` / `matrizLog`), el efecto de sincronización y los ganchos de `uN`,
  `dN`, `Foe`, `mDe`, `KS`, `zle` y de la carta de arriba. Modelo, análisis, IA y Word no
  dependen de React.

### Cómo se comprobó

- `node logistica.cjs` (14 casos): datos de la Escuela y DMA, geometría, análisis del
  calco (con y sin AO), sugerencias, evaluación y conclusión, apreciación y matriz
  armadas sin pisar, pedidos y respuestas de IA (sin pisar al oficial ni lo impositivo),
  Word (XML, casillas pintadas, SECRETO, apaisado), especificación militar y reemplazos.
- `node e2e/logistica.cjs` en Chromium, escritorio y teléfono: los cinco pasos (en
  escritorio las áreas A y B se TRAZAN en la carta con el botón del asistente), medidas
  acostadas, evaluación con IA, Word, elegir; la apreciación (calco, evaluación, hojas,
  ideas, IA, vista previa del Word militar y descarga), la F2·P13, la matriz (fases,
  concepto, calco, amenaza, IA, Word), el avance de «Mis hojas» y el guardado; sin errores
  de JavaScript. Las demás pruebas de Node siguen pasando. Las e2e de riesgo, conceptos,
  ASDI y ficha documental fallaban ANTES de este cambio (sus ejercicios de prueba no tenían
  la «unidad considerada» que la Mesa exige desde el 01-10, y el panel de la ficha o del
  ejercicio tapaba botones): se corrigieron las pruebas y ahora pasan las 12 e2e; `reemplazos-compilado.js` pasa
  el paso nuevo y conserva los 10 fallos históricos que ya tenía.
- No hay LibreOffice Writer en el entorno: los Word se revisaron dibujados con
  docx-preview (el mismo visor de la Mesa).

## 2026-10-01 — 🔭 Orden de Reconocimiento: la F2·P9 es la ORDEN completa, con la forma de la Escuela (`index-reconocimiento-20261001.js`)

Parte de `index-oca-militar-20261001.js`: trae todo eso y suma esto. Lo pidió Sergio con
el Word de la F2·P9 que sacaba la Mesa y el ejemplo de la Escuela «06. ORDEN DE
RECONOCIMIENTO» (DIV.MEC.-2). La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-10-01-reconocimiento.js` (16); `construir-reconocimiento.js`
arma el compilado y comprueba que deshaciéndolos se vuelve byte por byte al anterior
(también lo comprueba `reemplazos-compilado.js`, como primer paso de la cadena).

### Qué pasaba

- La F2·P9 era una matriz de renglones (Órgano · Tarea · Área · Alcance · No antes de · No
  después de · Dónde informa). El Word (formato militar) la metía entera como tabla en el
  «modelo orden de reconocimiento» del paquete, con «Refuerzos y reducciones» y «Plan de
  distribución»; todo lo demás salía «[Pendiente de elaboración]» y firmaba «EL G-3 DE LA
  UNIDAD».

### Qué se hizo (código legible en `calcos/reconocimiento/v1/`, ver `calcos/reconocimiento/README.md`)

- La hoja es la ORDEN: OBJETO, CARTA y ANEXOS; el cuadro de ORGANIZACIÓN DE LA TAREA (una
  columna por equipo, «EQ. ZULU», con sus elementos); I.- Situación; II.- Misión; III.-
  Ejecución (A.- Plan: objetivo y método; B.- Tareas para los equipos: forma de llegar
  a.- b.- c.-, «a.- Equipo ZULU. Obtener información referente a: - …», plazos; C.-
  Instrucciones de coordinación); IV.- Apoyo de servicio; V.- Comando y comunicaciones;
  la firma del Comandante y la distribución (original, Sec. III y una copia por equipo).
- El Word es el del formato militar de la Mesa (el mismo membrete de los demás
  documentos), con la estructura propia de la hoja (`estructuraPropia`), sin reacomodarla
  en el modelo genérico.
- 🌱 Traer del calco lo que falte (los órganos de reconocimiento con su alcance, la carta,
  la referencia a la Orden Preparatoria), sin pisar.
- 💡 Las ideas del oficial («cómo quiero el reconocimiento») van al pedido a la IA.
- 🤖 El mismo panel de IA de las demás hojas (`hU`), con un pedido propio: expediente,
  órganos del calco, doctrina, el ejemplo de la Escuela, las ideas y la orden con los
  `id` de sus equipos. La respuesta (JSON) se aplica sin pisar o reescribe; lo de la IA
  queda marcado para revisar (no se imprime).
- La matriz de antes se lee sola: cada renglón es un equipo, sin perder nada.

### Qué se tocó en el compilado (16 reemplazos)

- Los `import` de `calcos/reconocimiento/v1/`, `vistaMilitar`/`mostrarDocx` del formato
  militar y su nueva versión (`runtime.js?v=reco20261001`).
- La hoja `ivr` pasa a `tipo:"reconocimiento"` (sin `cols` ni `autollena`: el editor
  trae su propia siembra, con la misma `l3e`).
- `KS`: no es una hoja de renglones (sin el panel genérico de IA).
- Tablero del G-3 (`wLe`): sin los botones genéricos «Vista previa / Word»; monta
  `SIDEditorReco` con `{...I, unidades, orgTarea, g3, documentos}` y el expediente. `yU`
  (fuera del Tablero) también.
- `zle` (expediente), `ED` (carpeta del G-3) y `CD` (documentos con contenido) leen la orden.
- `sP`: lo que otros pedidos a la IA (`hojas_g3.ivr`) traen se AGREGA a la orden.
- `Aoe` y `Coe`: cualquier otra salida a Word de la F2·P9 usa la misma orden.
- La guía «¿Para qué es y cómo se llena?» de `ivr` y `configurarReconocimiento(...)`.

### En el fuente

- Montar `calcos/reconocimiento/v1/editor.js` para el tipo `reconocimiento` y los ganchos
  de `zle`, `ED`, `CD`, `KS`, `sP`, `Aoe` y `Coe` de arriba; la definición de la hoja y su guía.

### Cómo se comprobó

- `node reconocimiento.cjs`: matriz de antes, siembra, firma y distribución, pedido,
  respuesta (completar / mejorar), fusión con la `sP` real, estructura del ejemplo y el
  Word (orden de los apartados, numeración, incisos, guiones, cuadro con bordes,
  SECRETO, «PAGE - NUMPAGES»).
- `node e2e/reconocimiento.cjs` en Chromium, escritorio y teléfono: guía, matriz de antes
  leída, siembra, ideas, pedido, respuesta sin pisar, vista previa del Word real, Word
  militar descargado, guardar y carpeta. Las pruebas del formato militar, de riesgo y de
  conceptos siguen pasando (las que extraen funciones del compilado se actualizaron con
  los nombres nuevos; la de la ruta de la F2·P9 comprueba ahora la orden).

## 2026-09-29 — ⚠️ Matriz de administración del riesgo: la hoja de trabajo del RO-06-01-04 (`index-5bpBlYsz.js`)

Parte de `index-ucOhdPbL.js`: trae todo eso y suma esto. Lo pidió Sergio con el Word de
la F2·P7 que sacaba la Mesa. La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-09-29-riesgo.js` (14); `reemplazos-compilado.js`
comprueba que deshaciéndolos se vuelve byte por byte a `index-ucOhdPbL.js`.
`construir-riesgo.js` arma el compilado nuevo desde esa lista.

### Qué pasaba

- La F2·P7 «Matriz de administración del riesgo» era una hoja de RENGLONES (Peligro ·
  Probabilidad · Severidad · Nivel inicial · Medida de control · Quién · Residual). El
  Word salía como una lista «A.- Peligro identificado: … · Probabilidad: Alta [IA —
  verificar] · …», en hoja vertical, SIN membrete táctico, con RESERVADO (el valor por
  defecto de la Orden del escalón superior) y firmado «EL G-2 DE LA UNIDAD».
- El formato es la HOJA DE TRABAJO del RO-06-01-04 «Administración del Riesgo»
  (Anexo «B»; ejemplos en el Anexo «C»): una MATRIZ con A–D arriba, E–J por tarea y
  obstáculo y K abajo; y la matriz de la Escuela (DIMEC-1) la numera 1–11, con SECRETO
  arriba y abajo y «1 - 2» al pie.

### Qué se hizo (código legible en `calcos/riesgo/v1/`, ver `calcos/riesgo/README.md`)

- La hoja es una matriz: tareas con sus obstáculos; estimación con probabilidad (A–E) ×
  severidad (I–IV) → nivel por la Figura 6 (lo calcula la Mesa); controles, residual y
  cómo se implementan; K = el MAYOR residual, encerrado en un círculo.
- Word propio (XML de Word a mano, sin la biblioteca del compilado, para poder dibujar
  la elipse de K): carta apaisada, membrete táctico en Arial 10 negrilla (escalón
  superior · unidad considerada con el PC y la hora · EMO/SEC-III · No. 001/clave),
  SECRETO arriba y abajo, «PAGE - NUMPAGES» al pie, la matriz y la firma del Comandante.
  Rótulos del reglamento (A–K) o de la Escuela (1–11).
- 🌱 Armado con lo del ejercicio (misión, grupo fecha/hora y fecha de preparación de la
  Línea Inicial de Tiempo, quién la prepara, tareas de la F2·P3), sin pisar.
- 🤖 El mismo panel de IA de las demás hojas (`hU`), con un pedido propio: el
  expediente entero (pedido con el COC calculado), lo que leyó la Mesa, el método del
  RO-06-01-04 y la matriz con sus `id`. La respuesta (JSON) se aplica sin pisar o
  reescribe («completar y mejorar»); lo de la IA queda marcado para revisar (no se imprime).
- La hoja de antes (renglones) se lee sola como matriz, sin perder nada.
- La F6·P3 del G-3 («Riesgo de la operación (actualización)») pasa a ser la MISMA
  matriz, actualizada, con «📋 Partir de la matriz de la fase II».

### Qué se tocó en el compilado (14 reemplazos)

- Los `import` de `calcos/riesgo/v1/` y `configurarRiesgo(...)` (React, `hU`, `Qq`, `uU`, `MS`).
- Las hojas `riesgo` (F2·P7) y `riesgoFinal` (F6·P3) pasan a `tipo:"riesgo"`
  (`riesgoFinal` con `actualiza:"riesgo"`).
- `KS`: el tipo `riesgo` no es una hoja de renglones (sin el panel genérico de IA).
- Tablero del G-3 (`wLe`): sin los botones genéricos «Vista previa / Word» para ese
  tipo; monta `SIDEditorRiesgo` con `{...I, unidades, orgTarea, g3, documentos}` y el
  expediente. `yU` (fuera del Tablero) también.
- `zle` (expediente), `ED` (carpeta del G-3: la matriz como tabla, sin repetir el
  membrete) y `CD` (documentos con contenido) leen la matriz.
- `sP`: lo que otros pedidos a la IA (`hojas_g3`) traen para la matriz se AGREGA a ella
  (la función general la habría reemplazado por una lista).
- La guía «¿Para qué es y cómo se llena?» de `riesgo` y de `riesgoFinal`.

### En el fuente

- Montar `calcos/riesgo/v1/editor.js` para el tipo `riesgo` (o pasar la carpeta a
  componentes: modelo, IA y Word no dependen de React) y los ganchos de `zle`, `ED`,
  `CD`, `KS` y `sP` de arriba; las dos definiciones de hoja y las dos guías.

### Cómo se comprobó

- `node riesgo.cjs` (16 casos): las 20 casillas de la Figura 6; palabras → letras; la
  hoja de antes leída sin perder nada; texto guardado tal cual; membrete de la orden y
  SECRETO; armado con la Línea de Tiempo real de la Mesa (`MS`); K; revisión; texto del
  expediente; pedido; respuesta con el corrector real (`uU`); la fusión con la `sP`
  real; el Word (apaisado, membrete Arial 10 negrilla, SECRETO, numeración, rótulos,
  elipse, celdas combinadas) y la vista previa.
- `node e2e/riesgo.cjs` en Chromium, escritorio y teléfono: guía nueva, hoja de antes
  leída, armado, pedido con el expediente y el método, respuesta aplicada sin pisar,
  vista previa, Word, guardar y reabrir, F6·P3. `word-riesgo.py` valida los Word (y
  rechaza el Word viejo). Los Word se revisaron convertidos a PDF con LibreOffice.
- `npm test` completo y los e2e `conceptos.cjs`, `plan-fuegos.js`, `academico.js`,
  `carga.js` y `plan-barreras-3d.js` pasan con el compilado nuevo.

## 2026-09-29 — Conceptos entrelazados v4: la hoja en carpeta nueva (`index-ucOhdPbL.js`)

Parte de `index-nDtcWpLo.js` + `calcos/pruebas/reemplazos-2026-09-29-conceptos-v4.js`
(1 reemplazo: los `import` de la hoja apuntan a `../conceptos/v4/`); lo arma
`construir-conceptos-v4.js` y `reemplazos-compilado.js` lo deshace byte por byte.

- Qué pasaba: se cambió `v3/modelo.js` en el mismo lugar (todas las unidades de las
  filas con flecha directa a la unidad propia) y el docente siguió viendo la hoja sin
  esas flechas: su navegador tenía los módulos de `v3/` en caché con la misma dirección.
- Qué se hizo: `v4/` es la `v3/` actual, con una marca «Versión 4 (29-09)» en la
  pantalla para saber que cargó la nueva. Compilado nuevo apuntado desde
  `calcos/index.html`. `v3/` queda como estaba para el compilado anterior.
- Cómo se comprobó: `conceptos.cjs` (20 casos, sobre `v4/`), `reemplazos-compilado.js`,
  `e2e/conceptos.cjs` en Chromium (ahora comprueba que TODAS las unidades del caso del
  docente tienen su relación directa con la División y que se ve la marca de versión) y
  `word-conceptos.py`.

## 2026-09-29 — 🧩 Conceptos entrelazados v3: la cadena de mando y las dos opciones (`index-nDtcWpLo.js`)

Parte de `index-6Gm5UQ97.js`: trae todo eso y suma esto. Lo pidió Sergio con el Word
de la hoja que sacaba la v2. La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-09-29-conceptos-v3.js` (2); `reemplazos-compilado.js`
comprueba que deshaciéndolos se vuelve byte por byte a `index-6Gm5UQ97.js`.
`construir-conceptos-v3.js` arma el compilado nuevo desde esa lista.

### Qué pasaba

- La hoja tenía sólo DOS cajas arriba. En el Word del docente salían las «Fuerzas
  Terrestres del Teatro de Operaciones» rotuladas «TO» con XXX, el CE con XX, la
  DIV.MEC.-1 en la misma fila que sus regimientos y una «Unidad sin nombre» (X) marcada
  como unidad propia: la «Unidad» de la Orden estaba vacía y el armado inventó el
  escalón (el de las fichas más uno: regimiento → brigada).
- El pedido a la IA no decía la jerarquía ni las magnitudes, ni qué hacer con otras
  divisiones, ni cómo se identifican las relaciones; y lo que la IA devolvía se
  aplicaba tal cual.
- No había forma de elegir entre las unidades puras de la orden y las FT del oficial.

### Qué se hizo (código legible en `calcos/conceptos/v3/`, ver su README)

- **Jerarquía fija**: CTO XXXXX → FF.TT.T.O. XXXX → CE XXX → División XX → regimientos
  III, batallones II, compañías I. La cadena de mando es de largo variable (hasta cinco
  escalones en la lámina) y las filas van DEBAJO de la unidad propia.
- **Tres opciones**: 🪖 unidades puras (lee el cuadro de la organización de la tarea de
  la orden: cada columna es una unidad, sus subunidades no, «BAJO CONTROL»), 🧩 FT /
  agrupaciones tácticas (las de 🧩 Organización de la tarea y lo que quedó con «(-)»),
  ↔️ mi unidad entre las adyacentes.
- **Unidad propia** de la Orden, de la misión o del OBJETO de una orden aportada; si no
  está, la pantalla la pide (nunca más «Unidad sin nombre»).
- **IA**: el pedido lleva la jerarquía, la opción, lo que ya identificó la Mesa, las
  reglas de otras divisiones (adyacentes) y de relación directa / indirecta, y una
  verificación final. La respuesta se aplica y después `acomodarJerarquia` pone cada
  unidad en su escalón y avisa qué corrigió. El botón «🧹 Acomodar cada unidad en su
  escalón» arregla una hoja ya guardada.

### Qué se tocó en el compilado (2 reemplazos)

- Los `import` de la hoja apuntan a `../conceptos/v3/`.
- La guía «¿Para qué es y cómo se llena?» de `entrelazados` explica la cadena y las
  opciones.

### En el fuente

- Montar `calcos/conceptos/v3/editor.js` (o pasar la carpeta a componentes: modelo,
  láminas e IA no dependen de React) y la guía nueva.

### Cómo se comprobó

- `node conceptos.cjs` (19 casos): designaciones y magnitudes de las siglas de la casa;
  la organización de la tarea del caso del docente (11 + 1 BAJO CONTROL, ninguna
  subunidad; con dos divisiones no se adivina); las tres opciones con
  `conceptos-divmec.js`; la IA equivocada como en el Word (sobre la hoja armada, vacía y
  con «completar y mejorar») y la hoja v2 del Word acomodada; la lámina con la cadena de
  arriba hacia abajo y la fila debajo de la División; el ejemplo del PMTD y los casos de
  antes.
- `node e2e/conceptos.cjs` en Chromium: escritorio y teléfono con la opción FT (armado,
  pedido, respuesta, láminas, Word, guardar y reabrir) y el caso del docente con
  «Unidades puras» (cadena, 12 unidades, IA equivocada acomodada, lámina, Word,
  guardado). `word-conceptos.py` valida los tres Word. `npm test` completo pasa.

## 2026-09-28 — 🧩 Conceptos entrelazados: la hoja sale LLENA, con la forma del PMTD y con IA (`index-6Gm5UQ97.js`)

Parte de `index-nQKdqwIj.js` (el plan de fuegos): trae todo eso y suma esto. Lo pidió
Sergio. La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-09-28-conceptos-ia.js` (7); `reemplazos-compilado.js`
comprueba que deshaciéndolos se vuelve byte por byte a `index-nQKdqwIj.js`.
`construir-conceptos-ia.js` arma el compilado nuevo desde esa lista.

### Qué pasaba

- La hoja F2·P1 era un formulario gráfico VACÍO: no se llenaba con nada del
  ejercicio (se le había sacado el «🌱 Traer del calco») y se le había quitado el
  panel «🤖 Trabajar esta hoja con IA» (la prueba de entonces verificaba que no
  estuviera). El Word salía con «SIN DATO» en todo.
- Antes de eso, el Word de la hoja era un texto narrativo (A.- INTENCIÓN…, B.-
  MISIÓN…), que no es la hoja de trabajo del PMTD: ésa es GRÁFICA (pág. 20, ejemplo
  en las págs. 21-22).

### Qué se hizo

La hoja es código legible APARTE del compilado, en `calcos/conceptos/v2/` (ver
`calcos/conceptos/README.md`). Los módulos de la versión anterior
(`calcos/conceptos/*.js`) quedan intactos para el compilado anterior.

- **Nivel de la hoja**: «mi unidad y mis subordinadas» (como el ejemplo del PMTD:
  CE → Div-1 → regimientos) o «mi unidad entre las adyacentes» (análisis de la
  orden superior).
- **🌱 La aplicación la arma** con la orden del escalón superior, la reexpresión de
  la misión, la 🧩 Organización de la tarea (OD / OC, tarea y propósito), las fichas
  propias del calco y las fases del COA; con relaciones por defecto.
- **🤖 IA** como en las demás hojas (mismo encabezado `Qq` y mismo corrector de
  terminología `uU`), con el expediente entero, la doctrina y el ejemplo del PMTD,
  el nivel, la idea del oficial al final y ORIENTACIONES O INFORMACIÓN propias de la
  hoja (texto y archivos .docx / .txt / .md). La respuesta (JSON) se aplica a la
  hoja: «sólo completar» no pisa lo escrito; «completar y mejorar» lo reescribe.
- **Láminas** con la forma del ejemplo: cajas con magnitud, símbolo del arma, OD ☆ /
  OC, esfuerzo principal (︽) por fase, T y P por fase debajo de cada unidad,
  flechas llenas (directa) y discontinuas (indirecta), lámina de apoyo de combate
  (TAREA / PROPÓSITO / PAF / EFECTO, PE / PT) y de SPAC, REFERENCIAS y fases.
  Continuaciones cuando un texto no entra. Con la hoja vacía, el formato en blanco
  de la pág. 20. **Word** carta apaisada, una lámina por hoja.

### Qué se tocó en el compilado (7 reemplazos)

- Los `import` de la hoja apuntan a `../conceptos/v2/` (editor, runtime, láminas,
  modelo —`textoConceptos`— y Word).
- `configurarConceptos` recibe además `useMemo`, `useRef`, `encabezadoIA: Qq` y
  `corregirIA: uU`.
- Tablero del G-3 (`wLe`): si la hoja es `conceptos`, monta el editor con
  `ctx: {...I, unidades: t, orgTarea: a, g3: M, documentos: U?.documentos}` y
  `onExpediente: j` (el mismo expediente de los demás pedidos a la IA).
- `yU` (fuera del Tablero): el editor recibe la orden superior, los documentos y el g3.
- `zle` (expediente): la hoja va como texto legible (`textoConceptos`).
- `ED` (carpeta del G-3): las láminas llevan la unidad, el ejercicio y la clasificación.
- La guía «¿Para qué es y cómo se llena?» de `entrelazados`.

### En el fuente

- La hoja `entrelazados` de tipo `conceptos` monta `v2/editor.js` con el contexto del
  ejercicio y el expediente; o pasar `calcos/conceptos/v2/` a componentes (modelo,
  láminas e IA no dependen de React).
- `zle` / `ED` como arriba y la guía nueva.

### Cómo se comprobó

- `node conceptos.cjs` (11 casos): reversibilidad de la integración anterior; texto
  narrativo y hoja v1 se leen; armado automático con un ejercicio de División
  ficticio (superiores, OD de la organización de la tarea, «(-)», enemigo fuera,
  fases, relaciones; «traer lo que falte» no pisa); láminas del ejemplo del PMTD
  con todo su texto; formato en blanco; 12 unidades con textos largos sin perder
  nada; pedido a la IA; respuesta aplicada (sin pisar, mejorar, relaciones por
  nombre, una sola OD).
- `node e2e/conceptos.cjs` en Chromium, escritorio y teléfono: guía nueva, armado,
  pedido con expediente + idea + información + `.docx` adjunto, respuesta aplicada,
  láminas, Word (validado con `word-conceptos.py`), guardar y reabrir; sin errores
  de JavaScript.
- `npm test` completo y los e2e `plan-fuegos.js`, `carga.js`, `plan-barreras-3d.js`
  pasan. En `academico.js` falla «Se carga la organización que ya existía» también
  con el compilado anterior (3 de 3 corridas): no viene de este cambio.

## 2026-09-28 — 🔥 Plan de fuegos en la pestaña «Fuegos» del Tablero del G-3 (`index-nQKdqwIj.js`)

Parte de `index-conceptos-20260928.js` (la hoja gráfica de conceptos
entrelazados, que a su vez parte de `index-zhbwncsH.js`; ver
`calcos/conceptos/README.md`): trae todo eso y suma esto. Lo pidió Sergio.
La lista EXACTA de reemplazos está en `calcos/pruebas/reemplazos-2026-09-28-fuegos.js`
(13); `reemplazos-compilado.js` comprueba que deshaciéndolos se vuelve byte por
byte a `index-conceptos-20260928.js`, y de ahí (con la lista de
`integrar-conceptos.cjs`) a `index-zhbwncsH.js` y hacia atrás.

### Qué pasaba

- En «🔥 Fuegos», «¿Qué blancos alcanzo hoy?» contaba sólo fichas sueltas. Las
  piezas de artillería o de morteros metidas en una fuerza de tarea o agrupación
  (🧩 Organización de la tarea) no aparecían: daba «0 piezas de apoyo», y no se
  podía ver hasta dónde llegaban sus fuegos.
- Con la pestaña de fuegos abierta, tocar la carta seleccionaba el Área de
  Operaciones: aparecían sus puntos blancos para arrastrar y el cartel «arrastrá
  los puntos para corregir». El AO cubre justo donde van los fuegos.
- No había dónde marcar las concentraciones del plan de fuegos ni sus datos.

### Qué se hizo

El plan de fuegos es código legible APARTE del compilado, como el Estudio, en
`calcos/fuegos/` (lo carga `calcos/index.html` antes del compilado):

- `plan-fuegos.js` — modelo (sin DOM, se prueba en Node) y la vista.
- `plan-fuegos.css` — mismo aspecto que el Tablero del G-3.

**Modo fuegos.** Mientras la pestaña «🔥 Fuegos» está abierta, la carta está en
el mismo `dibujando` que ya usan las herramientas de trazado (`gp`): ninguna capa
(AO, CMOC, límites, plantilla enemiga…) toma el clic ni muestra sus puntos
blancos, y al abrir la pestaña se deselecciona lo que estuviera seleccionado.
Al salir de la pestaña todo vuelve a lo normal.

**Medios de apoyo de fuego**, agrupados por organización:
- las piezas de artillería, morteros y lanzacohetes de cada FT, agrupación o
  unidad pura. Toman el sistema de armas de su unidad orgánica (una batería del
  G.A. con obús M-101 tiene M-101) y, de entrada, la posición de la ficha
  consolidada de la organización (o la de su unidad, si no se consolidó);
- las fichas de artillería, morteros y lanzacohetes que siguen con su unidad;
- las armas de apoyo orgánicas (morteros) de las FT y de las unidades de
  maniobra, con el mismo cálculo que la Mesa (`eh` → influencia; «estimación»).

Cada medio se MARCA (☐) para ver su alcance en la carta: círculo de su color con
el rótulo (y el alcance mínimo punteado cuando el catálogo lo da: obús M-101
2,1 km y LAR-160 12 km, de la misma cita de `p5`). El G-3 cambia el sistema de
armas (catálogo `p5` de la Mesa, con su cita) y la POSICIÓN DE FUEGO: se arrastra
en la carta o se ubica con «📍 Ubicar» (↺ vuelve a la ficha). Eso es el calco de
posiciones: no mueve las fichas.

**Concentraciones.** «🎯 Marcar concentraciones en la carta» y cada toque pone
una (AB-010, AB-011…; `preclick`, como la Línea de vista, así se marca también
encima de una ficha). Cruz negra (la marca del plan de blancos, según el docente)
con su designación, y su forma: puntual, circular (radio), rectangular (largo ×
ancho × orientación) o lineal. En **fucsia** si el medio asignado —o, sin asignar,
ninguno— la alcanza, y dice cuánto tiene que acercarse (o alejarse, si quedó
dentro del alcance mínimo) la pieza. Al arrastrar una posición de fuego las
cruces cambian de color en vivo. Cada una lleva:
- designación; coordenadas MGRS, UTM (WGS-84) y geográficas; cota (del relieve
  de la Mesa, `w9.cota`, editable);
- descripción del blanco; tipo de fuego (preparación, apoyo, contrapreparación,
  protección final/barrera, contrabatería, interdicción, hostigamiento, humo,
  iluminación); efecto (destruir, neutralizar, suprimir, enceguecer, iluminar);
- medio que lo bate (con la distancia y si alcanza); ejecución (a pedido,
  programado, prioritario), hora, fase/evento; munición, espoleta y volumen;
  quién lo observa; propósito; observaciones.

**Blancos enemigos del calco** (lo que era «¿Qué blancos alcanzo hoy?»), ahora
contra todos los medios de apoyo de fuego: batible o fuera de alcance (fucsia,
con cuánto hay que acercarse), un aro fucsia en la carta sobre los que no se
alcanzan, y «🎯 Concentración sobre este blanco».

Se guarda con el ejercicio en `planFuegos: { version: 1, medios: {id: {sistema,
pos, ver}}, blancos: [...], verEnCarta }`. Las concentraciones quedan en la carta
al cerrar la pestaña (se puede apagar). «⬇️ Lista de blancos (Word)» baja la
lista de blancos y el calco de posiciones; la hoja «Matriz de ejecución de apoyo
de fuegos» (F4·P7) se llena con las concentraciones al tocar «🌱 Traer del calco
lo que falte».

Los identificadores de los medios: `pieza:<id de la pieza>`, `ficha:<id>`,
`organica:<id de la ficha>`. No se cambió nada de `orgTarea` ni de las fichas.

### Qué se tocó en el compilado (13 reemplazos)

- Estado `[planFuegos, setPlanFuegos]` y `[modoFuegos, setModoFuegos]`;
  `planFuegos` en lo que se guarda (`Ud`, `BSe`) y en lo que se abre (`mm`); un
  ejercicio con concentraciones no cuenta como vacío (`vS`).
- `gp` (el `dibujando` de la carta) también es verdadero con `modoFuegos`.
- Un efecto que le pasa los datos al módulo (`MesaFuegos.sincronizar`, con `Vd`
  —las fichas como las ve el tablero— y `dn`) y `window.__mesaFuegos` con Leaflet
  (`Rt`), catálogos (`p5`, `dK`, `mK`), cálculos (`eh`, `lP`, `dP`, `uP`, `js`,
  `Xc`) y la cota (`w9.cota`).
- `ILe` (pestaña Fuegos): si está el módulo, monta su panel (`pfMontar`, función
  estable para el `ref`) en lugar de «¿Qué blancos alcanzo hoy?». Los dos cuadros
  del reglamento de abajo quedan igual. Sin el módulo, se ve lo de antes.
- Autollenado de la hoja `fuegos` (`l3e`): si el plan tiene concentraciones, usa
  `MesaFuegos.filasMatriz()` (mismas columnas); si no, lo de antes.

### En el fuente

- Estado `planFuegos` guardado con el ejercicio, `modoFuegos` sumado al
  `dibujando` de la carta, el efecto `sincronizar` y `__mesaFuegos`.
- Pestaña Fuegos: montar el panel (o pasar `calcos/fuegos/` a componentes React
  con la misma lógica del modelo; las capas Leaflet se pueden pasar tal cual).
- Autollenado de la Matriz de ejecución de apoyo de fuegos con las concentraciones.

### Cómo se comprobó

- `cd calcos/pruebas && npm test`: `plan-fuegos-modelo.js` (16 casos con `eh`,
  `p5`, `gK`, `mK` y la librería mgrs reales del compilado): la batería de la FT
  con el obús de su G.A. y la posición de la FT; armas orgánicas; piezas
  repetidas; sin posición; cambio de sistema y posición; dentro, fuera y alcance
  mínimo; el asignado manda; mismo resultado que `gK` de la Mesa (más de 100
  puntos); MGRS igual a la librería de la Mesa en más de 200 puntos (±1 m: esa
  librería redondea distinto; la UTM propia coincide con la serie de Krüger de 6.º
  orden a menos de 0,01 mm); numeración; edición; geometría; columnas de la
  Matriz iguales a las de la hoja; Word. Y `reemplazos-compilado.js` con el paso
  nuevo.
- `npm run e2e`: `e2e/plan-fuegos.js`, 18 casos en Chromium con el ejercicio
  ficticio `ejercicio-fuegos.js` (una FT con una batería de artillería
  consolidada y dos fichas enemigas): sin la pestaña, tocar el AO lo selecciona
  (control); con la pestaña, no, y se marcan concentraciones encima; la cercana
  negra, la lejana fucsia; datos y coordenadas guardados; «📍 Ubicar» la acerca y
  vuelve a negro; arrastrarla demasiado cerca (alcance mínimo) y más atrás; los
  enemigos fuera de alcance; el Word; la Matriz; al salir de la pestaña el AO
  vuelve a seleccionarse; se guarda y se vuelve a abrir; en 3D se ven y se marcan
  sin activar el AO; en el teléfono no desborda. `plan-barreras-3d.js`,
  `academico.js` y `carga.js` siguen pasando.

### Lo que falta

- Ningún reglamento de tiro ni de apoyo de fuegos estuvo a la vista: los tipos de
  fuego, efectos y modos de ejecución son los términos de uso corriente (y los que
  ya usa la Mesa en la MEAF y el Anexo de Apoyo de Fuegos), sin cita. Conviene que
  el docente confirme la lista y los campos de la lista de blancos contra el
  reglamento vigente.
- Los alcances mínimos son sólo los dos que el catálogo trae como «de … a …».
- La cota sale del relieve digital (Terrarium), no de la carta.

## 2026-09-28 — Un solo pedido de las capas al cambiar el área (`index-zhbwncsH.js`)

Parte de `index-sxnJI1Ur.js`: trae todo lo de abajo y suma esto. Salió de
preparar el servidor para una clase con unos 45 alumnos generando calcos a la vez
(`calcos/pruebas/carga.html`). La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-09-28.js`; `reemplazos-compilado.js` comprueba
que deshaciéndolos se vuelve byte por byte a `index-sxnJI1Ur.js` (y, deshaciendo
también los del 27, a `index-4OsERrlJ.js`).

### El pedido doble

- Cada vez que cambiaba el Área de Interés (por ejemplo, al abrir la BASE del G-3
  con `?puesto=g2`), la Mesa mandaba a `calcos-datos` DOS pedidos `recortar`
  iguales con las capas prendidas del tablero (`hidro_lineas` +
  `poblaciones_puntos` por defecto), con unos 10 ms de diferencia. El servidor
  procesaba los dos: con toda la clase abriendo la BASE a la vez, el doble de
  trabajo justo al empezar.
- Causa: el efecto que trae las capas prendidas depende de `[X,Ae,Ce]` (país,
  área y el contador que versiona la caché `tt`, con clave `${pais}:${capa}:${Ce}`).
  Otro efecto, con `[Ae]`, sube `Ce` cada vez que cambia el área. El primero
  corría una vez por `Ae` y, un render después, otra por `Ce`. La limpieza
  (`ot=!1`) descartaba el primer resultado, pero el `fetch` ya había salido.
- En modo archivos (escritorio) pasaba lo mismo con los GeoJSON del disco: cada
  capa prendida se leía dos veces al arrancar y tres al abrir una BASE.

### Qué se tocó

- Un `useRef` nuevo, `ceAnterior`, al lado de `tt`.
- El efecto de `[Ae]` anota en `ceAnterior` el valor de `Ce` antes de subirlo.
- El efecto de las capas prendidas no corre mientras `Ce` siga en ese valor:
  corre una sola vez, un render después, ya con el contador nuevo. Lo que trae
  queda en la caché con la clave nueva, así que ⚡ GENERAR CALCOS sigue sin volver
  a pedir esas capas. Un cambio de país sin cambio de área corre como siempre.
- No se usó un AbortController: el primer pedido ya salió cuando se cancela, y el
  servidor lo procesa igual. Tampoco se sacó `Ce` de las dependencias: el pedido
  quedaría guardado con la clave vieja y ⚡ GENERAR lo repetiría.

### En el fuente

- En el efecto que sube el contador: `ceAnterior.current = Ce` antes de
  `setCe(c => c + 1)`. En el efecto de las capas prendidas, al principio:
  `if (Ce === ceAnterior.current) return`. (Mejor todavía: derivar la versión de
  la caché del área misma, sin un segundo render.)

### Cómo se comprobó

- `cd calcos/pruebas && npm ci && npm test`: `reemplazos-compilado.js` ahora
  deshace la cadena entera (28 → `index-sxnJI1Ur.js`, 27 → `index-4OsERrlJ.js`,
  SHA-256 en cada paso).
- `npm run e2e`: `e2e/carga.js`, 6 casos en Chromium con `calcos-datos` simulado.
  La Mesa real en modo servidor abre la BASE (un pedido), aprieta ⚡ GENERAR
  CALCOS (una capa por pedido, sin repetir las dos del tablero) y cambia de país
  sin cambiar el área (un pedido). En modo archivos, cada capa prendida se lee
  una vez. La página de carga, con un alumno, repite exactamente la misma
  secuencia que la Mesa. Con `COMPILADO=<index-sxnJI1Ur.js> node e2e/carga.js`
  fallan 3 de 6: los dos de la Mesa (dos pedidos al abrir; tres lecturas por
  capa) y la comparación con la página, que depende del primero. Con éste pasan
  los 6. `plan-barreras-3d.js` (14) y `academico.js` (20) siguen pasando.

## 2026-09-27 — El plan de barreras se traza en 3D, y 🎓 Estudio doctrinario (`index-sxnJI1Ur.js`)

Parte de `index-4OsERrlJ.js`: trae todo lo de abajo y suma esto. Lo pidió Sergio.
La lista EXACTA de reemplazos (texto buscado → texto nuevo) está en
`calcos/pruebas/reemplazos-2026-09-27.js`; `reemplazos-compilado.js` comprueba
que deshaciéndolos se vuelve byte por byte a `index-4OsERrlJ.js`.

### Plan de barreras en 3D (y en 2D)

Se reprodujo en Chromium con un ejercicio de unidades ficticias. Había tres causas:

1. **La plantilla situacional enemiga se quedaba con el clic.** Sus arcos de
   apoyo, bandas, líneas y fichas (`lve`) eran la única capa que seguía
   `interactive` mientras se traza: el clic abría el cartel «🔶 ARCO DE APOYO»
   y el vértice no se ponía. El arco cubre justo el terreno propio donde va el
   plan de barreras («bate hasta N km de NUESTRO lado de la LPR»). Pasaba en 3D
   y también en 2D: con el arco encima no se podía poner ni una alambrada, ni una
   demolición, ni un campo minado, ni una posición defensiva.
   - `lve` recibe `dibujando` (lo mismo que ya recibían el CMOC, las medidas y el
     terreno) y sus capas quedan `interactive:!dj` mientras se traza; se
     redibujan al empezar y al terminar (`dj` en las dependencias del efecto).
2. **Con el dedo (iPad, teléfono) las líneas y las áreas no se terminaban en 3D.**
   Safari no manda `dblclick` después de un doble toque; en 2D Leaflet lo simula,
   el espejo 3D (`yze.mando`) no. Tampoco llegaba el toque largo (clic derecho).
   - Dos toques en ≤ 400 ms y ≤ 30 px (marcas de tiempo del evento) = doble clic
     a la carta. Si el navegador además manda su propio `dblclick` (Chrome), no
     se repite (ventana de 1,5 s).
   - Dedo quieto 600 ms (≤ 15 px) = `contextmenu` (termina la línea, como el
     clic derecho). El `click` que pueda venir al levantar el dedo se ignora.
   - Al apoyar el dedo se sincroniza el zoom por doble toque de MapLibre con el
     de Leaflet (antes sólo con `mousedown`): dibujando, el doble toque no hace zoom.
3. **En 3D las distancias en píxeles se medían en la carta plana escondida**, que
   tiene otra escala (medido: 30 px de la pantalla 3D son entre 2 y 15 px en la
   carta Leaflet). «Tocar el primer vértice para cerrar el Área de Operaciones»
   (12 px) cerraba el área tocando lejos, y la manija ⟳ de giro de tareas y
   magnitudes (55 px) aparecía desde muy lejos.
   - `pxVista(m, ll)`: si el 3D está abierto (`window.__map3d`) mide con su
     proyección; si no, con la de Leaflet como siempre. Se usa en `Yt` (Ave) y en
     la manija de giro.

### 🎓 Estudio doctrinario (material didáctico)

Botón «🎓 Estudio» en la barra (al lado de «🎖️ Mesa EM»). El código es legible
y está APARTE del compilado, en `calcos/academico/` (lo carga `calcos/index.html`
antes del compilado):

- `academico.js` — modelo (sin DOM, se prueba en Node) y las dos vistas.
- `catalogo-simbologia.js` — fichas y láminas de simbología.
- `academico.css` — mismo aspecto que «🧩 Organización de la tarea».

**🧩 Organización académica.** Usa la MISMA `orgTarea` del ejercicio:
- Clase de cada organización: `clase: "ft" | "pura" | "agrupacion"` (+ `arma`
  en la unidad pura: ingeniería, artillería o caballería). `ft` sigue mandando,
  así que «🛡️ Convertir en Fuerza de Tarea» del panel de siempre funciona igual.
  Una organización de antes, sin `clase`, se lee como FT (si tiene `ft`) o como
  agrupación táctica. No se cambian identificadores ni se borran campos.
- Por cada elemento (pieza), el TIPO (arma y escalón; no cambia) separado de la
  PERTENENCIA (a qué organización está integrado, o «con su unidad orgánica»).
  El docente la cambia a mano; al mover un elemento se saca de cualquier otra
  organización, así que nunca queda repetido.
- Validación: elemento en dos organizaciones o dos veces en una (con botón
  «Dejarla sólo en…»), elementos que ya no están en el calco, unidad pura con
  otra arma, fichas del calco repetidas (mismo `agId`), unidades con el mismo
  id o la misma designación, ficha consolidada con otra composición,
  organizaciones vacías. No obliga a integrar: las unidades que conservan todos
  sus elementos se muestran como «unidades orgánicas puras».
- Actividades académicas (pregunta, lectura, análisis doctrinario) vinculadas a
  mano a una unidad o a una organización. Se guardan con el ejercicio en
  `academico: { version: 1, actividades: [...] }`. No son órdenes ni asignan
  nada: no tienen campos de tarea, misión, fuego ni objetivo.
- Edita sólo el puesto del instructor (y, en la versión publicada, con sesión
  de profesor de SIDECEME: `SIDECEME_CALCOS.esProfesor`); los puestos ven todo
  en sólo lectura. Es una guía de pantalla, no un permiso.
- Con el calco vacío ofrece cargar un ejemplo con cuatro unidades FICTICIAS.

**📕 Simbología doctrinaria.** Ocho láminas sin carta ni coordenadas (marco,
magnitud, armas, agrupación/FT, símbolos abreviados, obstáculos, tareas tácticas
y consultas pendientes), 102 fichas. Cada ficha: denominación e imagen tal como
la dibuja la Mesa, la referencia que la propia Mesa declara (documento,
apartado, página y de dónde sale la cita) y su estado de verificación.
**Ningún reglamento de simbología estuvo disponible**: ninguna ficha está
verificada y no se redactó explicación doctrinaria. La «cruz negra» lleva lo
que indicó el docente el 28-09 (cruz recta negra, simple: marca un blanco del
plan de blancos), rotulado «según el docente» y todavía sin cita de reglamento.

Qué se tocó en el compilado para conectarlo:
- Estado `[acadMesa, setAcadMesa]`; `academico` en lo que se guarda (`Ud`, `BSe`)
  y en lo que se abre (`mm`); un ejercicio con actividades no cuenta como vacío (`vS`).
- Un efecto que le pasa los datos al módulo (`MesaAcademica.sincronizar`) y
  `window.__mesaSimbolos` con los dibujos (`sb`, `eN`, `cb`, `VK`) y catálogos
  (`pLe`, `fl`, `T1`, `Nm`, `zg`, `lP`, `tN`, `js`).
- «🧩 Organización de la tarea»: no deja meter una pieza que ya está en otra
  agrupación; muestra la marca «PURA»; «quedan N piezas sin repartir» pasa a
  «N pieza(s) siguen con su unidad orgánica (no es obligatorio repartirlas)»; y
  una pieza repetida ya no achica dos veces a su unidad (`Vd`).

### En el fuente

- Leaflet/espejo 3D: el `mando()` del espejo (doble toque, toque largo, sincronía
  del zoom al tocar) y `pxVista` en las cercanías medidas en píxeles.
- Plantilla situacional: pasarle `dibujando` y no dejarla interactiva mientras
  se traza.
- Estudio: estado `academico` guardado con el ejercicio, el efecto
  `sincronizar`, el botón y `__mesaSimbolos`. `calcos/academico/` se puede
  importar tal cual (o pasar a componentes React con la misma lógica del modelo).
- Organización de la tarea: guardia de piezas repetidas, marca PURA, texto del pie
  y conteo sin repetidos en `Vd`.

### Cómo se comprobó

- `cd calcos/pruebas && npm install && npm test`: además de las dos de antes,
  `academico-modelo.js` (15 casos: organización existente, FT y pura juntas,
  tipo vs. pertenencia, edición manual, repetidos, huérfanos, ids, actividades,
  ejemplo ficticio; con `tN`/`js` reales del compilado), `simbologia-referencias.js`
  (9 casos: cada ficha con referencia y estado, ninguna «verificada», las citas
  están letra por letra en el código, la cruz negra no verificable) y
  `reemplazos-compilado.js` (deshacer = compilado anterior, SHA-256).
- `npm run e2e` (Chromium con Playwright, sin red: los tiles se generan en la
  prueba). `e2e/plan-barreras-3d.js`, 14 casos: ratón en 3D y en 2D encima del
  arco enemigo (alambrada, demolición, campo minado, posición defensiva), dedo
  en 3D como Safari del iPad (doble toque y toque largo) y cierre del Área de
  Operaciones en 3D. Con `index-4OsERrlJ.js` fallan 12 de 14 (andaban la
  demolición con el dedo y cerrar el área tocando justo el primer vértice); con
  éste pasan los 14. `e2e/academico.js`, 20 casos en
  escritorio (1440×900) y teléfono (390×844): organización de antes con sus id,
  FT y pura juntas, pertenencia, repetidos, actividades guardadas y vueltas a
  abrir, panel de siempre con la marca PURA, sólo lectura para los puestos,
  ejemplo ficticio, láminas y fichas, sin desborde horizontal, sin errores de JS.

### Lo que falta

- Los reglamentos de simbología (EAA-15-29 —al menos la Figura 6—, EAA-15-07 /
  RC-02-15, RC-02-114 y RC-02-108) para verificar cada ficha, anotar la página y
  redactar la explicación; y la página donde el reglamento define la cruz del
  plan de blancos.
- No se pudo probar en un iPad real (no hay WebKit acá): el caso de Safari se
  reprodujo en Chromium cortando el `dblclick` del doble toque.
- La app de escritorio tiene que llevar también `calcos/academico/`.

## 2026-09-27 — H.T. 19 dice quién es cada OC/OD, y ninguna ficha enemiga en el lago (`index-4OsERrlJ.js`)

Parte de `index-oeww4UiF.js`: trae todo lo de abajo y suma esto. Lo pidió Sergio.

### H.T. 19: quién es OC-1, OC-2, OC-3 y OD

- En el formulario, cada renglón de MANIOBRA tiene su campo «Unidad». Se guarda
  en la hoja con la clave `MANIOBRA|<OC-1…OD>|Unidad`, y `vD()` lo muestra como
  «OC-1 · <unidad>» en el formulario, la vista previa, los dos Word y los rótulos
  que recibe la IA. Lo que escriba el docente manda.
- «Traer del calco lo que falte» lo propone (sólo si el campo está vacío) con las
  fichas de maniobra del CAE MÁS PROBABLE (`fasesCOA.enemigo` con
  `coa: "probable"`; sin fases, las fichas del calco):
  - OD: la ficha que la plantilla marca «(OD)». Si ninguna lo está, no propone
    nada y lo escribe el docente.
  - OC: el resto de las fichas de maniobra (roles `e1`, `e2`, `flanqueo`,
    `reserva`) numeradas «de acuerdo a la proyección de ocurrencia» y, si son
    simultáneas, primero la de mayor poder de combate (texto del PMTD 2017):
    primer escalón → segundo escalón → reserva; empate, el de mayor escalón.
  - En «ARMAS»: OC-1 BAT. INF. BLIN. «CARAMPAGUÉ» (AMARRE), OC-2 RESERVA,
    OD G. BLIN. 9 «VENCEDORES» (OD).
- Arreglo de paso, que ya estaba mal: con los dos CAE acostados, «Traer del
  calco» ponía como columnas las 8 fases de los dos cursos (con nombres
  repetidos), y en una hoja ya escrita en FASE I…IV lo escrito quedaba oculto
  (en «ARMAS» se veían 8 de 148 textos). Ahora toma sólo las 4 fases del CAE
  más probable, y si la hoja ya tiene texto en FASE I…IV no le cambia las
  columnas.

### Fichas enemigas fuera del agua

- El calco sólo baja agua dentro del Área de Interés, y las fichas enemigas
  quedan afuera: en «ARMAS» la fase 1 dejaba 5 fichas (CAE más probable) y 4
  (CAE más peligroso) en el Lago Menor.
- `AGUA_LAGOS`: contorno del lago Titicaca de Natural Earth 1:10m (dominio
  público, 401 vértices, error del orden de 1 km). `fueraDelAgua([lng, lat])`
  lleva un punto que cae en el lago a la costa más cercana y 1,5 km tierra
  adentro (3 o 5 km si hace falta); en tierra no lo toca. `sinAguaFicha()` hace
  lo mismo con una ficha enemiga; las propias no se tocan.
- Se aplica en cuatro lugares: al armar cada fase de los CAE (`gCe`), al tocar
  una fase ya guardada (`Uo`, así se corrigen los ejercicios que ya estaban),
  y al dibujar las fichas de la plantilla en 2D y en 3D.
- Otros lagos no están: si aparece uno, se suma su contorno a `AGUA_LAGOS`.

### En el fuente

- Rótulo del renglón de la H.T. 19: leer `MANIOBRA|<ítem>|Unidad`. Formulario:
  un campo por ítem de MANIOBRA. Autollenado: el bloque que propone esas claves.
- Autollenado de la H.T. 19: filtrar `fasesCOA.enemigo` por `coa === "probable"`
  y no poner `_fases` si la hoja ya tiene texto por fase.
- Agregar el contorno y `fueraDelAgua` donde se arma cada ficha de cada fase,
  donde se aplica una fase guardada al mapa, y donde se dibujan las fichas de la
  plantilla (2D y 3D).

### Cómo se comprobó

- `cd calcos/pruebas && npm test`: `ht19-autollenado.js` (15 casos con
  `--base`) y `fichas-fuera-del-agua.js` (7 casos con `--base`: usa `gCe` real).
  Con el compilado anterior fallan los casos nuevos.
- En Chromium, con la H.T. 19 y las fases guardadas de «ARMAS»: «Traer del
  calco» llena las tres unidades; el Word sale con «OC-1 · BAT. INF. BLIN.
  «CARAMPAGUÉ» (AMARRE)»… y los 148 textos visibles en FASE I…IV; al tocar la
  FASE 1 de cada CAE, ninguna de las 16 fichas enemigas queda en el lago (antes,
  5 y 4). Sin errores de JavaScript.
- Deshaciendo estos reemplazos se vuelve byte por byte a `index-oeww4UiF.js`.

## 2026-09-27 — H.T. 19: «Con qué fuerza» sin los PC y con plurales correctos (`index-oeww4UiF.js`)

Parte de `index-zHea8q-_.js`: trae todo lo de abajo y suma esto.

### Qué pasaba

- Al llenar la H.T. 19 desde el calco (sólo cuando el campo está vacío),
  «Con qué fuerza» contaba las fichas enemigas por escalón y le agregaba «es»
  a cualquier escalón, sin tildes. Con las 16 fichas de la plantilla de la
  1ra. Brigada Acorazada daba «5 batallones · 9 companiaes · 1 seccion ·
  1 brigada».
- También contaba los puestos de mando (`tipo: "pc"`): el «1 brigada» era el
  PC 1RA. BRIG., y dos de los «batallones», los PC BAT. «Quién» también los
  listaba.

### Qué se cambió (dos reemplazos en `UIe`, caso `ht19`)

- «Con qué fuerza» usa el singular y el plural de los diez escalones de la
  app: equipo, escuadra, sección, compañía, batallón, regimiento, brigada,
  división, cuerpo de ejército y ejército. Un escalón que no esté en la lista
  queda tal cual, sin plural inventado. Sin escalón sigue contando como
  batallón.
- «Quién» y «Con qué fuerza» toman sólo las unidades enemigas
  (`(tipo || "unidad") === "unidad"`), el mismo criterio que el resto del
  autollenado: quedan fuera los PC y las instalaciones. Lo decidió Sergio el
  27-09. La CÍA. TELECOM. es una unidad y sigue contando.
- Con las 16 fichas queda «3 batallones · 9 compañías · 1 sección», y «Quién»
  con las 13 unidades.
- Como antes, sólo se llena lo vacío (`iq()`): lo ya escrito no cambia.

### En el fuente

En el autollenado de la H.T. 19, donde se arman «Quién» y «Con qué fuerza»:
filtrar las fichas enemigas con `(tipo || "unidad") === "unidad"` en vez de
`tipo !== "instalacion"`, y armar «Con qué fuerza» con un diccionario
escalón → [singular, plural] en lugar de agregar «es».

### Cómo se comprobó

- `calcos/pruebas/ht19-autollenado.js` (`cd calcos/pruebas && npm install &&
  npm test`): extrae `UIe`, `vD` e `iq` del compilado que carga
  `calcos/index.html` y los corre en Node. También vigila el arreglo anterior
  (sin `_ocsNom`). Con `--base <compilado anterior>` muestra el antes y el
  después, y compara el resto del autollenado de la H.T. 19 en cuatro
  escenarios: queda idéntico. Con el compilado anterior fallan 5 de los 7
  casos; con éste pasan todos (8 con `--base`).
- En Chromium, con la app: con la H.T. 19 vacía y las 16 fichas, «Traer del
  calco lo que falte» propone lo de arriba; con la H.T. 19 de «ARMAS», que ya
  tiene texto, no cambia nada.

## 2026-09-27 — H.T. 19: los renglones OC-1…OD ya no llevan una unidad elegida por escalón (`index-zHea8q-_.js`)

Parte de `index-eiGjBHyz.js`: trae todo lo del 26-09 (más abajo) y suma esto.

### Qué pasaba

- El autollenado de la H.T. 19 (`UIe`, caso `ht19`) ordenaba las fichas
  enemigas por escalón y les daba las cuatro más grandes a OC-1, OC-2, OC-3 y
  OD, en ese orden, sin mirar el rol de cada ficha. Lo guardaba en
  `ht19._ocsNom`.
- `vD()` le pegaba ese nombre al rótulo del renglón («OC-1 · brigada Cab.
  Mec.») en el formulario, en los rótulos que recibe la IA, en la vista previa
  y en los dos Word.
- `iq()` no pisa lo ya guardado, así que el nombre quedaba congelado. En el
  ejercicio «ARMAS» se grabó el 27-09 a las 08:22 UTC, cuando el calco tenía
  una sola ficha enemiga (una brigada de Caballería Mecanizada sin
  designación). Siguió saliendo después de acostar la plantilla situacional
  (16 fichas) y de que esa brigada ya no estuviera en el calco.
- Recalcularlo tampoco servía: con esas 16 fichas daba OC-1 = PC 1RA. BRIG.,
  OC-3 = G. BLIN. 9 «VENCEDORES» (OD) y OD = G.A.AP. «SALVO».

### Qué se cambió (dos reemplazos)

- `vD(t,e)` devuelve el renglón de la plantilla tal cual (`OC-1`, `OC-2`,
  `OC-3`, `OD`); ya no lee `_ocsNom`.
- El caso `ht19` de `UIe` ya no arma `_ocsNom`. «Quién», «Con qué fuerza»,
  «Cuándo» y el resto del autollenado quedan igual.
- No se borra nada guardado: el `_ocsNom` que ya tenga un ejercicio sigue en
  los datos, pero no se muestra ni se exporta.
- Qué ficha es OC-1, OC-2, OC-3 u OD lo escribe el docente o el cursante; la
  app no lo deduce.

### En el fuente

Buscar `_ocsNom` y `["OC-1","OC-2","OC-3","OD"]`: sacar el reparto por escalón
del autollenado de la H.T. 19 y que la función que arma el rótulo del renglón
devuelva el ítem sin agregarle nombre.

### Cómo se comprobó

- Las funciones reales del compilado (`UIe`, `vD`, `iq`, `I3e`, `ED`, `KS`),
  con la H.T. 19 y las fichas guardadas de «ARMAS»: antes el rótulo era
  «OC-1 · brigada Cab. Mec.»; ahora es «OC-1», y las 148 celdas de texto salen
  idénticas, con su «[IA — verificar]».
- En Chromium, con la app: formulario, vista previa, Word y Word (formato
  militar), también después de «Traer del calco lo que falte». Con el
  compilado anterior, el Word (formato militar) sale idéntico al que se
  entregó; con este, la única diferencia es esa celda.
- Rápida para cualquier sesión: `grep -c _ocsNom` sobre el compilado que carga
  `calcos/index.html` tiene que dar 0.

## 2026-09-26 — H.T. 13 con todas las fases, y 3D más liviano (`index-eiGjBHyz.js`)

### H.T. 13 «Tácticas, técnicas y procedimientos» (hoja `ht13`, tipo `fasesSOCB`)

- `fases` por defecto: las cuatro del ataque, las mismas de `FASES_CAE` del
  Manual Rojo (RDO-20001, Art. 900, Tabla 9). Las dos primeras conservan el
  nombre de antes para que lo ya escrito se siga viendo:
  - FASE I — Ramificación
  - FASE II — Apresto lejano
  - FASE III — Ataque propiamente tal (aproximación, asalto, irrupción, penetración)
  - FASE IV — Ruptura, consolidación y explotación del éxito
- `plantillasFases` (botones sobre la lista de fases):
  - «⚔️ Ataque · RDO-20001»: las cuatro de arriba.
  - «⚔️ Ataque · RC-02-107»: las fases del CAE con Fuerzas Contrarias
    (aproximación y despliegue, ataque del primer escalón, empeño del segundo
    escalón, consolidación sobre el objetivo).
  - «🗺️ Maniobra operacional» (RDO-20001, Art. 652-715): preparación
    (concentración, despliegue, cobertura y vigilancia), ejecución (aproximación
    y batalla), término y operaciones posteriores.
  - «📍 Las del calco»: aparece si hay `fasesCOA.enemigo` trazadas.
  - Se resalta la que corresponde a la doctrina elegida en la PICB
    (`picb._pd.manual`).
- Editor de fases:
  - Las claves de los casilleros son `SOCB|fase|columna`: al renombrar una
    fase, lo escrito se muda al nombre nuevo (antes quedaba huérfano).
  - No se aceptan dos fases con el mismo nombre.
  - «＋ Fase» numera en romanos.
  - «− Quitar la última» y el cambio de plantilla avisan si la fase tiene
    texto. No se borra nada: si vuelve una fase con ese nombre, reaparece.
- El panel de la PICB (`iLe`) le pasa a la hoja `fasesCOA` y la doctrina.
- La ayuda de la hoja explica fases del ataque vs. maniobra operacional y
  suma un ejemplo del ataque propiamente tal.

### Vista 3D (`vze`)

- Fuentes `dem` y `demSombra`: `maxzoom` 14 → 13. El SRTM es de ~30 m y z13 ya
  da ~18 m por píxel; z14 sólo agregaba descarga. Con la cámara baja o
  «parado» en el terreno baja entre 50 y 60 % menos de relieve.
- `pixelRatio: Math.min(devicePixelRatio, 1.5)`: en pantallas retina la placa
  de video dibuja un 44 % menos de píxeles.
