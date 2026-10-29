# Cursos de acción en el panel izquierdo

En **Productos del G-2 (paso 4)** aparecen los dos CAE: **más probable** y
**más peligroso**. Cada uno muestra las fases guardadas en el ejercicio. Pulsar
una fase la lleva a la carta con el mismo mecanismo del panel «C.A. por fases».
El ojo del CAE oculta o restaura la fase seleccionada; el ojo del grupo G-2
incluye también los cursos y el resto de sus productos.

Debajo aparece **G-3 · fase 4 · Cursos de acción propios**, plegado al entrar.
Contiene ambos CAP y sus fases, el ojo del **Plan de fuegos** y el del **Plan de
barreras**. El ojo de la cabecera oculta o muestra todo ese grupo. Seleccionar
un CAP guardado utiliza el cambio de CAP existente, conservando las fases del
otro. No crea cursos ni fases nuevos.

Se muestra una fase a la vez. Una fase propia puede conservar como referencia
una fase enemiga, como ya permite «C.A. por fases». Los ojos afectan a la carta
2D y a su espejo 3D; no eliminan unidades, fases, obstáculos ni blancos. Al
ocultar y volver a mostrar un curso se conserva la fase seleccionada.

El filtro `vistaDelCurso` se aplica a los datos que recibe la carta, sin cambiar
el estado editable. Las capas externas de fuegos, marcas del concepto e
itinerarios también reciben su bandera de visibilidad. Cada fase propia carga
su propio plan de fuegos, incluso cuando está vacío, para evitar que aparezcan
blancos de otra fase.

Pruebas desde la raíz, con Playwright configurado:

```bash
npm run test:cursos-visibilidad --prefix calcos/pruebas
npm run e2e:cursos-g2-g3 --prefix calcos/pruebas
```

La prueba de navegador usa ocho fases enemigas y dos CAP ficticios. Comprueba
cambios de fase y CAP, conservación del CAP guardado, fuegos independientes por
fase, obstáculos realmente ocultos en el mapa, controles en 3D y guardado de
todos los cursos y planes.

Construcción reproducible, verificando el SHA-256 de partida y la reversibilidad:

```bash
node calcos/pruebas/construir-cursos-g2-g3.js
```

Este constructor genera el compilado vigente `index-cursos-g2-g3-20261029.js`.
No cambia los compilados anteriores ni los hashes de la cadena histórica de
verificación, que ya tenía un fallo con el paso de paquetes.
