# Identidad del ejercicio (2026-10-01)

Solicitud de Sergio: después de cargar documentos, mostrar SIGUIENTE y exigir
«¿QUIÉN SOY YO / QUÉ UNIDAD REPRESENTO?». El inicio se amplía con tamaño de letra
legible y diseño adaptado al teléfono.

- `v1/modelo.js`: extrae designaciones del texto documental, conserva nombres en
  renglones partidos, deduplica y guarda la selección. No interpreta misiones ni
  modifica calcos, hojas o documentos existentes.
- `v1/editor.js`: selector explícito, fuente documental y registro manual cuando
  falta texto (imagen / escaneo / unidad no identificada).
- Identidad persistida en `ops.unidadConsiderada`, `ops.contextoDocumental`,
  `ordenSup.unidad` y nombre / magnitud de `unidadAnalisis`. Entran en el guardado
  habitual, duplicado y exportación del ejercicio. La información documental
  existente se conserva.
- Los expedientes y exportaciones militares exigen la identidad confirmada.
  Los ejercicios finalizados que ya tienen unidad conservan su consulta.
- EXCEPCIÓN autorizada: sólo al abrir el ejercicio existente llamado exactamente
  ARMAS (sin distinguir mayúsculas), se aplica DIV.MEC.-1 / división. Se registra
  `ops.migracionesIdentidad.armas-dimec1-20261001`; una elección posterior del autor
  no vuelve a sobrescribirse. COSA y otros nombres no se modifican. No es un valor
  predeterminado para nuevos ejercicios. Requiere abrir ARMAS en la versión nueva;
  no se ha ejecutado una escritura directa de los datos de producción.

La Mesa sólo está disponible como compilado en este repositorio. El constructor
`pruebas/construir-inicio-ejercicio.py` parte del compilado militar anterior intacto;
la lista de reemplazos y sus SHA-256 permiten comprobar su reversibilidad.
Trasladar estos puntos al fuente React si se recompila fuera de este repositorio.

Validación: `node calcos/pruebas/inicio-ejercicio.cjs`,
`node calcos/pruebas/inicio-ejercicio-ui.cjs` (React / jsdom con TEST_DEPS), pruebas
militares de integración / IA / interfaz y verificación sintáctica del compilado.
La prueba histórica `reemplazos-compilado.js` tiene 10 fallos de hash con el
compilado militar previo y con el nuevo; faltan los pasos intermedios de septiembre
30 en esa prueba. No son diferencias introducidas por esta modificación.
