# Las cuatro áreas internas sin instalaciones

El catálogo `lN` de la plantilla existente distingue cuatro servicios: **Sanidad** (`sanidad`),
**Abastecimiento** (`abast`), **Mantenimiento** (`mant`) y **Personal** (`personal`).
La Compañía de Comando y Servicios (`cys`) figura por separado. No se cambian sus nombres ni su geometría.

En G-4, **Ver sólo áreas, sin instalaciones** muestra los contornos ASDI/ARCE y sus áreas internas,
y oculta las instalaciones logísticas. También oculta las instalaciones de personal vinculadas a esos
contornos mediante `areaLog`; los puestos externos conservan sus controles del G-1. Los ejes mantienen
la visibilidad que tenían antes de pulsar el botón.

Cuando existe un contorno ASDI/ARCE con al menos tres vértices y falta alguno de los cuatro sectores,
se representa ese sector usando la función de plantilla existente `rDe`, con su rumbo guardado.
Las instalaciones que calcula esa función no se incorporan al ejercicio. El panel identifica estas
áreas como **esquema de la plantilla**, para distinguirlas de áreas trazadas y guardadas por el usuario.
Si no hay contorno, no se inventa una ubicación.

`sectoresRepresentados` conserva primero los sectores guardados, con sus índices originales; añade
los esquemas solamente a la representación y los marca `soloVista`. Los esquemas no ofrecen acciones
de edición que pudieran modificar otro sector. Los contornos guardados y las instalaciones originales
permanecen intactos al ocultar, volver a mostrar o guardar el ejercicio.

La misma representación llega a Mapa, al espejo 3D y a Google 3D. El ojo **Áreas internas del ASDI/ARCE**
oculta sólo los sectores, manteniendo el contorno exterior.

```bash
node calcos/pruebas/construir-areas-logisticas.js
npm run test:areas-logisticas --prefix calcos/pruebas
CESIUM_DIR=…/Build/Cesium npm run e2e:areas-logisticas --prefix calcos/pruebas
```

El constructor genera `index-areas-logisticas-20261029.js` desde el compilado congelado
`index-productos-em-20261029.js`, comprobando su SHA-256 y la reversibilidad completa del cambio.
