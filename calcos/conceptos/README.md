# Hoja F2·P1 — Conceptos entrelazados

Hoja de trabajo **gráfica** del PMTD 2017 (RO-01-02-06): el formato de la pág. 20 y
el ejemplo de las págs. 21 y 22. Ubica a la unidad VERTICAL (los escalones de arriba)
y HORIZONTALMENTE (maniobra, apoyo de combate y apoyo de servicio de combate), con
la tarea (T) y el propósito (P) de cada unidad, por fase.

La versión vigente está en **`v2/`**. Los archivos de esta carpeta (`modelo.js`,
`editor.js`, `word.js`, `runtime.js`) son los de la versión anterior y se dejan
intactos: los usa el compilado anterior (`index-nQKdqwIj.js`), así que un navegador
que lo tenga en caché sigue funcionando y volver atrás es cambiar una línea de
`calcos/index.html`.

## Qué hace (v2)

En el Tablero del G-3 → 📄 Documentos → «Analizar la misión» → F2·P1:

0. **Nivel de la hoja** (lo elige el oficial):
   - *Mi unidad y mis unidades subordinadas* (como el ejemplo del PMTD): arriba el
     comando superior, debajo la unidad propia, en la fila sus unidades de maniobra
     con OD / OC; después su apoyo de combate y su SPAC.
   - *Mi unidad entre las adyacentes* (análisis de la orden superior): dos escalones
     arriba, el superior inmediato y, en la fila, la unidad propia al centro con las
     adyacentes.
1. **🌱 La aplicación arma la hoja** con lo que ya tiene el ejercicio: la orden del
   escalón superior (escalón superior, unidad, misión, fuerzas propias, intención),
   la reexpresión de la misión (F2·P12), la 🧩 Organización de la tarea (OD / OC,
   tarea táctica y propósito de cada FT o agrupación), las fichas propias del calco
   (maniobra, apoyo, SPAC; el enemigo no entra; una unidad que dio parte de sus
   elementos va con «(-)») y las fases del COA propio. Pone las relaciones por
   defecto (la OD a la unidad propia, las OC a la OD, el apoyo a la OD…). «Traer lo
   que falte» no pisa nada de lo escrito; «Rearmar todo» sí.
2. **🤖 Trabajar esta hoja con IA**, como en las demás hojas: *Armar / sólo
   completar* o *Completar y mejorar*. El pedido lleva el expediente completo del
   ejercicio (incluidos los documentos aportados por el oficial), la doctrina de la
   hoja con el ejemplo del PMTD, el nivel elegido y lo que ya hay escrito. Además:
   - **tu idea para esta hoja** — va al final del pedido, donde más pesa;
   - **orientaciones o información** propias de esta hoja: texto libre y archivos
     `.docx`, `.txt` o `.md` adjuntos (el PDF va por «Documentos aportados»).
   Se copia (o se abre Claude / ChatGPT / Gemini), se pega la respuesta y **✓ Aplicar**
   la vuelca en la hoja: unidades, fases, T y P por fase, esfuerzo principal, fuegos
   (TAREA, PROPÓSITO, PAF, EFECTO), ingeniería (PE, PT), SPAC y relaciones.
3. **👁️ Ver la hoja · 📄 Word · 🖨️ Imprimir**: las láminas con la forma del ejemplo del
   PMTD. El Word lleva una lámina por hoja carta apaisada (imagen de ~290 ppp).
4. **✏️ Corregir a mano**: fases, cada unidad (denominación, magnitud, arma/símbolo,
   rótulo, número, rol, unidad propia, T y P general o por fase) y las relaciones.

Todo se guarda con el ejercicio en `g3.entrelazados` (esquema `conceptos-v2`). La
hoja de la versión anterior (`conceptos-v1`) y el texto narrativo de antes se leen
igual: el narrativo queda guardado, se muestra aparte y se le pasa a la IA.

## Archivos (`v2/`)

- `modelo.js` — esquema, lectura de lo guardado, armado automático y texto para el
  expediente. Sin DOM.
- `laminas.js` — las láminas SVG: maniobra (relación vertical y horizontal), apoyo de
  combate, SPAC y continuaciones (si un texto no entra, sigue en otra hoja: no se
  corta nada). Sin DOM.
- `ia.js` — el pedido a la IA y la lectura de su respuesta (JSON). Sin DOM.
- `editor.js` — la pantalla (JavaScript sin compilar; React llega por `runtime.js`).
- `word.js` — el Word.
- `runtime.js` — React, los constructores de Word, el encabezado de los pedidos a la
  IA y el corrector de terminología de la Mesa, que el compilado le presta antes del
  primer render.

Si se cambian estos módulos, conviene publicarlos en una carpeta nueva (o con otro
nombre) y apuntar el compilado ahí, por la misma razón que se hizo `v2/`: la caché.

## Pruebas

```bash
cd calcos/pruebas && npm ci
node conceptos.cjs                  # modelo, láminas, IA (sin navegador)
node reemplazos-compilado.js        # la cadena de compilados es reversible
node e2e/conceptos.cjs              # la hoja en la Mesa real, escritorio y teléfono
python3 word-conceptos.py           # estructura de los Word que bajó la prueba
```

`conceptos-ejemplo-pmtd.js` transcribe el ejemplo del PMTD (págs. 21-22) como datos
de la hoja; `conceptos-ejercicio.js` es un ejercicio de División con unidades
FICTICIAS y una respuesta de IA de ejemplo. Las capturas y los Word de las pruebas
quedan en `pruebas/salidas-conceptos/` (no se versionan).
