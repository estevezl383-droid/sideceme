# Cambios hechos directamente sobre el compilado de la Mesa del EM

El código fuente de la Mesa del EM (Vite/React) no está en este repositorio:
`calcos/assets/index-*.js` es el compilado. Los cambios de abajo se hicieron
sobre ese compilado. **Si se vuelve a compilar desde el fuente, hay que pasarlos
al fuente o se pierden.**

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
