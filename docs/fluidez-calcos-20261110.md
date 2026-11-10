# Fluidez de Calcos — 10 de noviembre de 2026

El problema reportado ocurre al desplazar el mapa o hacer zoom. En la prueba
local, el trabajo de JavaScript era bajo, pero los filtros de vidrio de Pandora
encarecían la composición de cada cuadro: había desenfoque en los paneles,
en la barra y nuevamente en sus controles.

La corrección suspende los filtros durante los gestos de Leaflet y los restaura
cuando terminan tanto el desplazamiento como el zoom. Los controles conservan
sus fondos y reflejos sin filtros duplicados. Las actualizaciones de tiles y
rótulos dejan de disparar mediciones de los paneles. El HTML cambia las versiones
de CSS y JavaScript para renovar la caché y activar el aviso de versión existente.

## Comparación local

Chromium con SwiftShader, pantalla de 1800 × 1100, densidad 2, puesto G-4,
tiles sintéticos y desplazamiento de 850 × 300 durante tres segundos. Se midieron
los intervalos de `requestAnimationFrame` entre los 450 y 2700 ms del gesto.
Se alternaron dos rondas de los archivos originales de `2d7248c` y la corrección.

| Versión | Tiempo medio por cuadro, rondas 1 / 2 | Cuadros en la ventana, rondas 1 / 2 |
| --- | --- | --- |
| Original | 264,8 / 248,1 ms | 9 / 9 |
| Corregida | 100,0 / 127,8 ms | 23 / 21 |

En estas condiciones, el tiempo medio por cuadro se redujo aproximadamente un
56 %. La comparación identifica el coste de los efectos; no mide el rendimiento
del equipo del usuario ni garantiza una tasa de cuadros concreta en producción.

## Verificación

Pasaron `e2e/fluidez.cjs`, `e2e/vista-plegada.cjs`, `e2e/paneles-sin-cruce.cjs`,
`e2e/autoguardado.cjs`, `e2e/modalidad.cjs`, `e2e/carpeta-profesor.cjs` y
`e2e/aviso-version.cjs`. Cubren gestos, filtros, capas 2D/3D, guardado, paneles
en tres resoluciones y controles en escritorio y teléfono.

También pasaron los modelos de autoguardado, modalidad, IA y carpeta del profesor,
la reversibilidad del compilado, las comprobaciones de sintaxis y `git diff --check`.
La prueba de paneles ahora despliega expresamente el tablero de pasos: la vista
actual inicia plegada, independientemente del valor antiguo de almacenamiento.

La prueba nueva está incluida en el flujo de CI de guardado y paneles. Para
ejecutarla con un Chromium instalado en el sistema:

```sh
SIDECEME_CHROMIUM=/usr/bin/chromium node calcos/pruebas/e2e/fluidez.cjs
```
