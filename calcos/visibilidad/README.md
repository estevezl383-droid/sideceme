# Grupos plegados y controles de visibilidad

Los grupos de **Qué se ve en el calco** y el panel de **Áreas de Interés**
arrancan plegados. La flecha despliega sus controles. El ojo de cada cabecera
muestra u oculta el grupo completo, incluyendo las subcapas previamente apagadas
al volver a mostrarlo. El ojo del terreno también oculta sus capas base y las
restaura al volver a encenderlo.

Cada área tiene un ojo propio. Activar una cuando todo está oculto muestra sólo
esa área. Ocultar un contorno no lo borra y no altera la geometría con la que se
generan los calcos. Los mismos controles afectan al espejo 3D.

La Mesa de preparación y el tablero de pasos del instructor comienzan plegados;
la bienvenida de preparación deja de abrirse automáticamente. Se retiró el
acceso separado «Cartografía · 5 áreas» del panel izquierdo.

En modo paquetes, el generador consulta únicamente Bolivia. Se eliminaron los
avisos rutinarios de país y capas civiles; los otros avisos se deduplican. Los
errores de cobertura, archivo dañado o autorización siguen siendo visibles,
incluso con el panel de áreas plegado.

Construcción reproducible desde el compilado anterior, comprobando su SHA-256
y la reversibilidad de los cambios:

```bash
node calcos/pruebas/construir-areas-logisticas.js
```

Pruebas con datos ficticios y un paquete cifrado generado para el test:

```bash
npm run test:visibilidad --prefix calcos/pruebas
npm run e2e:visibilidad --prefix calcos/pruebas
npm run e2e:areas-interes --prefix calcos/pruebas
```

El paquete de prueba se sitúa dentro de Bolivia, en una zona cuya caja también
intersecta la caja de Brasil. Se comprueba que no se consultan otros países, que
se generan los calcos y el CMOC, que no aparecen avisos repetidos y que cerrar
el paquete produce un error real visible.

La versión vigente añade los [cursos de G-2 y G-3](CURSOS-G2-G3.md) al panel.

Los grupos G-4 y G-1 debajo de G-3 se describen en [PRODUCTOS-G4-G1.md](PRODUCTOS-G4-G1.md).
