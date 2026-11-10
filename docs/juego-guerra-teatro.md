# Juego ficticio a escala teatro · v2.9.482

Esta modalidad utiliza bandos, fichas y parámetros abstractos de videojuego. Sus
resultados describen lo que ocurre dentro del juego; no son predicciones ni una
validación de capacidades militares reales.

## Uso

1. Crear o abrir una partida como árbitro.
2. En **Cargar escenario**, importar el JSON del ejercicio. Se reconoce teatro
   por `escala: "teatro"`, `resultados.picbTeatro`, la unidad FF.TT.T.O. o las áreas
   de teatro/subteatro. Los archivos de distintas escalas se importan en partidas
   separadas.
3. Iniciar la partida. La barra indica **TEATRO · FICCIÓN**, el reloj muestra días
   de juego y ofrece cuatro velocidades. El valor inicial es un día por dos
   minutos reales.
4. Seleccionar una ficha y marcar un destino. La ruta se muestra antes de enviarla.
   **LANZAR** envía ese movimiento y **PLAY** hace correr el reloj; **PAUSA** lo
   detiene para todos.
5. Consultar los puntos, las reservas de cada ficha y los eventos de la bitácora.
   Los encuentros utilizan la reproducción visual existente y terminan.

Las fichas pequeñas y las instalaciones del modo anterior no se convierten en
fichas de esta modalidad. El panel muestra puntos y reservas de juego; no utiliza
el catálogo de sistemas de armas, drones ni convoyes automáticos.

### Movimiento y polvo · v2.9.482

El temporizador del refresco «en vivo» utiliza una propiedad distinta de la cola
de marcha. Activarlo, rearmarlo o apagarlo ya no borra los recorridos que están
animando las fichas. El panel de movimientos indica **esperando PLAY** cuando el
reloj está en pausa y ofrece PLAY a quien puede manejarlo.

El polvo distingue brigadas, divisiones y cuerpos de ejército en 2D y 3D. Los
cuerpos generan tres bocanadas por emisión, de mayor tamaño y duración, repartidas
a lo ancho y detrás de la ficha. Se limita a 160 partículas simultáneas y se
limpia al terminar el recorrido. Las unidades a pie no generan este efecto.

La corrección sólo cambia la pantalla: publicar `index.html`; el motor y las
partidas guardadas conservan su versión. La validación incluye el avance de los
marcadores reales con sondeo activo en escritorio y móvil y cuatro cuerpos
simultáneos en el laboratorio.

## Compatibilidad y persistencia

La escala vive en el JSON del reloj de cada partida. Sólo una importación de
reemplazo con `limpiar: true` puede establecerla; agregar una capa conserva la
escala. Reemplazar el escenario por uno del modo anterior elimina la marca.
No se necesitan migraciones ni tablas nuevas.

`resolverTurno`, el motor anterior, conserva exactamente su código. Las partidas
sin la marca de teatro siguen utilizándolo. El nuevo bloque conserva los
parámetros de juego aportados por el usuario y añade la integración técnica,
persistencia, reloj y presentación.

El navegador calcula los caminos y limita su envío a 60 puntos. La red vial
completa permanece fuera de la función del servidor. Si no hay cobertura para
un recorrido, la vista lo identifica como ruta libre del juego y no aplica la
marca de carretera. La carta incorporada tiene cobertura geográfica limitada;
las áreas y posiciones del ejercicio siguen siendo las que importa el usuario.

## Validación

- 19 pruebas nuevas: 11 del motor/función real con tablas en memoria y ocho del
  importador, rutas y reloj de la pantalla.
- 14 pruebas del ciclo de vida de animaciones y llamadas.
- Chromium en escritorio y móvil con la pantalla real, el motor real y datos
  totalmente inventados: importación, ruta previa, lanzamiento, PLAY, encuentro
  visible y PAUSA. Se bloquean las conexiones a servicios externos.
- Comparación de la suite anterior: 80 pruebas, 74 pasan y seis ya fallaban en
  `b7c1085`. Con la integración y las once pruebas nuevas del motor:
  91 pruebas, 85 pasan y fallan las mismas seis. Pertenecen a
  `wargame-motor-medios` y `wargame-realismo`; no se cambian sus reglas en esta
  entrega.
- SHA-256 del código de `resolverTurno`, idéntico antes y después:
  `5737bb873606514ea821951b44fb335520df5d4835f178cad86c85dcca3f8359`.

## Laboratorio local

Instalar herramientas de prueba en una carpeta temporal, con versiones fijas:

```sh
npm install --prefix /tmp/pruebas-teatro --save-exact typescript@5.9.3 playwright@1.51.1 leaflet@1.9.4
NODE_PATH=/tmp/pruebas-teatro/node_modules node tests/helpers/wargame-teatro-servidor.cjs
```

Abrir `http://127.0.0.1:4173/`. El JSON inventado está en
`http://127.0.0.1:4173/__lab/ejercicio.json`. El laboratorio sólo guarda datos en
memoria y no utiliza credenciales ni partidas de Supabase.
Después de importar, iniciar y pulsar PLAY, el botón **AVANZAR PASO** de la barra
del laboratorio ejecuta el siguiente paso del reloj. Así se puede examinar la
secuencia sin depender del tiempo real.

La prueba automatizada se ejecuta con
`node tests/wargame-teatro.browser.cjs`. Usa las mismas herramientas, permite
seleccionar Chromium mediante `SIDECEME_CHROMIUM` y guarda capturas en el
directorio indicado por `SIDECEME_REPRO_SALIDA`.

## Publicación y recuperación

Publicar primero el motor en un commit inmutable y desplegar el stub de
`wargame-ops` apuntando a ese commit; después publicar la pantalla y el módulo.
Se conserva `verify_jwt: false` porque la función ya autentica las sesiones y
claves de bando por su cuenta.

La función anterior es la versión 71, cuyo stub importa el commit
`f542aeab47f670374c11687927575b25cc98b26a`. La pantalla anterior con los arreglos
de reproducción está en `b7c108553edd39ceb229548fbf5e69eddc834c45`.
