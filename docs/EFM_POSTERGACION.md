# Postergación de exámenes físicos

En Entrenamiento Físico → Exámenes físicos → Ver notas y reclamos, abrir al cursante, indicar el respaldo y seleccionar «Aprobar con solicitud de postergación». El rol `sub_ef` ya corresponde al My. Linares (P020) y al Tcnl. Aguirre (P019); no se cambian roles.

El estado administrativo aparece verde, separado de «Firmaron». Conserva el reclamo, la firma anterior y las marcas; la nota parcial no se muestra como definitiva en las lecturas ni los reportes. El cursante ve la tarjeta aun sin nota final. No se convierten automáticamente ceros en notas ni se inventan pruebas pendientes.

Para completar: corregir las pruebas, escribir la nota final calculada en la planilla y marcar «Examen rendido». Una corrección parcial o una recarga no cierra la postergación. Al cerrarla, se pide nueva conformidad y se conserva la historia de la aprobación. Se mantiene el cálculo existente de la planilla, sin introducir un cálculo alternativo.

## Activación en producción

1. Ejecutar `supabase/efm/005_postergacion.sql` (transacción: columna opcional, nuevo estado y trigger de historial atómico; no cambia filas existentes).
2. Desplegar `supabase/efm/efm-ops/index.ts` como `efm-ops`, conservando `verify_jwt=false` y la validación de sesiones propia. El original coincide con versión 6 de producción consultada el 11/10/2026.
3. Publicar el frontend de esta rama. No publicar el frontend antes del servidor y el esquema.
4. Comprobar en la interfaz con un caso autorizado: aprobación, tarjeta del cursante, contador verde, corrección parcial y cierre con nueva firma.

La implementación no aprueba automáticamente los reclamos existentes. Los encargados deciden cada caso con su respaldo.

## Validación

`node tests/efm-postergacion.test.cjs`: sesiones y permisos de ambos encargados, denegación a cursantes y otros roles, publicación requerida, históricos protegidos, duplicados, conflicto concurrente al aprobar, conservación de marcas/firma, nota parcial oculta, corrección parcial, cierre explícito y tarjeta pendiente. Base simulada sin escrituras en producción.

`node tests/conformidad-nota-vigente.cjs` y `node tests/notas-correccion-ajuste.test.cjs`: regresión de firmas y notas académicas. También se comprueba la sintaxis de todos los scripts inline.

El SQL del trigger requiere la comprobación final al activar en Supabase; no se ha ejecutado en producción en esta preparación.
