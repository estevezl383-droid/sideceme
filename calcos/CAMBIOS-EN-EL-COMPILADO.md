# Cambios hechos directamente sobre el compilado de la Mesa del EM

El código fuente de la Mesa del EM (Vite/React) no está en este repositorio:
`calcos/assets/index-*.js` es el compilado. Los cambios de abajo se hicieron
sobre ese compilado. **Si se vuelve a compilar desde el fuente, hay que pasarlos
al fuente o se pierden.**

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
