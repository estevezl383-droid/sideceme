# Varias Áreas de Interés para generar calcos

En **2 · Áreas de Interés**, «＋ Dibujar un área de interés» inicia el primer
contorno. Después de marcar tres o más vértices en la carta, «✓ Añadir Área de
Interés» lo conserva. «＋ Dibujar otra área de interés» permite añadir cinco,
seis o más áreas en el mismo ejercicio. La barra «📐 Área de Interés» también
empieza un contorno nuevo, conservando los anteriores.

Cada área tiene nombre propio y un botón para quitarla individualmente. Los
KML/KMZ y las áreas derivadas del Área de Operaciones se añaden al conjunto.
Todos los contornos permanecen visibles en 2D y 3D. En 2D se muestran también sus
nombres. Los ejercicios bloqueados y las BASE de otros puestos conservan su
candado.

**⚡ GENERAR CALCOS** trabaja sobre la unión de todas las áreas, con el motor
geográfico existente. Los huecos entre sectores quedan fuera del análisis. Las
superposiciones no duplican los datos del terreno. Añadir o quitar un área
descarta los calcos anteriores para poder generarlos con el contorno actualizado.
Renombrar un área conserva esos calcos.

Los nombres y contornos se guardan dentro de `aoi.properties.areasInteres`.
`aoi.geometry` sigue siendo un Polygon/MultiPolygon válido, unión de las áreas,
para conservar el contrato del generador de calcos y de los archivos antiguos.
El guardado del ejercicio, sus JSON y la BASE conservan esa información sin
cambios de base de datos. Las áreas antiguas sin la lista siguen abriendo.

El compilado inicial de esta función se construyó con
`construir-areas-interes.js`. La versión vigente incorpora los controles de ojo
y los grupos plegados; se reproduce con:

```bash
node calcos/pruebas/construir-productos-em.js
```

El constructor verifica el SHA-256 del compilado de partida y la reversibilidad
de cada cambio antes de generar `index-productos-em-20261029.js`. No modifica
los compilados anteriores ni sus hashes esperados.

Pruebas desde el directorio raíz, con Node 22 y PLAYWRIGHT_MODULE configurado:

```bash
npm run test:areas-interes --prefix calcos/pruebas
npm run e2e:areas-interes --prefix calcos/pruebas
```

La prueba de navegador dibuja cinco áreas con el ratón, genera calcos con datos
ficticios dentro/fuera/entre sectores, añade un KML superpuesto, quita sólo ese
contorno, guarda y vuelve a abrir el ejercicio, y comprueba el recorte después
de quitar un sector. No consulta servicios de producción.
La segunda prueba de navegador comprueba un archivo antiguo, los candados de
la BASE del G-3 y los cinco contornos al pasar de 2D a 3D y volver.

La cadena histórica `reemplazos-compilado.js` ya fallaba sobre el compilado de
paquetes antes de este cambio: no describe ese paso. Este trabajo no cambia sus
hashes esperados. La construcción de esta función tiene su propia comprobación
de partida, reversibilidad y reproducción, además de las pruebas funcionales.
