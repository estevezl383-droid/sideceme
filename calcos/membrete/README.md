# Membrete táctico de los documentos militares

Lo pidió Sergio (docente). Todos los **documentos militares** que salen del PMTD llevan,
debajo de la clasificación y en **Arial 10 negrilla**:

```
                                   SECRETO
CE-I                                          ← escalón superior
DIV.MEC.-1                CG. VIACHA D-15 (2300)   ← unidad considerada · CG · hora táctica
EMO/SEC-III                                   ← Estado Mayor Operativo / sección que lo elabora
No. 001/SMM                                   ← correlativo de la sección / iniciales del usuario
```

- **«CG. …» empieza debajo de la R de SECRETO** (la 4.ª letra de la clasificación,
  centrada en el encabezado en Arial 12 negrilla): en hoja carta vertical, a 4617 twips
  del margen izquierdo (`tabulacion()`).
- **Unidad considerada** («quiénes somos»): la «Unidad considerada (quiénes somos)» de la
  Orden del escalón superior (en el ejercicio de la Escuela, **DIV.MEC.-1**); su escalón
  superior es el «Escalón superior» de la Orden (CE-I) y su CG el «Puesto de Mando» (CG.
  VIACHA). Si se escribe **«Otra unidad considerada»** (p. ej. RCB-1), la de la Orden pasa a
  ser su escalón superior y el CG se busca en el calco (abajo). Sin ningún dato, RCB-1.
- **CG** (cuando la unidad considerada es otra): «CG de la unidad considerada» si se escribió en la Orden; si no, el **pueblo más
  cercano** a su puesto de comando (ficha `pc` «PC RCB-1») o a su ficha en el calco, en
  MAYÚSCULAS. Sin ficha queda `CG. ……………` para llenar a mano.
- **Hora táctica** (día D) de **este** documento en la Línea Inicial de Tiempo del paso 1:
  fase I → la recepción de la orden; fases II a VII → el fin de esa fase en el reparto del
  tiempo de planeamiento. Un documento sin fase (una apreciación armada desde el calco) →
  ahora, si cae dentro del planeamiento; si no, el fin del planeamiento. Sin Línea de
  Tiempo la hora queda vacía (nunca la de la Orden de otra unidad).
- **Sección**: siempre EMO; la pestaña donde se elabora (G-1 → EMO/SEC-I … G-5 →
  EMO/SEC-V; JEM y Comandante → EMO/JEM).
- **Número**: correlativo **por sección**, en el orden del PMTD: el primer documento
  militar que la sección tiene elaborado es el 001, el siguiente el 002…
- **Iniciales**: «Clave del redactor» de la Orden si se escribió; si no, las del usuario de
  SIDECEME (primer nombre + apellido paterno + materno: SERGIO HERNAN MORALES MILLAS → SMM).
- **Las hojas de trabajo no son documentos militares: no llevan membrete.** La lista de
  documentos militares está en `DOCUMENTOS_MILITARES` (alerta, evaluación inicial, línea
  de tiempo y programa, guía inicial, preparatorias, orden de reconocimiento, matriz de
  riesgo, orientación, intención, guías de planificación, requerimientos críticos, plan de
  búsqueda, listas de blancos, tipo de ensayo, orden de operaciones y anexos).

## Dónde se usa

- El Word genérico de la Mesa (`_ie`, `Ex`, `W5e`, `rP`, `f3e` del compilado): ver
  `calcos/pruebas/reemplazos-2026-09-29-membrete.js`.
- El **formato militar** (`calcos/formato-militar/v1/runtime.js` y `word.js`): el diálogo
  y el Word toman superior, unidad, CG, hora, sección, correlativo e iniciales de acá; lo
  que el oficial corrige a mano en ese diálogo se respeta. El correlativo no se repite
  dentro de la misma sección.
- La matriz de riesgo (`calcos/riesgo/v2/`).

`membrete.js` no usa el DOM (se prueba en Node). El compilado le pasa la Línea de Tiempo
(`MS`) y el rótulo de las fichas (`js`) con `configurar()`, y el ejercicio (fichas, capas,
hojas de cada sección, la Orden, el oficial) con `sincronizar()` en cada cambio.

## Pruebas

```bash
cd calcos/pruebas && npm ci
node membrete.cjs              # reglas, Línea de Tiempo real, rP/_ie del compilado
node e2e/membrete.cjs          # Word real de la O. Preparatoria N° 1 en Chromium
node reemplazos-compilado.js   # la cadena de compilados es reversible
```
