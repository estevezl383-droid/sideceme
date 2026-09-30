# Ficha documental por instalación

El clic normal sobre una instalación abre un panel inferior independiente. El popup conserva la eliminación individual y agrega «ABRIR FICHA DOCUMENTAL». Durante el dibujo de EPA/EPE, el clic sigue agregando vértices y el doble clic termina el eje; no abre este panel.

El panel permite cambiar de instalación, consultar textos de los documentos ya adjuntos al ejercicio, agregar documentos mediante el lector existente, seleccionar fragmentos con sus referencias y escribir observaciones y preguntas de estudio. Genera un prompt de explicación y comparación documental, sin llamadas automáticas a IA. La respuesta se pega como JSON estructurado o, mediante elección explícita, texto libre. El contenido se muestra como texto seguro y pendiente de revisión; sólo el usuario puede marcarlo revisado.

El JSON conserva un ID de instalación y versión. Se rechazan errores de sintaxis, respuestas de otra instalación, tipos incompatibles y entradas demasiado grandes. No se interpretan campos desconocidos ni se ejecuta HTML. Los campos estructurados son resumen, funciones, organización, servicios, fuentes, datos faltantes, observaciones y preguntas de estudio.

## Fuentes revisadas para las síntesis incluidas

- `TEXTO BATALLÓN LOGÍSTICO.doc`: apartado I, A (misión) y B (organización). Se referencia el apartado, porque el DOC no proporciona una paginación estable tras convertirlo a texto.
- `RC-02-12 PROCEDIMIENTOS DE ESTADO MAYOR.pdf`: «Informaciones al comandante», G-4, páginas 20 y 21 del archivo PDF. Se incluyen las categorías de información, no los ejemplos operativos numéricos.

Las síntesis son contexto documental general; no acreditan medios ni funciones específicas de cada puesto. El prompt pide señalar las lagunas, atribuir las afirmaciones a fuentes identificadas y mantener las opiniones del cursante separadas de los hechos documentados. Los documentos del chat no se transfieren automáticamente al ejercicio. Se usa el lector actual de PDF/DOCX/TXT/MD; para DOC antiguos se pide una copia en DOCX o PDF.

## Persistencia e integración

Los datos viven en `unidad.fichaDocumental`, dentro de la lista de unidades que el ejercicio ya guarda y recupera. Se incorporan al estado tras 800 ms sin cambios, al guardar explícitamente o al cerrar/cambiar la ficha. No hay migración de base de datos ni modificaciones de otros campos del ejercicio. El texto del prompt se regenera a partir de la ficha actual; las respuestas y observaciones son independientes por instalación.

El módulo legible reside en `calcos/fichas-instalacion/v1/`. La integración en el compilado se reproduce con:

```sh
python calcos/pruebas/construir-ficha-documental.py
node --input-type=module --check < calcos/assets/index-ficha-documental-20260930.js
node calcos/pruebas/ficha-documental-modelo.js
PLAYWRIGHT_BROWSERS_PATH=/tmp/ejes-browsers PLAYWRIGHT_MODULE=/tmp/ejes-runtime/node_modules/playwright node calcos/pruebas/e2e/ficha-documental.js
PLAYWRIGHT_BROWSERS_PATH=/tmp/ejes-browsers PLAYWRIGHT_MODULE=/tmp/ejes-runtime/node_modules/playwright node calcos/pruebas/e2e/ejes-fichas.js
```

Las pruebas cubren validación, aislamiento de IDs, copia real al portapapeles, lectura de un adjunto, proyección estructurada/texto seguro, revisión manual, apertura mediante clic real en 2D y 3D, guardado y recuperación de ejercicio, y regresión de extremos/colores/cierre de EPA y EPE en ambas vistas.

El comprobador histórico `reemplazos-compilado.js` presenta fallos anteriores documentados en `EJES-FICHAS-2026-09-30.md`. Este cambio no modifica ni oculta esa validación.
