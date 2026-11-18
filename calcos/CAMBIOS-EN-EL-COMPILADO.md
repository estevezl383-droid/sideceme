# Cambios hechos directamente sobre el compilado de la Mesa del EM

## 2026-11-17 (tarde) — 🔗 Los 5 enlaces le sirven al alumno (`index-enlaces-20261117.js`)

Parte de `index-linea-tiempo-20261117.js` + `pruebas/reemplazos-2026-11-17-enlaces.js`
(7 reemplazos; `construir-enlaces.js`, reversible byte por byte; `probar-enlaces.mjs` los prueba
sobre el archivo que se sube).

- **Qué pasaba**: el pase del CURSANTE vive en el `sessionStorage` de la pestaña donde entró a
  SIDECEME (el del profesor, en `localStorage`). Un enlace que llega por mensaje abre una pestaña
  NUEVA → sin pase → candado. Y el enlace llevaba el puesto pero no la BASE, así que aun entrando
  el oficial veía una carta en blanco.
- `QU` (= `enlaceDePuesto`): cuelga la BASE comprimida (gzip + base64url) detrás del `#`, y se
  suman `SIDEmpacarBase` / `SIDDesempacarBase` / `SIDPaquete*`. `SIDPaqueteInicial()` corre al
  cargar el módulo —antes del candado— y guarda el paquete del enlace en `pmtd_base_enlace`.
- `Sv` (= `bajarBase`): al repartir, empaqueta la BASE para los cinco enlaces.
- El efecto de arranque: vale el puesto del enlace **y** el recordado (el login pierde la
  dirección); la BASE sale de esta computadora o del enlace; si no llega, lo dice en rojo.
- La pantalla del candado: nombra el puesto, dice que no se perdió nada, los dos pasos y los
  botones «🔑 Entrar a SIDECEME» y «🔄 Ya entré».
- `PanelMesaEM`: los 5 enlaces salen desplegados, con el aviso de si llevan la BASE, y «copiar los
  5 juntos» incluye el instructivo.
- **Ya está en el fuente**: `src/lib/mesaEnlaces.js`, `src/App.jsx`, `src/components/PanelMesaEM.jsx`
  y `src/components/BarraPuesto.jsx`. Si se recompila, no se pierde.

## 2026-11-17 — ⏱ La Línea Inicial de Tiempo acepta «D» sin hora (`index-linea-tiempo-20261117.js`)

Parte de `index-motorizadas-20261111.js` + `pruebas/reemplazos-2026-11-17-linea-tiempo.js`
(2 reemplazos; `construir-linea-tiempo.js`, reversible byte por byte).

- **Qué pasaba**: dos cursantes escribieron `D` a secas en «Inicio de la operación» (así lo dice la
  misión). `leerDiaD` exigía la hora y devolvía nulo → la hoja mostraba «Falta la recepción de la
  orden o el inicio de la operación» con los seis campos cargados, y como la lámina, el cuadro, el
  📄 Word y el 🖨 imprimir cuelgan de `t.ok`, **no había hoja para imprimir ni para bajar**.
- `oq` (= `leerDiaD`): la hora pasa a opcional (`D`, `D-15`, `D+3` → 0000, con `sinHora:true`), y se
  tolera la cola `hrs`/`hs`/`horas` del membrete de la Orden.
- `G=[]` (los avisos de `calcularLineaTiempo`): se agrega el aviso de qué momento quedó en 0000.
- **Ya está en el fuente**: `src/lib/lineaTiempo.js` + `tests/lineaTiempo.test.mjs`. Si se recompila,
  no se pierde.

## 17-11-2026 (noche) · ACOSTAR sin avenidas, avisos a la vista — `index-acostar-20261117.js`

Sergio: «los alumnos eligen la plantilla doctrinal del enemigo y cuando tienen que acostarla no funciona, igual los
objetivos […] aprietan y no pasa nada».

- **Causa 1**: el botón «🗺️ Acostar … sobre el calco» estaba `disabled` si no había avenidas (y el CMOC ya no las traza
  solo; los archivos de Selección tampoco las traen). Objetivos, maniobra y CAE cuelgan de la plantilla.
- **Causa 2**: el aviso rojo (`he`) sólo se pintaba en el panel izquierdo de control: con el tablero del PICB/G-3
  abierto no se veía. El verde duraba 2,8 s fijos.
- **Causa 3** (latente, se activa con los 5 enlaces): el candado de la BASE frenaba al G-2 en SU trabajo.
- **Qué cambia** (17 reemplazos sobre `index-enlaces-20261117.js`, `pruebas/reemplazos-2026-11-17-acostar.js`):
  `s9` (plantillaSituacional) acuesta sobre ejes doctrinales si no hay avenidas útiles (frente = el guardado, el de
  «🧭 ¿De dónde viene el enemigo?» o el primer lado del A.O.) y lo dice en sus avisos; el botón ya no se apaga; aviso
  rojo arriba de la carta (`.sid-aviso-rojo`, se cierra tocándolo); aviso verde de 4 a 20 s según el largo; G-2 con
  BASE puede acostar objetivos/maniobra/A.I.N., generar CAE y mover objetivos.
- **Con avenidas trazadas no cambia nada.**
- **Fuente**: `src/lib/plantillaSituacional.js`, `src/components/PanelPICB.jsx`, `src/App.jsx`.
- **Probado**: 44 casos del motor en Node (11 esquemas × 3 situaciones → plantilla + objetivos + flechas) y en la Mesa
  servida en local con este compilado y el ejercicio CE-VII sin avenidas: plantilla 17 fichas, 3 objetivos, 3 flechas.
