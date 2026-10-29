# G-4 y G-1 debajo de G-3

Los grupos **G-4 · Logística** y **G-1 · Personal** comienzan plegados y tienen un ojo por producto y por grupo.
Muestran los elementos de la carta actual y su cantidad; los controles sin elementos están desactivados.

- G-4: ASDI, ARCE, EPA y EPE. Si existen, también aparecen otras áreas, sectores e instalaciones logísticas.
- G-1: línea de extraviados y puestos/centros de reunión de prisioneros. Si existen, aparecen puestos de
  reunión y control de extraviados, rutas de evacuación de prisioneros y otras instalaciones de personal.

Los tipos de instalaciones se obtienen del catálogo de la aplicación. Las instalaciones civiles y las del
enemigo conservan sus controles actuales. Al ocultar un ASDI o ARCE se ocultan también sus sectores y fichas
vinculados mediante `areaLog`. El control anterior «Logística» del Calco del EM sigue funcionando como
maestro de las áreas; encender sólo ASDI desde G-4 restaura ese tipo sin encender ARCE.

`productoVisible` se consulta dentro del bucle que dibuja cada objeto: no filtra ni renumera los arrays de
operaciones. De ese modo editar o borrar un área visible sigue usando su índice original, aunque haya otra
área oculta antes. Las fichas se filtran sólo en la representación y sus acciones siguen usando el ID.
Los datos editables, las fases y el guardado no se modifican al usar los ojos.

La carta 2D, su espejo 3D y Google 3D reciben la misma visibilidad. Las capas importadas o superpuestas
conservan sus controles propios en «Superponer».

Construcción y pruebas desde la raíz:

```bash
node calcos/pruebas/construir-areas-logisticas.js
npm run test:productos-em --prefix calcos/pruebas
CESIUM_DIR=…/Build/Cesium npm run e2e:productos-em --prefix calcos/pruebas
```

El constructor verifica el SHA-256 de `index-productos-em-20261029.js`, la unicidad de cada reemplazo y
la reversibilidad completa. Genera `index-areas-logisticas-20261029.js`, sin modificar compilados anteriores.
La prueba de navegador usa datos ficticios: verifica ojos individuales y de grupo, las tres vistas,
conservación del ejercicio y edición del ARCE de índice 1 mientras el ASDI de índice 0 está oculto.

La vista de las cuatro áreas sin instalaciones se detalla en [AREAS-LOGISTICAS.md](AREAS-LOGISTICAS.md).
