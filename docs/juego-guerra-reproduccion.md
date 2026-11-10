# Reproducción visual: validación del navegador

Revisión del 9 de noviembre de 2026, sobre `main` en `1faa167`.

Al ocultar la pestaña después de solicitar un cuadro de animación, el navegador
podía suspender el `requestAnimationFrame` ya pendiente. El respaldo anterior sólo
se creaba si la pestaña ya estaba oculta al pedirlo, por lo que esa transición
podía dejar la reproducción esperando indefinidamente.

Ahora cada cuadro tiene un respaldo cancelable. El primer callback que llega
ejecuta el cuadro una sola vez y cancela el otro; un callback tardío no crea un
segundo lazo de animación. En primer plano se sigue usando el cuadro del navegador.

Las llamadas de `_wgInvoke` también liberan su temporizador al recibir respuesta
o error. Se conservan sus límites de 20 segundos y de 45 segundos para
`resolver_turno`, así como los controles de sesión y de monitoreo.

## Comprobaciones

- `node --test tests/wargame-reproduccion.test.cjs`: 14 pruebas pasan. Siete de
  ellas fallan al ejecutarlas contra el `index.html` anterior.
- `node tests/wargame-reproduccion.browser.cjs`: Chromium a 1440 y 390 píxeles;
  usa el renderizador real de proyectiles con una secuencia ficticia. Interrumpe
  un cuadro, entrega su callback tarde y comprueba que la animación termina,
  desaparecen sus elementos temporales y se libera el indicador de acción.
  También carga la aplicación completa sin sesión y con el cliente de API simulado.
- `node --test tests/soporte-ui.test.cjs`: 15 pruebas pasan.
- Los 10 bloques de script de `index.html` se analizan sin errores de sintaxis.

El laboratorio bloquea las conexiones externas y no ejecuta el motor del juego.
Las capturas se guardan en el directorio temporal `sideceme-reproduccion`; se puede
elegir otro mediante `SIDECEME_REPRO_SALIDA`. Playwright se puede localizar mediante
`NODE_PATH` o `SIDECEME_PLAYWRIGHT_MODULE`; para usar Chromium del sistema, definir
`SIDECEME_CHROMIUM` con su ruta.

## Estado del traspaso de teatro

Esta revisión no completa la Etapa B. Se verificó que `main` sigue en `1faa167`,
la pantalla indica `v2.9.480` y la función `wargame-ops` desplegada es la versión 71,
con un stub que importa el motor del commit `f542aeab47f670374c11687927575b25cc98b26a`.

El archivo completo de la carpeta `ENTREGA_JUEGO_GUERRA_TEATRO_MOTOR_2026-11-09`
no estaba entre los archivos recibidos; sólo se adjuntó el documento de traspaso.
No se pudo verificar el SHA-256 anunciado para esa entrega.

No se modifican el motor, las reglas, las importaciones, las tablas, los ejercicios
guardados ni el despliegue de Supabase. El marcador de versión se conserva para
evitar identificar estos arreglos de navegador como la entrega de teatro terminada.
