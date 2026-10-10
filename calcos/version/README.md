# 🔄 Aviso de versión nueva de la Mesa del EM

`aviso-version.js` — código aparte del compilado, cargado desde `calcos/index.html` **antes**
del compilado.

## Por qué

El 10-10-2026 el arreglo del pedido a la IA (`estado-mayor/v6/pedido.js`) se publicó a las
20:55, y a las 21:53 la Mesa de Sergio seguía armando el pedido viejo: la pestaña estaba abierta
desde antes y el navegador no vuelve a bajar el programa hasta que se recarga. Gemini contestó
otra vez «se cortó… indique cuál es el producto» y parecía que el arreglo no servía.

## Qué hace

- Al arrancar toma la foto de los `<script src>` de la página (con su `?v=`).
- Cada 5 minutos, y cada vez que se vuelve a la pestaña (como mucho una vez por minuto), baja
  `calcos/index.html` sin caché y compara sus `<script src>`.
- Si cambiaron, muestra arriba la franja «🔄 Hay una versión nueva de la Mesa…» con
  **Recargar ahora** (espera a que termine «💾 guardando…», el autoguardado de la Mesa) y
  **Más tarde** (la pospone 30 minutos).
- No hace nada en `file://` (la app de escritorio), sin red, o si lo que baja no tiene scripts
  (una página de error del servidor). No toca el ejercicio ni guarda nada.

## Para quien publique cambios

El aviso se entera cuando cambia algún `<script src>` del `index.html`: un compilado nuevo
(`assets/index-*.js`) o un `?v=` distinto. Si se cambia **sólo un módulo** (por ejemplo
`estado-mayor/v6/pedido.js`) sin tocar el `index.html`, las pestañas abiertas no se enteran:
subí el `?v=` del compilado en el `index.html` para que avisen.

## Prueba

`node pruebas/e2e/aviso-version.cjs` (la Mesa real en Chromium, escritorio y teléfono; capturas
en `pruebas/salidas-version/`): sin falso aviso con el mismo `index.html`, la franja con otro
compilado publicado, «Más tarde», una página de error que no cuenta y «Recargar ahora».
