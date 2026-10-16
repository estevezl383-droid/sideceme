# 🛤️ Huellas y sendas de OSM en la Mesa del EM — 16-10-2026

Lo pidió Sergio con dos capturas del botón de ⚡ GENERAR CALCOS trabado en
**«⚙️ 🛤️ Huellas y sendas (OSM al día — Vía 3/4) (🇧🇴)…»**: «en momentos hace que la
aplicación se cuelgue y pareciera que todo el programa falló… especialmente cuando las
áreas son más grandes».

## Qué pasaba

La capa «Huellas y sendas (OSM al día — Vía 3/4)» no sale del servidor de SIDECEME: se
pide en vivo a OpenStreetMap (Overpass) con el rectángulo del Área de Interés
(`assets/huellasOSM-B2eaicIK.js`). Reproducido en Chromium con la Mesa real
(`pruebas/e2e/huellas.cjs`):

- **OSM sin contestar** (Overpass suele estar saturado): el pedido no tenía tiempo máximo y
  ⚡ GENERAR CALCOS se quedaba en ese paso **para siempre** (a los 240 s seguía igual).
- **Área grande**: OSM devuelve decenas de miles de caminos. La Mesa los recortaba al área
  uno por uno con turf, **en el hilo de la página**: con un área de 1°×1° y 30.000 caminos
  la pestaña quedó **congelada 13 s seguidos** (con 3°×3°, minutos, o el navegador la mata
  por memoria). Nada se podía tocar: parecía que todo el programa había fallado.
- Si fallaba, el error iba sólo a la consola: el calco salía sin huellas y nadie se enteraba;
  y ese «vacío» quedaba guardado, así que volver a generar no reintentaba.

## Qué hace ahora

Código legible en `v1/` (el compilado lo importa; ver `CAMBIOS-EN-EL-COMPILADO.md`):

| Archivo | |
|---|---|
| `v1/huellas-osm.mjs` | Lo que usa la Mesa: `traerHuellas(aoi, aviso)`, `alAvisar(fn)`, `clasificarVia(tags)`. |
| `v1/trabajador.mjs` | El Web Worker: descarga, lee el JSON y recorta fuera del hilo de la página. |
| `v1/nucleo.mjs` | El núcleo sin DOM (consulta, descarga con tiempos, recorte, simplificación, topes). |

| | |
|---|---|
| Sin trabar la página | Todo el trabajo pesado va en un **Web Worker**. Si el navegador no lo deja abrir (navegador viejo, la app de escritorio con `file://`), se hace en la página **cediendo el hilo cada 12 ms**. Con el área de 1°×1° y 30.000 caminos: la página trabada como mucho **~0,3 s** (antes 13 s) y ⚡ GENERAR tarda 5,8 s (antes 17,6 s). |
| Nunca espera para siempre | Cada servidor tiene **60 s** para empezar a contestar (a Overpass se le pide `timeout:50`), y los dos juntos **100 s**. Ya contestando, mientras lleguen datos sigue (una descarga grande con internet lenta no se corta), pero si se queda **20 s quieta**, se corta. Si el primero falla (sin respuesta, 429 saturado, 504, consulta cortada) prueba el otro. |
| Muestra el progreso | El botón dice «🛤️ Consultando OpenStreetMap… 12 s», «🛤️ Descargando de OpenStreetMap… 18.3 MB», «🛤️ Recortando 30.000 caminos al área… 40 %», «🛤️ 13.101 caminos traídos de OSM». También en el ⚙️ Calcular automáticamente del CMOC. |
| Recorte al área | Al Área de Interés de verdad (no al rectángulo), con los huecos y las partes sueltas, con un índice por franjas de los bordes. Da **lo mismo** que el recorte de la Mesa con turf (`pruebas/huellas-osm.mjs` lo compara con el del compilado, camino por camino). Como ya llega recortado (`_recortada`), la Mesa no lo vuelve a recortar en su hilo. Antes la capa prendida en la carta y el CMOC usaban el rectángulo sin recortar. |
| Áreas grandes | A Overpass se le pide por clase y con tope: hasta 20.000 huellas (`track`), 10.000 sendas (`path`, `bridleway`) y 5.000 veredas (`footway`, `cycleway`). En el calco van como mucho **25.000 caminos y 600.000 vértices**; si hay más, van los más importantes (primero las Vía 3, después huella → senda → vereda, y los más largos primero) y **se avisa**. A cada camino se le sacan los vértices que no se ven (Douglas-Peucker: ~4 m en un área de medio grado, ~25 m en una de tres). Un área de más de 3° de lado no se pide (como antes), y ahora se avisa. |
| Si falla | El calco sale igual, sin las huellas, y arriba de «3 · Generar calcos» se lee el motivo («Huellas y sendas: no se pudieron traer de OpenStreetMap (OSM no contestó en 60 s)…»). Lo que falló **no queda guardado**: al volver a generar, reintenta. |
| La misma área, una vez | Prender la capa en la carta y generar el calco piden la misma área: va un solo pedido a OSM (se guarda 30 minutos). |

La clasificación militar de cada camino (Vía 2 / 3 / 4, el firme y el paso) y las
propiedades de cada rasgo son las mismas de antes.

## Pruebas

- `node calcos/pruebas/huellas-osm.mjs`: la clasificación igual a la de antes, el recorte
  igual al de turf del compilado (área cóncava con hueco y una parte suelta), simplificar,
  los topes y su orden, 30.000 caminos cediendo el hilo, los tiempos máximos (servidor
  colgado, descarga lenta que no se corta, descarga quieta que sí), el otro servidor, 429,
  Overpass sin terminar, el tope de bytes, que no tire errores, que no pida dos veces la
  misma área y que reintente lo que falló.
- `node calcos/pruebas/e2e/huellas.cjs` (Chromium): la Mesa real con un área de 1°×1° y
  30.000 caminos (la página no se traba, salen los mismos caminos, lo hace el Worker, no
  vuelve a pedir); OSM sin contestar (corta, avisa y reintenta); el tope con aviso; sin
  Web Worker. Con `COMPILADO=calcos/assets/index-tijera-20261016.js` falla, como tiene que ser.
- Las pruebas achican los tiempos y los topes con `window.SIDECEME_HUELLAS_LIMITES`
  (ver `LIMITES` en `v1/nucleo.mjs`).
