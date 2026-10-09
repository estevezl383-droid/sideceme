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
- **Compartir en la aplicación / Recibidos** usa una bandeja en `calco_compartidos`.
  El docente guarda el origen, pone nombre al envío, marca áreas y elige un
  ejercicio personal propio o un grupo activo. El paquete contiene nombres y
  contornos, y opcionalmente unidad, operación, documentos e indicaciones.
  `planFuegos`, respuestas, notas y las demás capas nunca se copian.
  El receptor incorpora al ejercicio abierto; no se reemplaza el payload del
  destino al enviar. `ops.entregasAreas` evita incorporar dos veces el mismo
  envío. Los documentos se añaden con identidad propia; los previos se conservan.
  La copia JSON de áreas sigue disponible como respaldo opcional.
- Las tres acciones `areas_destinos`, `areas_enviar`, `areas_recibidos` pasan por
  la sesión SIDECEME existente y verifican origen/destino en el servidor.
  Las tablas nuevas tienen RLS y acceso exclusivo por service_role; no se usa
  service_role en el navegador. Los cursantes leen solo su grupo y ejercicio.
- Crear/limpiar ejercicio limpia plan, estado académico y modos de captura.
  Abrir un ejercicio carga su plan; importar una BASE limpia el plan previo,
  porque el contrato BASE no incluye fuegos.
- El módulo de fuegos limpia selección, borradores y captura al cambiar de
  ejercicio. No borra archivos guardados ni decide el origen de blancos existentes.

## Alcance de datos existentes

DIAMANTE (propietario verificado P030, Sergio Morales) contiene 14 blancos
AB-010–AB-023 cuyo plan es idéntico al de ARMAS y cuyos identificadores fueron
creados antes que DIAMANTE. La limpieza confirmada se limita a esos IDs en
ese calco. Antes de limpiar se guarda el payload entero en `calco_versiones`.
`calco_blancos_excluidos` impide que el autoguardado de una pestaña antigua
reintroduzca los mismos IDs en DIAMANTE. No afecta otros ejercicios ni nuevos
registros de DIAMANTE. Para restaurar el respaldo, quitar primero esas
exclusiones y recuperar la versión; no borrar los respaldos.
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
node calcos/pruebas/areas-compartir.mjs
node calcos/pruebas/edicion-figuras.cjs
node calcos/pruebas/plan-fuegos-modelo.js
node calcos/pruebas/reemplazos-compilado.js
node calcos/pruebas/e2e/areas-aislamiento.cjs
node calcos/pruebas/e2e/areas-compartir.cjs
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

## Despliegue del servidor

Fuente conservada en `supabase/espejo-ge/calco-ops/`. El entrypoint solo agrega
el import y la llamada al despachador; los flujos anteriores quedan intactos.
Para desplegar, incluir `index.ts`, `compartir.mjs`, `compartir-modelo.mjs` y
`modelo.mjs`. En la copia de despliegue, cambiar el import del despachador
a `./compartir-modelo.mjs` (en el repo usa la ruta del módulo frontend).
Aplicar primero la migración `20261008160528_calco_compartidos.sql`.
JWT permanece OFF porque la función valida las sesiones institucionales.
No se generan nuevos grupos ni se envía contenido real a destinatarios
sin selección expresa del docente.

## Frentes y profundidades (09-OCT-2026)

`node calcos/pruebas/construir-frentes.js` aplica 4 sustituciones reversibles a
`index-areas-20261008.js` y genera `index-areas-20261009.js` (lista en
`calcos/pruebas/reemplazos-2026-10-09-frentes.js`). Cuadro PMTD 2017 Tabla 45 con
valores fijos por terreno (llano/altiplano ×1,0; valle/montaña frente ×0,7; selva
frente ×0,5 y profundidad ×0,7), retrógradas = defensiva ×2 frente, ×1,5 profundidad.
Las claves de ambiente guardadas (`llano`, `altiplano`, `montana`, `selva`) no cambian.
