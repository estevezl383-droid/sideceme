# Cambios hechos directamente sobre el compilado de la Mesa del EM

El código fuente de la Mesa del EM (Vite/React) no está en este repositorio:
`calcos/assets/index-*.js` es el compilado. Los cambios de abajo se hicieron
sobre ese compilado. **Si se vuelve a compilar desde el fuente, hay que pasarlos
al fuente o se pierden.**

## 2026-09-28 — Cuánto tardan los trabajos de ingeniería con la ingeniería que tenemos (`index-pB4lmorB.js`)

Parte de `index-zhbwncsH.js`: trae todo lo de abajo y suma esto. El pedido:
«proyectar cuánto tiempo costaría realizar esos trabajos considerando las fuerzas
de ingeniería que tenemos, las que se plantearon en los documentos adjuntos del
ejercicio». La lista EXACTA de reemplazos está en
`calcos/pruebas/reemplazos-2026-09-28-ingenieria.js`.

### Qué pasaba

- El panel 🛡️ Defensa («⏱️ ESFUERZO DE INGENIERÍA») y la barra de abajo («PLAN
  DE BARRERAS») calculaban con la casilla «Secciones al trabajo», que arrancaba
  en **1** y no miraba ni los documentos del ejercicio ni el calco. En «ARMAS»
  (2 zanjas antitanque de 3233 m y 1248 m y 8 bloqueos) decían «374 h de reloj
  con 1 sección» y «15.6 días».
- La OGO 01/35 adjunta a «ARMAS» (Organización de la tarea) da el **BATING.
  MEC.-II «ROMÁN»**: Comp. Ing. Comb. «A» y «B», Comp. Ing. Eq. Pes., Comp. Ing.
  Puentes, Comp. Mtto. Ing. y Comp. C y S.
- El tablero del G-3 (pestaña ⏱️ Barreras) sí contaba la ingeniería, pero sólo la
  del calco (la ficha sin nombre de «ARMAS», un regimiento = 9 secciones), así que
  cada lugar decía otra cosa.
- El panel hablaba de «jornadas de 10 h» y la barra de «días» de 24 h, sin decirlo.

### Qué se hizo

- **`fuerzaIngenieria(documentos, unidades, manual)`** (función nueva): lee la
  Organización de la tarea de los «Documentos del ejercicio» —primero el de
  categoría Orden, después medios y bases; nunca el Anexo de Inteligencia— tanto
  en la tabla Markdown (el `.docx.md`) como en el texto plano del Word. Salta el
  párrafo «Fuerzas enemigas» (ahí puede estar la ingeniería del enemigo). Separa:
  - ingenieros de combate: construyen los obstáculos → **3 secciones por
    compañía y 1 por sección** (la misma tabla por escalón que ya usaba la Mesa,
    `qCe`, marcada ✎ estimación);
  - equipo pesado: pone las máquinas (el «equipo mecánico» del cálculo);
  - puentes, mantenimiento y comando/servicios: no construyen obstáculos.
  - Si la orden sólo nombra el batallón, estima por su escalón. Si los documentos
    no dicen nada, usa las fichas de ingeniería del calco; si tampoco hay, 1
    sección supuesta y lo avisa.
  - En «ARMAS»: **6 secciones** (180 hombres) → **62 h de trabajo = 6,2 jornadas
    de 10 h (7 días de trabajo), o 2,6 días trabajando las 24 h con relevos**. Con
    las máquinas de la Comp. Ing. Eq. Pes., unas 6 h.
- La Mesa calcula esa fuerza una sola vez (`fuerzaIngMesa`) y la pasa a la barra,
  al panel 🛡️ Defensa y al tablero del G-3 (y, por él, a las hojas que se siembran
  del calco). «Secciones al trabajo» arranca vacía (`null`): lo que se escriba a
  mano manda, y «↺ usar las de la orden» vuelve.
- **Panel 🛡️ Defensa**: «🛠️ Con qué lo hacemos» (documento, unidad, compañía por
  compañía y cuántas secciones construyen) y «⏱️ Cuánto tarda · apreciación»
  (horas de trabajo, jornadas de 10 h y días de trabajo, días de 24 h con
  relevos, la cuenta hombres-hora ÷ hombres, y con las máquinas si la orden da
  equipo pesado).
- **Barra de abajo**: título «PLAN DE BARRERAS · 62 h DE TRABAJO = 6,2 JORNADAS DE
  10 h · CON 6 SECC. DE INGENIERÍA»; bloques nuevos «Ingeniería que tenemos» y
  «Tiempo de trabajo · apreciación»; «Equipo mecánico» avisa si la orden da la
  compañía de equipo pesado; «Los trabajos» dice con cuántas secciones son las
  horas.
- **Tablero del G-3 · ⏱️ Barreras**: calcula con la misma fuerza, muestra «Con qué
  lo hacemos» y el tiempo en jornadas; el aviso «No hay ninguna unidad de
  INGENIERÍA» sólo sale si tampoco la dan los documentos.
- Un trabajo de menos de una hora se dice en minutos (con 6 secciones un bloqueo
  es «1 min», no «0 h»).
- No cambian los rendimientos (hombres-hora por metro, por mina o por obra), ni
  lo que se guarda con el ejercicio.

### En el fuente

- Un módulo con `fuerzaIngenieria` y lo que usa (`ING_CLASE`, `ingTrozos`,
  `leerIngenieriaDoc`, `ingTiempo`, `ingHoras`) y dos componentes
  (`IngConQue`, `IngCuanto`) más `ingResumen` para la barra.
- En la Mesa: `seccionesTrabajo` con `null` por defecto y
  `useMemo(() => fuerzaIngenieria(documentos, unidades, seccionesTrabajo))`;
  pasar `fuerza.secciones` y `fuerza` a la barra, al panel de Defensa y al
  tablero del G-3 (y a `VCe` como `seccionesIng`).

### Cómo se comprobó

- `cd calcos/pruebas && npm ci && npm test`: `ingenieria-fuerza.js` (14 casos)
  corre las funciones del compilado sobre la Organización de la tarea de la OGO
  01/35 (`ogo-organizacion.js`, en Markdown y en texto de Word): el BATING. MEC.-II
  con sus cinco compañías y 6 secciones, sin la ingeniería enemiga, sin contar dos
  veces una compañía nombrada en una frase; la orden manda sobre la ficha del
  calco; el Anexo de Inteligencia no cuenta; calco, supuesta y a mano; el plan de
  «ARMAS» da 374 h con 1 sección (lo que mostraba la barra) y 62 h con las 6.
  `reemplazos-compilado.js` deshace la cadena entera (SHA-256 en cada paso).
- `node e2e/ingenieria-tiempo.js` (15 casos en Chromium): barra, panel 🛡️ Defensa,
  corrección a mano y vuelta a la orden, tablero del G-3, sin orden (ficha del
  calco: 9 secciones) y sin nada (1 supuesta), sin errores de JavaScript. Con
  `index-zhbwncsH.js` fallan todos menos los de «sin errores». De
  `plan-barreras-3d.js` se corrieron los 5 primeros casos (ratón en 3D y en 2D) y
  pasaron; esa corrida, `academico.js` y `carga.js` se cortaron antes de terminar
  para subir el cambio: hay que repetirlas (`npm run e2e`).

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
