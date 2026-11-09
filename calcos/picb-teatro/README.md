# 🌎 PICB del Teatro (FF.TT.T.O.) — 09-11-2026

Lo pidió Sergio con el ejercicio DIAMANTE (TRITÓN vs SATURNO) en pantalla: «a nivel pequeño las
distancias permiten sacar un análisis, pero un teatro de operaciones es demasiado grande… quisiera
que salga como el calco del enemigo, o un calco de poblaciones o comunicaciones sólo con lo más alto,
lo más sobresaliente… debe haber un apartado especial para PICB a nivel FF.TT.T.O.… no me friegues el
resto de la aplicación: para CE y divisiones funciona bien».

## Por qué hacía falta

- El teatro de DIAMANTE mide **186.391 km²** (Norte 40.927, Central 72.636, Sur 72.829). La Mesa no
  calcula el terreno de un área de más de **120.000 km²**, el servidor de capas no entrega más de
  **4° de lado** (el teatro tiene 4,4° × 6,6°) y las huellas de OSM no se piden en más de 3°. Por eso
  «Calcos del terreno · base del CMOC» quedaba en 0/0.
- Aunque se calculara por subteatro, saldría cada huella, quebrada y casa: ilegible a 1:1.000.000 y
  con la carga que ya tumbó al servidor con 20 alumnos a la vez.
- 📂 Abrir KMZ trae áreas y fichas, pero no las DEOP ni los ejes de aproximación.

## Qué hace

Una pestaña **🌎 PICB TEATRO** en el borde derecho que aparece **sólo** si el ejercicio es de nivel
teatro: la unidad considerada son las FF.TT.T.O. (o magnitud Ejército), el ejercicio trae el TO o
subteatros, o sus áreas suman más que un CE. En un ejercicio de CE o DIV no aparece y no dibuja nada.

Los 4 pasos de la PICB del PMTD 2017, a escala operacional (cartas 1:1.000.000 y 1:250.000):

| Paso | En el panel | En la carta |
|---|---|---|
| 1 · Ambiente | TO, subteatros y AO de los CE (km², dimensiones); **Área de Interés** = TO + bases y orígenes del enemigo + margen (lo muy lejano —Santiago, Rancagua— se lista aparte); 📥 KMZ del teatro (DEOP, ejes, orígenes, GG.UU.) | El Área de Interés y lo de afuera oscurecido |
| 2 · Efectos | Los **4 calcos** (Comunicaciones, Poblaciones, Grandes obstáculos, Efectos del teatro) con lo que hay en el AI, los **nudos de comunicaciones** (terreno decisivo), los corredores (DEOP) con la magnitud que admiten y la estación (lluvias / seca) | Troncales, primarias, secundarias (de cerca), FF.CC., aeródromos, pasos fronterizos, poblaciones jerarquizadas, relieve severo/restringido, salares, lagos, ríos, volcanes, regiones físicas, corredores DEOP y nudos |
| 3 · Amenaza | Orden de batalla de las GG.UU. de los dos bandos (rol, DEOP, poder editable) y **poder relativo por DEOP** | — |
| 4 · CAE | Cada DEOP **medida sobre la red vial** (las del KMZ son rectas), con **D+n** en cada punto según el ritmo del arma (editable); **A.I.N.** en pasos, OEM y OEN con su ventana; **CAE más probable y más peligroso** propuestos (y editables); ⬇ KMZ para Google Earth, 📄 Word y 📋 texto para la Apreciación de Inteligencia | El **calco del enemigo**: itinerarios con D+n, ejes de aproximación, orígenes y A.I.N.; las rutas pasan a gris de fondo |

«La máquina propone, el G-2 dispone»: las cifras de poder (Brigada 40, División 80, CE 150; acorazada
×1,3, mecanizada ×1,2) y de ritmo (acorazada 30 km/día, mecanizada 25, motorizada 20, infantería 10)
son **referencias a validar** con las tablas de la Escuela; todo se corrige en el panel.

## Cómo se engancha (sin tocar el compilado)

- `calcos/index.html`: una hoja de estilo y un `<script type="module">` (`v1/panel.mjs`).
- Lee el ejercicio con `window.SIDMesaEjercicio.foto()` (sólo lectura) y dibuja en la carta 2D
  (`window.__mapa2d`, Leaflet) en sus propios paneles (`sidpt*`).
- Guarda lo suyo en **`resultados.picbTeatro`** con `window.__SIDECEME_IMPORT_STATE.setResultados`:
  viaja con el ejercicio (autoguardado, JSON, KMZ del Juego de Guerra). La Mesa sólo mira las claves de
  `resultados` que traen `fc`, así que no la confunde. Para que «⚡ Generar calcos» no lo borre, envuelve
  `SIDECEME_IMPORTAR_GE.preservarImportados`.
- Las GG.UU. de un KMZ que no estén en el ejercicio se ofrecen con `MesaAcademica` →
  `agregarUnidades` (con ↶ Deshacer), como 🧩 Superponer → 📌 Pasar. El bando lo da el color del
  ícono (rombo rojo = enemigo), con el mismo lector `areas-operaciones/abrir-kmz.mjs` (misma dirección
  `?v=pasar20261108` que Superponer).

## Los datos del teatro (`v1/datos/teatro-base.json`, 2,2 MB; ~0,7 MB comprimido)

Archivo fijo, generalizado a 1:1.000.000: abre en segundos, **no consulta al servidor** (aguanta la
clase entera) y funciona igual en el modo paquetes. Coordenadas en delta de 1e-4° (`abrirBase()`).

| Capa | Fuente | Qué queda |
|---|---|---|
| Vías | OSM (Geofabrik Bolivia; openstreetmap.fr: Arica, Tarapacá, Antofagasta, Jujuy, Salta) | troncal/primaria/secundaria/terciaria, partidas en los cruces (la red queda conectada), ramales sin salida podados |
| FF.CC., ríos (> 50 km), poblaciones, aeródromos (con código), volcanes ≥ 5.000 m | OSM | |
| Pasos fronterizos | OSM + cruces de vías con la frontera (transversales; los de rutas que bordean el límite se descartan) | 32 |
| Salares, lagos, fronteras, países, regiones físicas | Natural Earth 10 m | |
| Relieve restringido (≥ 7°) y severo (≥ 14° o > 5.200 m) | Terrain Tiles AWS, nivel 8 (~600 m), pendiente media | |

Cobertura de vías: Bolivia entera + norte de Chile + Jujuy y Salta. Perú, Paraguay y Brasil traen sólo
fronteras, países y lagos (sumar sus extractos si se arma otro teatro).

Rehacerlo (en `scripts/`):

```bash
python3 scripts/relieve.py /tmp/teatro/relieve
node scripts/extraer-osm.mjs bolivia-latest.osm.pbf /tmp/teatro/crudo/bolivia.json   # y cada región
node scripts/generalizar.mjs --crudo /tmp/teatro/crudo --ne /tmp/teatro/ne --relieve /tmp/teatro/relieve \
  --d3 <node_modules con d3-contour> --salida v1/datos/teatro-base.json
```

Atribución: © colaboradores de OpenStreetMap (ODbL); Natural Earth (dominio público); Terrain Tiles
en AWS (https://github.com/tilezen/joerd/blob/master/docs/attribution.md). Va al pie del panel.

## Pruebas

- `node calcos/pruebas/picb-teatro.mjs` — datos, red vial, nivel (un ejercicio de DIV no se toca),
  áreas, Área de Interés, KMZ del teatro, DEOP sobre la red con D+n, nudos, A.I.N., poder relativo,
  CAE, texto y KML. Con `CARPETA_KMZ="$HOME/Desktop/FF.TT.T.O."` usa los KMZ reales de DIAMANTE
  (DEOP 1 294 km D+9,8 · DEOP 2 302 km D+10,1 · DEOP 3 303 km D+15,2 · DEOP 4 416 km D+13,9).
- `node calcos/pruebas/e2e/picb-teatro.cjs` (Chromium, necesita `CARPETA_KMZ`): DIV sin pestaña →
  «📂 Abrir archivo» con los KMZ del teatro → aparece 🌎 → carga de las DEOP → pasos 2 y 4 → baja el KMZ
  y el Word → queda en `resultados.picbTeatro` → de vuelta a DIV no queda nada. `TILES_REALES=1` usa la
  carta de fondo real para las capturas (`pruebas/salidas-picb-teatro/`), `DPR=2` como en Retina.

## Lo que todavía no hace

- No se ve en la vista **3D** (MapLibre): por ahora es de la carta 2D.
- No entra a «👁 1·b · Qué se ve en el calco»: tiene sus propios interruptores en el panel.
- El **Juego de Guerra a escala teatro** (etapa B) lee estos datos después: `resultados.picbTeatro`
  ya viaja en el ejercicio.
