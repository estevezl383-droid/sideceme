# 💾 Autoguardado de la Mesa del EM — 10-10-2026

Actualización del 29/10/2026: **«Copias» ahora se llama «Guardar como»** y ofrece
primero guardar un archivo JSON. Se comprobaron las descargas con un perfil de
alumno, se corrigió el reintento tras un fallo de copia local y la renovación de
sesión del alumno desde la ventana de ingreso. Véase [Guardar como y pedidos de alumnos](../pedido/README.md)
para el funcionamiento actual, los límites y las pruebas. Lo siguiente conserva
el detalle de las revisiones anteriores.

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

## 🛟 Resguardo: la sesión que vence, las copias y tu carpeta (18-10-2026, `v1/resguardo.js`)

Lo pidió Sergio con la captura de 📁 Ejercicio de CE-VI.1 («⚠️ no se guardó · reintentar» y
«✕ Error»): «quisiera saber dónde se está guardando… que se guarden en una carpeta de documentos,
en la nube está bien pero también en una carpeta… en formato JSON»; y, al saber que se habían
perdido dos días de trabajo, «de aquí en adelante solucioná que no se joda».

### Qué pasó con CE-VI.1

En SIDECEME (tabla `calcos`) CE-VI.1 quedó guardado el **16-10-2026 a las 15:51** (hora de
Bolivia). La sesión de SIDECEME de esa computadora (tabla `sesiones`, la de la Mac; las demás eran
del iPhone) **venció el 16-10 a las 19:03** con la Mesa abierta. La Mesa lee la sesión una sola
vez, al abrir la página (`window.SIDECEME_CALCOS.token`, en `index.html`), así que desde ahí
`calco-ops` contestó **403 «Sesion no valida. Volvé a entrar.»** a cada guardado (los registros de
`calco-ops` del 18-10 muestran uno por minuto). Y la copia de seguridad del navegador
(`<nombre>__anterior`, del compilado) se escribe **sólo cuando el guardado en la nube sale bien** y
**se pisa al volver a abrir** el ejercicio: lo hecho en esos dos días quedó sólo en la pestaña.

### Qué hace ahora (sin tocar el compilado ni el servidor)

| | |
|---|---|
| 🔑 La sesión se renueva sola | Cada 20 s, al volver a la pestaña y cuando otra pestaña entra a SIDECEME (evento `storage`), `resguardo.js` vuelve a leer la sesión como `index.html` (profesores: `localStorage['sideceme_token_p']`; cursantes: `sessionStorage['sideceme_token']`; y su vencimiento). Si hay una nueva y vigente, se la da a la Mesa (`SIDECEME_CALCOS.token`, que la Mesa lee en cada guardado) y aprieta el sello «⚠️ no se guardó · reintentar». **No hace falta recargar.** |
| ⚠️ Aviso claro | Cuando la sesión venció —o `calco-ops` contesta «Sesion no valida»— una franja roja arriba: «la Mesa NO puede guardar en la nube · no cierres ni recargues esta pestaña · entrá a SIDECEME en otra pestaña», con **🔑 Entrar a SIDECEME** y **⬇️ Bajar el ejercicio ahora**. 15 min antes de vencer, una franja amarilla. Al renovarse, una verde. |
| 🖥️ Copias en esta computadora | Cada minuto (y al irse de la pestaña), si el ejercicio cambió, una copia en el IndexedDB `sid-resguardo` (las **8 más nuevas** de cada ejercicio, sin repetir). **No dependen de la nube** y abrir el ejercicio no las pisa. |
| 📁 Tu carpeta | En Chrome/Edge de computadora: «📁 Elegir carpeta» (por ejemplo Documentos › SIDECEME). Cada vez que cambia el ejercicio queda `<nombre>.json` y, uno por día, `respaldos/<nombre> AAAA-MM-DD.json`: el ejercicio entero, el mismo JSON que abre **📁 Ejercicio → 📂 Abrir archivo JSON** (entra como ejercicio nuevo). Después de cerrar el navegador, Chrome vuelve a pedir permiso: un toque en **🔓 Permitir** (franja amarilla). Safari, Firefox y el iPhone no lo permiten: ahí está «⬇️ Bajar». |
| ⬇️ Bajar ahora | `EJERCICIO_<nombre>_AAAA-MM-DD_HHMM.json` con lo que está en pantalla (cualquier navegador). |
| 🛟 Versión más nueva | Al abrir un ejercicio, si en esta computadora hay una copia más nueva que la de SIDECEME (con 1 min de margen, comparando con la hora que da `mis_calcos`), la franja lo dice y la deja bajar. |
| 💾 Copias | El botón al lado de 🎖️ Mesa · 🎓 Aprendizaje · 🧑‍🏫 Profesor abre el panel «Dónde se guarda»: ☁️ SIDECEME (último guardado, cuándo vence la sesión), 📁 tu carpeta, 🖥️ las copias de esta computadora (cada una con ⬇️) y «⬇️ Bajar el ejercicio ahora». Se pone rojo (⚠️) si no se puede guardar en la nube o la carpeta espera permiso. |

Lo que NO hace: no reemplaza a SIDECEME (lo que se comparte, se reparte y se califica sigue siendo
lo de la nube) y no restaura solo una copia: se baja y se abre con «📂 Abrir archivo JSON», como
ejercicio nuevo, para que nadie pise sin querer el ejercicio de la nube.

## Pruebas

- `node calcos/pruebas/resguardo.cjs` — la sesión (profesor, cursante, vencida), cuándo cambió el
  ejercicio, las 8 copias sin repetir, la más nueva que la nube, los nombres de los archivos y que
  «📂 Abrir archivo JSON» abre lo que se guarda como el ejercicio entero.
- `node calcos/pruebas/e2e/resguardo.cjs` — la Mesa real con un SIDECEME de mentira que rechaza la
  sesión vencida (403): vence con la Mesa abierta, la franja, el cambio en las copias, entrar en
  otra pestaña y la Mesa vuelve a guardar sola (sin recargar), la carpeta (la privada del navegador
  hace de Documentos/SIDECEME), «⬇️ Bajar», el aviso de la versión más nueva al recargar, y el
  teléfono. Capturas en `pruebas/salidas-resguardo/` (no se versionan).
- `node calcos/pruebas/autoguardado.mjs` — el motor con un reloj falso (14 casos).
- `node calcos/pruebas/e2e/autoguardado.cjs` — la Mesa real en Chromium con un SIDECEME de
  mentira (`e2e/servidor-falso.js`): guardar solo al mover una ficha, el clic, Ctrl+S, el
  servidor que falla y vuelve, y recargar con algo sin guardar. Capturas en
  `pruebas/salidas-guardado/`.
