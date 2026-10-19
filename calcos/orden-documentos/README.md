# 📄 La Orden del escalón superior sale de los documentos del ejercicio — 19-10-2026

Lo pidió Sergio con la captura de la **F1·P7 Orden Preparatoria N° 1** («Todavía no hay nada en el
calco para sembrar esta hoja») teniendo cargadas la Orden de Operaciones y sus anexos en
📁 Ejercicio → Documentos:

> «Los documentos que yo cargo por ahí, esos deben ser la fuente de información… para cualquiera
> que suba esos son los documentos para sacar información… en el desarrollo de los ejercicios esa
> es la fuente de información.»

## Qué pasaba

Las hojas del Estado Mayor (Orden de Alerta, Órdenes Preparatorias, Guía Inicial, el membrete de
los documentos militares, los pedidos a la IA…) se llenan con la **Orden del escalón superior** de
MESA EM (`ordenSup`). Esos casilleros sólo se llenaban a mano: la Orden cargada como documento no
los alimentaba. Con MESA EM vacía, «🌱 Traer del calco lo que falte» no tenía de dónde sacar nada.

## Qué hace ahora (`v1/orden.mjs`)

Cada vez que cambian los documentos o la Orden del escalón superior, la Mesa llama a
`completarOrdenSup(ordenSup, documentos, {unidad})` y llena los casilleros **vacíos** con lo que
dice la Orden cargada:

| Casillero | De dónde sale |
|---|---|
| Escalón superior, CG., fecha/hora | El membrete («FF.TT.T.O. / CG. Challapata. D-44 (0900)»); si la Orden no lo trae (un .md), el de un anexo |
| Número, carta, clasificación | «ORDEN DE OPERACIONES No. 01», «CARTA: …» |
| Enemigo | «Fuerzas enemigas» con sus «Curso de acción más probable / más peligroso» |
| Fuerzas propias | La MISIÓN del escalón superior (párrafo II) y «Fuerzas propias» |
| Refuerzos | «Refuerzos y reducciones» |
| Intención, concepto | «Intención del Comandante», «Concepto de la operación» + «Maniobra» |
| **Misión, tareas, organización** | El párrafo de **nuestra unidad** (la de MESA EM o la unidad considerada) en «Tareas de las unidades de maniobra» (o de apoyo de combate): «El CE-I defiende el AO LAUCA, a partir del D (0400)…», sus tareas, y «CE-I: DIV MEC-2, DIV-1, DIV-6; GALM-1 en refuerzo» |
| Coordinación, comando, comunicaciones | «Instrucciones de coordinación», «Comando», «Comunicaciones» |

- **No pisa lo escrito**: sólo llena casilleros vacíos.
- **Una sola vez**: lo que llenó queda anotado en `ordenSup._desdeDocs` (con el nombre del
  documento); si el oficial lo borra, no vuelve.
- **No toca un ejercicio finalizado.**
- Lee la Orden como la extrae la Mesa de un **Word** (membrete arriba, títulos sin numeración) y
  como viene en un **.md** («I.- SITUACIÓN.», «A.- Fuerzas enemigas. Ver…», «1.- CE-I (…).»,
  «a.- Defiende…»). Entre copias (el .md y el Word de la misma Orden) toma la más completa; los
  anexos no se confunden con la Orden.
- Las Órdenes Preparatorias llevan, además, la organización de la tarea en «ORGANIZACIÓN (MEDIOS)».

## En el compilado

`index-orden-documentos-20261019.js` (ver `CAMBIOS-EN-EL-COMPILADO.md`): el import del módulo, un
`useEffect` sobre `[documentos, ordenSup, unidad considerada]` que llama a `completarOrdenSup` y,
si hay algo, actualiza la Orden (se guarda con el ejercicio), y la organización en las Órdenes
Preparatorias.

## Pruebas

- `pruebas/orden-documentos.mjs`: Word y .md ficticios con la forma de la Orden de la Escuela
  (membrete, CAE, «Misión:» del CTO que no es el párrafo II, «Esfuerzo principal.» del CE-II, una
  unidad de apoyo de combate, no pisar, una sola vez, sin Orden).
- `pruebas/e2e/orden-documentos.cjs`: la Mesa real con la Orden (.md, sin membrete) y un anexo
  cargados y MESA EM vacía: la Orden se llena sola sin pisar lo escrito, se guarda, y la F1·P7
  «🌱 Traer del calco lo que falte» trae misión, enemigo y organización.
