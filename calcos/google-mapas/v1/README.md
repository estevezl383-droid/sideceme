# 🛰️ Imágenes de Google en la Mesa del EM (v1, 23-10-2026)

Mapas base de Google en la carta 2D y en el ⛰️ 3D de la Mesa, y el 3D realista de Google para reconocer el
terreno. Para ejercicios académicos de planeamiento.

## Qué ve el usuario

En la barra de la carta (donde están 🗺️ 2D / ⛰️ 3D), el botón que alternaba Satélite / Mapa es ahora un
selector (angosto, para que la barra siga en una fila; la lista abierta es más ancha):

| Grupo | Opción | Qué es |
|---|---|---|
| Google | 🛰️ Google | imagen satelital de Google |
| Google | 🏷️ Nombres | satélite + rutas, ríos y nombres de lugares |
| Google | ⛰️ Relieve | relieve sombreado con rutas y nombres (como el «Terreno» de Google Maps) |
| Google | 🏙️ 3D realista | el 3D de Google DENTRO de la carta, con el calco encima (no cambia el mapa base) |
| Esri / OSM (gratis) | 🛰️ Esri | el satélite de siempre |
| Esri / OSM (gratis) | 🗺️ Mapa | el mapa de calles de siempre |

- En **⛰️ 3D** la imagen elegida va sobre el relieve SRTM de la Mesa, con todo lo trazado encima.
- **🏙️ 3D realista** muestra, en la misma carta y en el lugar que se estaba mirando, el 3D de Google
  (Photorealistic 3D Tiles, con CesiumJS), con **el calco encima**: lo que está prendido en la carta 2D (áreas,
  líneas con sus guiones, círculos, fichas, puntas de flecha y rótulos) se pinta pegado al terreno. Los paneles de
  la Mesa siguen a la vista. Abajo al centro: ⬇️ Desde arriba, ↗️ Inclinada, 🧭 Norte, ☑ Calco (mostrarlo u
  ocultarlo), 🔄 Calco (volver a traerlo) y **✕ Volver a la carta**; también vuelven a la carta elegir otro mapa
  base en el selector o 🗺️ 2D / ⛰️ 3D. Lo que se prende o apaga en la carta llega solo al 3D.
  Antes (hasta el 23-10-2026) se abría en otra pestaña sin lo trazado: Sergio, en la F3·P4 de un ejercicio, «se
  sale de la imagen y se abre otra aparte… no muestra la plantilla».
- En la barra del 🏙️ 3D: **⛰️ Relieve ×** (de ×1 a ×5, arranca en ×2; como el «Relieve ×» del ⛰️ 3D de la Mesa)
  estira el relieve de Google en la vertical, relativo a la cota del lugar mirado (el centro no se mueve); se
  activa cuando se conoce esa cota. **⚡ Detalle**: alto (lo de Cesium), normal (por defecto, más liviano) o
  fluido (para computadoras lentas). Las dos cosas quedan para la próxima vez (`localStorage`:
  `sid-g3d-relieve`, `sid-g3d-detalle`). Sergio, 23-10-2026: «para navegar está muy lenta, muy lenta… ¿se le puede
  dar la misma opción para aumentar el relieve?».
- Para que se navegue más fluido: el 3D dibuja sólo cuando algo cambia (`requestRenderMode`), las líneas y áreas
  del calco llegan simplificadas (se sacan los puntos a menos de ~8 m de la línea) y, si la carta 2D vuelve a
  dibujar lo mismo (pasa al guardar o con cada cambio del ejercicio), el calco no se rehace.
- Si Google no entrega el 3D (cupo, clave, red), el calco igual se ve, sobre el satélite de Esri (sin relieve),
  con un aviso.
- Abajo al centro de la carta quedan «Google» y la atribución de las imágenes del lugar (lo exige Google).
- Si Google deja de dar imágenes (cupo del día agotado, sin conexión), la carta vuelve sola al satélite de Esri,
  avisa una vez y saca los mapas de Google del selector hasta recargar la página.

## Cómo funciona

- `google-mapas.js` (lo carga `calcos/index.html` antes del compilado) define `window.SIDGoogle`.
- Map Tiles API de Google Maps Platform: una **sesión** por tipo de mapa (`POST /v1/createSession`, dura ~2
  semanas, se guarda en `localStorage`) y cada tile es `/v1/2dtiles/{z}/{x}/{y}?session=…&key=…`. La atribución,
  de `/tile/v1/viewport`.
- El compilado (`reemplazos-2026-10-23-google-mapas.js`) pide el mapa base a `SIDGoogle.leaflet(id)` /
  `SIDGoogle.maplibre(id)` y le pasa cada carta a `SIDGoogle.seguir(mapa)`. Sin este script todo queda como antes.
- 🏙️ 3D realista (`SIDGoogle.abrir3D`, sin cambios en el compilado): un iframe con `3d.html?embebido=1#lat,lng,zoom`
  sobre la carta (z-index 999: encima de la carta 2D y del ⛰️ 3D, debajo de los paneles de la Mesa).
  `SIDGoogle.calcoDeLaCarta()` lee las capas de la carta 2D (Leaflet: polígonos, líneas, círculos, marcadores con
  imagen, DivIcon con SVG o texto, rótulos fijos que no son de medición) y se las manda por `postMessage`; `3d.html`
  las dibuja con Cesium: áreas y líneas «clasifican» los tiles 3D (`classificationType`), fichas y rótulos van
  `CLAMP_TO_GROUND` sin que los tapen los cerros. Abierto solo (sin `?embebido=1`), `3d.html` es el 3D sin calco.

## La clave y lo que cuesta

- Clave de navegador del proyecto **CIDECEME** de Google Cloud (cuenta de facturación «SIDECEME Mapas»),
  restringida a `https://estevezl383-droid.github.io/*` y a la Map Tiles API. Por eso puede ir en el código: desde
  otro sitio Google la rechaza. Para probar en `localhost` hay que agregar `http://localhost/*` a la clave.
- 2D: 100.000 tiles gratis por mes; después, del orden de US$ 0,60 cada 1.000. El 3D realista es aparte y más caro
  (cada vez que se abre 🏙️ Google 3D cuenta). Topes por día: consola de Google Cloud → Map Tiles API → Cuotas.
- Si se cambia la clave: `CLAVE` en `google-mapas.js` (las sesiones guardadas se descartan solas).

## Pruebas

`node calcos/pruebas/e2e/google-mapas.cjs` (Google simulado, no gasta la clave) y
`node calcos/pruebas/e2e/google-3d-relieve.cjs` (⛰️ Relieve × y ⚡ Detalle sobre un volcán sintético servido como
si fuera el 3D de Google; necesita `CESIUM_DIR`). Con
`CESIUM_DIR=…/package/Build/Cesium` (de `npm pack cesium@1.145.0`) también prueba el visor 3D con el calco (con el
3D de Google rechazado, sobre Esri, y con un tileset vacío). Lo que no se puede probar sin la clave real es cómo se
ven áreas y líneas pintadas sobre los tiles de Google: mirarlo a mano en github.io.
