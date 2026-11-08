# ⚔️ El evento crítico: el CAE del G-2 contra el CAP del G-3, listo para el Juego de Guerra

Lo pidió Sergio el 25-10-2026, con los pasos de la F4·P7 a la vista: que en la **Matriz de sincronización** salga «el
evento más crítico», donde se carguen la fase del enemigo ROJO que desarrolló el G-2 y la del G-3 «para que se
enfrenten», guardadas y «listas para jugar» en el Juego de Guerra.

**Dónde va y por qué ahí**: en la **F4·P6-7 Matriz de sincronización**. El PMTD 2017 dice que la matriz «permite
sincronizar el curso de acción para que coincida en tiempo, espacio y propósito en relación con el curso de acción más
probable del enemigo» y que es donde se registran los resultados del Juego de Guerra. La plantilla sustentadora de la
decisión sale **después**, de la matriz ya jugada.

## 🎖️ La decisión del Comandante: CAP 1 o CAP 2 (08-11-2026)

Sergio, con esta hoja abierta: «aquí es donde someto a juego de guerra las fases, el más probable y el más peligroso;
quiero una opción donde diga: después de sometido a juego de guerra el Comandante se decidió por el CAP 1 o CAP 2, para
que en base a eso ya se desarrolle el resto del planeamiento y recién se rellene» la matriz. Y: «resaltar esta hoja»,
«reducir el texto… que sea sólo de ejecución… que no haya tanto texto pequeño que no se lee».

La hoja ahora es **🎖️ DECISIÓN DEL COMANDANTE**, en tres pasos (`① Juego de guerra → ② Decisión → ③ Matriz`):

1. **① JUEGO DE GUERRA · CAP contra CAE** — lo de siempre (abajo), más corto: 🔵 CAP 1 / CAP 2, 🔴 CAE más probable /
   más peligroso, cada fase con la que enfrenta y la medida en una línea (el detalle, al pasar el mouse). 💾 Guardar y
   ⬇️ Bajar para el Juego. Se pliega una vez decidido (se abre tocando el título).
2. **② ¿QUÉ CAP DECIDIÓ EL COMANDANTE?** — dos botones grandes (CAP 1 / CAP 2, con su nombre y sus fases). Al tocar uno:
   - la Mesa **pasa a ese CAP** (la misma acción que el botón del F3·P6: sus fases 🔵, su F3·P4 y su F3·P6 quedan donde
     la Mesa las busca siempre), así que **todo lo que sigue** (F4·P7, F5, F6, F7, el Word, la OPORD, el Juego) va con él;
   - queda `g3._caps.decision = { cap, t }` (los que escriben `_caps` copian lo que tenía: sobrevive a los cambios de
     CAP). `capAprobado` (orden-preparatoria/v1/prep.mjs) lo pone primero: la Orden Preparatoria N° 3 y la Orden
     General de Operaciones van con el CAP decidido aunque después se mire el otro; la Guía de Planificación Final dice
     «mi decisión es que el CAP N° n…» si la F6·P1 está vacía (estado-mayor/v8/campos/cmte.js);
   - **↺ Cambiar la decisión** la borra (la matriz no se toca). Con el otro CAP a la vista: «⚠️ A la vista está el
     CAP 1 · Volver al CAP 2».
3. **③ La matriz** — 🌱, 🤖 y la rejilla recién con la decisión y ese CAP a la vista (antes: «🔒 La matriz se llena
   después de la decisión. Ya tiene n casilla(s): se guardan.»). La matriz es la del CAP decidido (`sincro._cap`): si la
   hoja tenía la de otro CAP, queda en `sincro._matrices[n]` y vuelve si se decide ese CAP; una vacía arranca con las
   columnas de sus fases («FASE 1»…, como 🌱). El pedido de la IA lleva «DECISIÓN DEL COMANDANTE» con las fases del CAP
   decidido (una por columna) y el evento crítico jugado. 📝 Anotar en la matriz, sólo con la matriz abierta.

Además:

- **Resaltada** en la lista de documentos del G-3: borde y fondo dorados y la chapa **🎖️ DECISIÓN** (después,
  **🎖️ CAP n**). Los botones CAP 1 / CAP 2 del F3·P6 y del 🎬 C.A. por fases marcan el decidido con 🎖️.
- **Las hojas que siguen** (F4·P7, F5, F6, F7) dicen arriba, en una línea: «🎖️ CAP 2 · Defensa móvil — decidido por el
  Comandante», «⚠️ Falta la decisión del Comandante…» o «⚠️ A la vista está el CAP 1, pero el Comandante decidió el
  CAP 2».
- **Menos texto**: sin la cita del PMTD ni el pie largo del Juego; sin la nota «Lo que va en cada casilla…» (sigue en
  la guía y va a la IA); «Lo que entregó el G-2» plegado; la entrega en una línea («Juego de guerra → decisión del
  Comandante → Matriz de Ejecución») y la guía «📘 ¿Para qué es y cómo se llena?» plegada (en las demás hojas sigue
  abierta: la F3·P1 y la F3·P3 la muestran a propósito). En todo el Tablero del G-3 la nota de la IA es una línea y la
  letra chica sube un punto. El panel usa letra de 12,5 a 16 px.
- Archivos: `v1/decision.mjs` (sin dependencias del compilado: `estado`, `matrizAbierta`, `conDecision`,
  `sinDecision`, `matrizPara`, `nombreCAP`, `avisoHoja`, `filaDocumento`, `bloqueIA`, `pedidoDecision`), `v1/panel.js`,
  `textoCorto` en `v1/modelo.mjs`; en el compilado, `pruebas/reemplazos-2026-11-08-decision-cap.js`. Pruebas:
  `pruebas/decision-cap.mjs` y `pruebas/e2e/decision-cap.cjs` (también con `DPR=2`).

## En la Mesa

**Tablero del G-3 → 📄 Documentos → «4 · Analizar los cursos de acción» → F4·P6-7 Matriz de sincronización**, arriba
de la hoja: **⚔️ Evento crítico para el Juego de Guerra — 🔴 CAE (G-2) contra 🔵 CAP (G-3)**.

- Cada fase 🔵 del CAP frente a una fase 🔴 del CAE: de entrada las dos listas **alineadas por el final** (el último
  choque es la última fase de los dos), o la que se eligió en el 🎬 C.A. por fases (`contra`). Se cambia en su lista.
  Con las 5 fases de la defensa y las 4 del ataque (Sergio, 25-10-2026: «fase IV de azul contra fase III de rojo»):

  | 🔵 CAP | 🔴 CAE |
  |---|---|
  | FASE I — Concentración | FASE I — Ramificación |
  | FASE II — Desplazamiento | FASE I — Ramificación |
  | FASE III — Ocupación y organización de la posición | FASE II — Apresto lejano |
  | FASE IV — Conducción de la defensa | FASE III — Ataque propiamente tal |
  | FASE V — Contraataque y consolidación | FASE IV — Ruptura, consolidación y explotación |
- Cada encuentro, medido: cuántas unidades enemigas de maniobra quedan a menos de **15 km** de una propia, las dos más
  cercanas y a qué distancia, y la relación de poder enemigo/propio en contacto. **⭐ = el más crítico** (más unidades
  enemigas en contacto, más poder enemigo, más cerca). Es para ordenar; el juicio es del Estado Mayor.
- **CAP 1 / CAP 2** (si los dos tienen fases) y **CAE más probable / más peligroso**.
- **💾 Guardar este enfrentamiento**: queda en la hoja, `g3.sincro._evento = { cap, azul, rojo, coa }`. La rejilla
  sólo lee las casillas «FILA|COLUMNA», así que no se ve ni va al Word (como `_cols`).
- **📝 Anotarlo en la matriz**: en la columna de esa fase (sólo si es del CAP activo: las columnas son sus fases),
  MANIOBRA e INTELIGENCIA, **sólo si están vacías**, con «[Mesa — verificar]» y sin emojis. También lo guarda.
- **⬇️ Bajar para el Juego de Guerra (.json)**: el ejercicio entero (sigue sirviendo para la Mesa) con el evento
  guardado y `eventoCritico` ya armado: las fichas 🔵 de la fase del CAP, las 🔴 de la fase del CAE y el calco de la
  fase propia. `JUEGO_GUERRA_<ejercicio>_evento_critico_<fecha>.json`.
  Desde la v2.9.439 lleva también **`bibliotecaCOE`**: los COE de 📚 Mis documentos (efectivos, armamento y vehículos
  de cada unidad), para que cada ficha entre al Juego con lo que de verdad tiene (`coeParaElJuego` en `v1/modelo.mjs`).
  El aviso dice cuántos COE viajan.

## En el Juego de Guerra (SIDECEME, `index.html`, v2.9.438)

**⚙️ Configurar → 🌄 Traer escenario del Generador de Calcos → 📂 Cargar escenario (reemplaza)** con el archivo de ⬇️ o
con el ejercicio.json de siempre (si el evento se guardó con 💾, lo trae igual):

- **⚔️ EVENTO CRÍTICO — CAP n · FASE x contra CAE … · FASE y** sale primero, recuadrado en rojo: 🔵 azules de la
  fase del CAP y 🔴 rojas de la del CAE en el mismo tablero.
- **⚔️ Enfrentar una fase 🔵 con una fase 🔴**: dos listas (las fases de los dos CAP y las del CAE) para jugar
  cualquier otra pareja; vienen marcadas con la del evento crítico. Las fases sueltas («Una fase sola, sin enfrentar»)
  van al final, y las del CAE se llaman «CAE más probable · Fase I…IV» y «CAE más peligroso · Fase I…IV» (antes
  «COA ENEMIGO · Fase 1…8», que no se entendía).
- **Las agrupaciones de la organización para el combate** (OD, OC 1, OC 2, RES: fichas con `esAgrupacion`, que la
  Mesa dibuja con magnitud brigada junto a las divisiones de las que salen sus piezas) **no entran** si el bando tiene
  otras fichas de maniobra: antes aparecían como «brigadas» y las fuerzas se contaban dos veces. El aviso de carga
  dice cuáles quedaron afuera. Si el bando sólo tiene agrupaciones, quedan.
- La marca de versión de la esquina dice la de verdad: los scripts del horario la pisaban siempre con «v2.9.428».
- La fase 🔵 que tenía `contra` ahora trae también a esos rojos (antes llegaba sin enemigo: la Mesa la guarda sin las
  fichas rojas que pone a la vista).
- Las fichas con `bando: 'enemigas'` (las del CAE) entran como 🔴 ROJO: antes entraban como AZUL.

## Archivos

- `v1/modelo.mjs` — sin dependencias: `fasesAzules`, `fasesRojas`, `enfrentar`, `medir`, `encuentros`, `resolver`,
  `conEvento`, `anotar`, `paraElJuego`, `coeParaElJuego`, `nombreArchivo`.
- `v1/panel.js` — el panel (React llega en la prop `R` desde el compilado).
- En el compilado (`pruebas/reemplazos-2026-10-25-evento-critico.js`): el import y el panel arriba de la hoja `sincro`.
- En `index.html` (Juego de Guerra): `_wgEsRoja`, `_wgEnfrentar`, `_wgFasesBandos`, `_wgFasesCOA`, `_wgPreguntarFase`
  y el bando en `_wgEscenarioDesde`.
- Pruebas: `pruebas/evento-critico.mjs`, `pruebas/e2e/evento-critico.cjs` (en la Mesa) y
  `tests/wargame-evento-critico.test.cjs` (las funciones reales del Juego y el cuadro de elección en Chromium).
