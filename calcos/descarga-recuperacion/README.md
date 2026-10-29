# Descarga de una recuperación

Página independiente de Calcos para entregar un JSON recuperado mediante un
enlace. No abre ni modifica los ejercicios guardados en el navegador.

Los archivos `archivos/<id aleatorio de 128 bits>.bin` contienen exclusivamente
un IV de 12 bytes seguido del texto cifrado AES-256-GCM y su etiqueta. Se usa el
identificador del archivo como datos adicionales autenticados. Cada archivo se
cifra con una clave nueva de 256 bits y un IV aleatorio nuevo.

La clave se entrega únicamente en el fragmento del enlace privado:
`#v1.<identificador>.<clave base64url sin relleno>`. Los navegadores no incluyen
ese fragmento en las peticiones HTTP. No se deben guardar claves, enlaces
completos ni JSON originales en este repositorio. Quien tenga el enlace completo
puede descargar el archivo. Para retirar una descarga se elimina su `.bin`.

No hay servicios externos, telemetría ni acceso a localStorage, IndexedDB o la
base de ejercicios. La CSP sólo admite recursos del mismo origen. El JSON se
descifra y valida en memoria, y se descarga mediante un enlace a un Blob local.

Verificación en Chromium, incluidas descargas y claves incorrectas:

```sh
PLAYWRIGHT_MODULE=/ruta/a/playwright node calcos/pruebas/e2e/descarga-recuperacion.cjs
```
