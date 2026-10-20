# 🧭 El dispositivo de la carta para la IA — 20-10-2026

Lo pidió Sergio con las «Tareas de las unidades de maniobra» que escribió la IA para el CE-I:
«DIV MEC-2 (Esfuerzo Principal): defiende el sector norte… DIV-6 (Reserva Operacional)…». En el
calco, la DIV-6 está adelante al norte, la DIV-1 adelante al sur y la DIV MEC-2 atrás: «dos adelante,
uno atrás, en dirección del enemigo».

## Qué pasaba

A la IA le llegaban las fichas con su lat, lng sueltas. Nada le decía cuál está adelante, en qué
sector, ni cuál atrás, y repartía los sectores, el esfuerzo principal y la reserva por el orden en
que la Orden nombra las unidades.

## Qué hace (`v1/dispositivo.js`)

- **De dónde viene el enemigo**: lo elegido en «🧭 ¿De dónde viene el enemigo?» (hoja P.D.); si no,
  las fichas enemigas de la carta; si no, el frente del Área de Operaciones.
- **Qué unidades**: las de maniobra que dependen de la unidad considerada (las de «⊞ Disgregar»), o
  las propias de maniobra del escalón más alto por debajo de ella. Las de apoyo de combate (GALM-1…)
  se nombran aparte, sin sector.
- **Adelante o atrás**: la que está a más de 4 km (o del 40 % del ancho del dispositivo) detrás de la
  más adelantada es **segundo escalón / reserva**. Las de adelante reciben su **sector** de norte a
  sur (o de oeste a este, si el enemigo viene del norte o del sur).
- **La regla para la IA**: los sectores, el esfuerzo principal y la reserva salen de ESTE dispositivo;
  la de atrás nunca es el esfuerzo principal de primer escalón; si la Orden dice otra cosa, se sigue el
  calco y se avisa en «PARA EL PROFESOR».

## Dónde va

- El pedido de la IA del profesor (`modalidad/ia-profesor.js` → `contexto`): la OGO y todos los pasos.
- El pedido de las hojas del Estado Mayor (`estado-mayor/v6/registro.js` → `cierreIndicacion`), con la
  foto del ejercicio de la Mesa (`window.SIDMesaEjercicio`).

## Pruebas

`pruebas/dispositivo.cjs` (el caso de Sergio, la dirección de la hoja P.D., sin disgregar, todas en
línea, el pedido del profesor) y `pruebas/e2e/disgregar.cjs` (cargado en la Mesa real).
