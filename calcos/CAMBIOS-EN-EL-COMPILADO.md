# Cambios hechos directamente sobre el compilado de la Mesa del EM

El código fuente de la Mesa del EM (Vite/React) no está en este repositorio:
`calcos/assets/index-*.js` es el compilado. Los cambios de abajo se hicieron
sobre ese compilado. **Si se vuelve a compilar desde el fuente, hay que pasarlos
al fuente o se pierden.**

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
