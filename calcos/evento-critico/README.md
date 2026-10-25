# ⚔️ El evento crítico: el CAE del G-2 contra el CAP del G-3, listo para el Juego de Guerra

Lo pidió Sergio el 25-10-2026, con los pasos de la F4·P7 a la vista: que en la **Matriz de sincronización** salga «el
evento más crítico», donde se carguen la fase del enemigo ROJO que desarrolló el G-2 y la del G-3 «para que se
enfrenten», guardadas y «listas para jugar» en el Juego de Guerra.

**Dónde va y por qué ahí**: en la **F4·P6-7 Matriz de sincronización**. El PMTD 2017 dice que la matriz «permite
sincronizar el curso de acción para que coincida en tiempo, espacio y propósito en relación con el curso de acción más
probable del enemigo» y que es donde se registran los resultados del Juego de Guerra. La plantilla sustentadora de la
decisión sale **después**, de la matriz ya jugada.

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
  `conEvento`, `anotar`, `paraElJuego`, `nombreArchivo`.
- `v1/panel.js` — el panel (React llega en la prop `R` desde el compilado).
- En el compilado (`pruebas/reemplazos-2026-10-25-evento-critico.js`): el import y el panel arriba de la hoja `sincro`.
- En `index.html` (Juego de Guerra): `_wgEsRoja`, `_wgEnfrentar`, `_wgFasesBandos`, `_wgFasesCOA`, `_wgPreguntarFase`
  y el bando en `_wgEscenarioDesde`.
- Pruebas: `pruebas/evento-critico.mjs`, `pruebas/e2e/evento-critico.cjs` (en la Mesa) y
  `tests/wargame-evento-critico.test.cjs` (las funciones reales del Juego y el cuadro de elección en Chromium).
