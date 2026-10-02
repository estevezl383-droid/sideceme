# Corregir la nota final: ajuste de decimales — 02/10/2026

## Qué hace
- En «✏️ Corregir la nota» se ve la cuenta del promedio del desglose
  (p. ej. `94 × 10% + 92.0635 × 30% + 95 × 60% = 94.01905`), la nota cargada hoy
  y un casillero **«Nota final a guardar»**.
- El evaluador de ciclo puede escribir la nota final para que coincida con la
  planilla publicada (p. ej. 94.0191), solo como **ajuste de decimales**: menos
  de 0.01 de diferencia con el promedio del desglose. Para mover más, se
  corrige el casillero (trabajo / formativa / sumativa), como antes.
- Se puede corregir un casillero y además ajustar los decimales de la nota que
  resulta, en la misma corrección.
- Igual que cualquier corrección: queda en el historial con motivo y nombre, el
  alumno vuelve a firmar (48 h) y le llega el aviso al auxiliar. En «Qué
  cambió» aparece `NOTA FINAL · ajuste a mano (el desglose da …)`.
- Las notas sin desglose (modo C) siguen igual: se escribe la nota final.

## Despliegue (en este orden)
1. Desplegar `supabase/functions/notas-ops/index.ts` con verify_jwt = false.
   Es compatible con la pantalla anterior (solo agrega un camino).
2. Publicar `index.html`.

## Validación
`node --test tests/notas-correccion-ajuste.test.cjs` (EF con base simulada y el
modal). Caso real: C123, HISTORIA MILITAR APLICADA I, 94.01905 → 94.0191.

## Reversión
La versión anterior de la EF (v10, la desplegada hasta hoy) está en el commit
«notas-ops: versión desplegada (v10) tal cual». Revertir el commit del frontend.
