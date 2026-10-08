# Áreas de operaciones y aislamiento de ejercicios — 08-OCT-2026

## Diagnóstico confirmado

En `index-organizacion-20261006.js`, terminar un trazado `areaops` devolvía
`{...ct, areaOps: nueva}`: reemplazaba deliberadamente el único polígono.
El callback `Av` (nuevo ejercicio / limpiar vista) omitía `setPlanFuegos(null)`
y `setAcadMesa(null)`. El plan anterior permanecía en memoria y el autoguardado
podía copiarlo al ejercicio recién creado. Abrir un ejercicio guardado sí cargaba
su propio `planFuegos`. No es evidencia de corrupción de toda la base de datos.

## Contrato compatible para Claude

- `ops.areaOps` sigue siendo el área activa, compatible con consumidores existentes.
- `ops.areasOps` conserva las otras áreas, con identificador propio, nombre,
  unidad responsable y operación asignada. `listarAreas()` da prioridad a la
  versión activa para conservar sus últimas ediciones de vértices.
- Cada trazado añade un área. Cambiar de selección conserva la anterior.
  El menú de borrado elimina solamente la activa y selecciona otra si queda alguna.
- El gestor respeta el candado de la BASE cuando pertenece a otro puesto y
  bloquea cambios en ejercicios finalizados.
- En la carta 2D, las otras áreas aparecen punteadas y rotuladas; se seleccionan
  en el panel para editarlas. El análisis existente sigue usando el área activa.
  No se modifica el motor 3D: allí sigue mostrándose el área activa.
- Compartir exporta exclusivamente las áreas marcadas a `areas_operaciones.json`.
  En el ejercicio de destino, **Importar áreas compartidas** las añade sin
  transferir fuegos, fichas, notas, documentos o tareas del origen.
  Después se reparte la BASE mediante el flujo existente. No asigna nuevos
  permisos de alumnos ni envía enlaces automáticamente.
- Crear/limpiar ejercicio limpia plan, estado académico y modos de captura.
  Abrir un ejercicio carga su plan; importar una BASE limpia el plan previo,
  porque el contrato BASE no incluye fuegos.
- El módulo de fuegos limpia selección, borradores y captura al cambiar de
  ejercicio. No borra archivos guardados ni decide el origen de blancos existentes.

## Alcance de datos existentes

No se ha modificado ningún registro de producción. Un ejercicio ya guardado con
blancos heredados requiere que el docente confirme cuáles son ajenos; no hay
proveniencia suficiente para eliminarlos automáticamente sin riesgo.
Una sola área antigua abre sin migración destructiva. No es posible recuperar
áreas previamente reemplazadas salvo desde respaldos.

## Construcción y revisión

`node calcos/pruebas/construir-areas.js` aplica 12 sustituciones únicas al
compilado vigente y verifica reversión byte por byte. Genera
`index-areas-20261008.js`, conserva el compilado anterior y cambia solamente
la referencia en `calcos/index.html`. La cadena de verificación incluye el paso.

Pruebas:

```bash
npm ci --prefix calcos/pruebas
node calcos/pruebas/areas-operaciones.mjs
node calcos/pruebas/edicion-figuras.cjs
node calcos/pruebas/plan-fuegos-modelo.js
node calcos/pruebas/reemplazos-compilado.js
node calcos/pruebas/e2e/areas-aislamiento.cjs
```

Validación: modelos, edición y cadena reversible pasan. La prueba en Chromium
de GitHub Actions confirmó exportación/importación aditiva, plan vacío en nuevo
ejercicio, conservación y reapertura del plan original, y ausencia de errores JS.
El servidor de prueba incluye MIME para `.mjs` y ubica el botón de ejercicios
por su título estable, porque su nombre visible cambia al abrir un ejercicio.

Antes de integrar, comprobar el HEAD actual de `main`: Claude puede haber
publicado otros cambios. Integrar la rama mediante PR, sin force-push ni
reemplazar una versión posterior del compilado. Reversión: restaurar las
referencias anteriores de `calcos/index.html` y el módulo de fuegos. No abrir y
guardar un ejercicio con varias áreas usando versiones anteriores del editor.
