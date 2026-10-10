# 💾 Autoguardado de la Mesa del EM — 10-10-2026

Lo pidió Sergio (Profesor) con una captura del sello **«💾 guardado 10:34 a. m.»** de la barra:
«parece que no funciona, no autoguarda» y «que se le dé click y que se quede guardado ese rato
todos los cambios».

## Qué pasaba

Se revisó el compilado y los registros de `calco-ops` de esa mañana: el autoguardado **sí
guardaba** cada vez que cambiaba el ejercicio (todas las respuestas del servidor fueron 200),
pero el sello no lo dejaba ver:

- decía sólo la hora y el minuto: un guardado dentro del mismo minuto no cambiaba nada en
  pantalla, y lo que no es del ejercicio (marcar los pasos del Profesor, prender capas, abrir
  tableros) no se guarda, así que la hora quedaba quieta y parecía trabado;
- si un guardado fallaba, el sello seguía con la hora vieja (el error salía en otro lado);
- no se podía tocar: no había forma de guardar «ya» desde ahí;
- un cambio hecho justo antes de cerrar la pestaña (dentro de los 2,5 s) no se guardaba, y un
  cambio que no le avisara a React no se guardaba nunca.

## Qué hace ahora

Código legible en `v1/autoguardado.mjs` (el compilado lo importa; ver
`CAMBIOS-EN-EL-COMPILADO.md`) y `v1/guardado.css`.

| | |
|---|---|
| Cada cambio | Se guarda solo 2,5 s después del último cambio (como antes). Si los cambios no paran (escribir de corrido, arrastrar), igual cada 15 s. |
| Red de seguridad | Cada 30 s compara el ejercicio con lo último guardado; si difiere, lo guarda. |
| Tocar el sello / Ctrl+S | Guarda **todo en ese momento**, aunque no haya cambios. |
| Si falla | El sello dice **«⚠️ no se guardó · reintentar»** (con el motivo al pasar el mouse) y se reintenta solo a los 10 s, 30 s y cada 60 s. El aviso de siempre también sale. |
| Al salir | Al cambiar de pestaña o minimizar se guarda lo pendiente; si se cierra o recarga con algo sin guardar, el navegador pregunta antes. |
| El sello | **● sin guardar · guardar** → **💾 guardando…** → **✓ guardado 10:34:12** (con segundos). Con el ejercicio finalizado, **🔒 finalizado**. El estado también va en `data-estado` (lo usa el aviso de versión nueva para guardar antes de recargar). |

Lo que se guarda es lo mismo de siempre (la foto del ejercicio que arma la Mesa, `og.guardar`,
el candado que no deja pisar un ejercicio con trabajo con una pantalla en blanco). No cambia el
servidor ni el formato del ejercicio.

### El ejercicio para los módulos de afuera (10-10-2026)

`usarAutoguardado` deja en `window.SIDMesaEjercicio` (`nombre()`, `foto()`) la misma foto que se
guarda, tal como está en la pantalla. La usa el tablero del profesor (`calcos/modalidad`) para
armar los pedidos a la IA con el CMOC, la Orden y el Área de Interés: con la Mesa publicada el
ejercicio va a SIDECEME y en el IndexedDB del navegador sólo queda una copia de respaldo. Es de
sólo lectura (la foto comparte objetos con el estado de React).

### Lo que NO se guarda en el ejercicio (como antes)

Los pasos marcados del tablero 🎓/🧑‍🏫 (quedan en ese navegador), lo superpuesto con 🧩 Superponer,
qué tableros están abiertos y la vista de la carta.

## Pruebas

- `node calcos/pruebas/autoguardado.mjs` — el motor con un reloj falso (14 casos).
- `node calcos/pruebas/e2e/autoguardado.cjs` — la Mesa real en Chromium con un SIDECEME de
  mentira (`e2e/servidor-falso.js`): guardar solo al mover una ficha, el clic, Ctrl+S, el
  servidor que falla y vuelve, y recargar con algo sin guardar. Capturas en
  `pruebas/salidas-guardado/`.
