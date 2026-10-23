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
| Google | 🏙️ 3D realista ↗ | abre `3d.html` en otra pestaña (no cambia el mapa base) |
| Esri / OSM (gratis) | 🛰️ Esri | el satélite de siempre |
| Esri / OSM (gratis) | 🗺️ Mapa | el mapa de calles de siempre |

- En **⛰️ 3D** la imagen elegida va sobre el relieve SRTM de la Mesa, con todo lo trazado encima.
- **🏙️ 3D realista** abre, en el lugar que se estaba mirando, el 3D de Google (Photorealistic 3D Tiles, con
  CesiumJS). Lo trazado no va: es para reconocer el terreno.
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

## La clave y lo que cuesta

- Clave de navegador del proyecto **CIDECEME** de Google Cloud (cuenta de facturación «SIDECEME Mapas»),
  restringida a `https://estevezl383-droid.github.io/*` y a la Map Tiles API. Por eso puede ir en el código: desde
  otro sitio Google la rechaza. Para probar en `localhost` hay que agregar `http://localhost/*` a la clave.
- 2D: 100.000 tiles gratis por mes; después, del orden de US$ 0,60 cada 1.000. El 3D realista es aparte y más caro
  (cada vez que se abre 🏙️ Google 3D cuenta). Topes por día: consola de Google Cloud → Map Tiles API → Cuotas.
- Si se cambia la clave: `CLAVE` en `google-mapas.js` (las sesiones guardadas se descartan solas).

## Pruebas

`node calcos/pruebas/e2e/google-mapas.cjs` (Google simulado, no gasta la clave). Con
`CESIUM_DIR=…/package/Build/Cesium` (de `npm pack cesium@1.145.0`) también prueba el visor 3D.
