# 🧩 Superponer — tablero de capas superpuestas

Código aparte del compilado. Dibuja archivos **encima** de la carta 2D y los activa/desactiva
desde un tablero (pestaña «🧩 SUPERPONER» del borde derecho, y botón dentro de 📁 Ejercicio,
debajo de «Integrar capa del Estado Mayor»). **No guarda nada en el ejercicio ni borra nada.**

- Integrar capa → mete la capa de un G dentro del ejercicio (reemplaza lo de ese G).
- Superponer → sólo la muestra encima; se apaga cuando se quiere.

Entiende: `sideceme-superposicion` (formato propio, ver `ejercicios/diamante/superposicion.json`),
`sideceme-areas-operaciones`, `capa-em`, `ejercicio.json` (toma fichas con lat/lng y áreas) y GeoJSON.

Tamaño de símbolos 100–200 % (150 % por defecto). Al ver todo el TO (zoom < 8) se achican solos y
los rótulos se ocultan, para no congestionar; al acercar vuelven. Ambas cosas se pueden cambiar.
Lo cargado se recuerda en el navegador (localStorage, con try/catch). Para quitarlo del todo:
borrar las dos líneas de `calcos/index.html` que lo cargan.
