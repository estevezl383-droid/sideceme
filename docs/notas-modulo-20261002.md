# Carga de notas por MÓDULO — 02/10/2026

## Qué hace
- Sub. Sec. Evaluaciones → «Cargar notas por MÓDULO (desde el Excel)». El Excel se lee en el navegador.
- El módulo se elige de la malla (`av_materias`); cada columna de materia del Excel se empareja con la materia ya cargada (sugerencia automática, el operador confirma). La cantidad de materias la da la planilla.
- «Comparar con las notas del sistema» (simulacro, no escribe). Cada nota se compara EXACTA, sin redondear (solo se quita el ruido binario a 10 decimales), contra `notas_academicas`, y se exige conformidad `confirmada` sobre ese mismo valor.
- El PROMEDIO se guarda TAL CUAL viene de la planilla: no se recalcula.
- Alumno con nota distinta, sin nota, materia objetada o sin firmar → RETENIDO (no ve el módulo) + alarma en `notas_modulo_alarmas` + push al auxiliar (es_auxiliar) y al evaluador del ciclo (`evaluador_ciclo`: Ortiz 1er ciclo, Soto 2do).
- Los demás reciben el promedio para firmar/objetar (48 h por defecto). Al abrir la firma se revalida: si una materia cambió, se retiene y alarma.
- El alumno ve «Promedio por módulo» arriba de sus notas; tocando una materia ve su desglose.
- Nada se borra: no se tocan notas ni firmas de materias; una recarga conserva las firmas que siguen valiendo y guarda la versión previa en `anterior`.
- El orden de mérito del módulo NO se calcula aquí (será una carga aparte).

## Despliegue (en este orden)
1. Aplicar `supabase/notas/002_notas_modulo.sql` (solo crea 3 tablas nuevas).
2. Desplegar `supabase/functions/notas-modulo/index.ts` con verify_jwt = false.
3. Publicar `index.html`.

## Validación
`node --test tests/notas-modulo.test.cjs` (base simulada). Prueba de navegador con la planilla de ejemplo de EMC I: 4/4 columnas emparejadas, 125 alumnos, valores exactos.

## Reversión
Revertir el commit del frontend. Las tablas nuevas pueden quedar o borrarse; no afectan a ninguna otra.
