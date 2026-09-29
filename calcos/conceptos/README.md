# Hoja F2·P1 — Conceptos entrelazados

Hoja de trabajo **gráfica** del PMTD 2017 (RO-01-02-06): el formato de la pág. 20 y
el ejemplo de las págs. 21 y 22. Ubica a la unidad VERTICAL (los escalones de arriba)
y HORIZONTALMENTE (maniobra, apoyo de combate y apoyo de servicio de combate), con
la tarea (T) y el propósito (P) de cada unidad, por fase.

La versión vigente está en **`v3/`**. Las carpetas `v2/` y la raíz (`modelo.js`,
`editor.js`, `word.js`, `runtime.js`) son las versiones anteriores y se dejan intactas:
las usan los compilados anteriores (`index-6Gm5UQ97.js`, `index-nQKdqwIj.js`), así que
un navegador que tenga uno en caché sigue funcionando y volver atrás es cambiar una
línea de `calcos/index.html`.

## La jerarquía (v3)

Arriba va la **cadena de mando**, una caja por escalón, de arriba hacia abajo, con la
magnitud de cada escalón (como lo indicó el docente):

| Escalón | Magnitud | En el cuadro |
|---|---|---|
| CTO — Comando del Teatro de Operaciones | XXXXX | «CTO» |
| FF.TT.T.O. — Comando de las Fuerzas Terrestres del TO | XXXX | «FF.TT.T.O.» |
| CE — Cuerpo de Ejército | XXX | «CE» |
| División | XX | el símbolo de su arma |
| Regimiento · Batallón · Compañía / Escuadrón / Batería | III · II · I | el símbolo de su arma |

La magnitud sale del nombre cuando el nombre lo dice sin dudas («Cuerpo de Ejército I»
nunca sale con XX; «Fuerzas Terrestres del TO» es XXXX, no el TO). DEBAJO de la unidad
propia (la última caja de la cadena) van las filas de maniobra, apoyo de combate y SPAC.

## Qué hace (v3)

En el Tablero del G-3 → 📄 Documentos → «Analizar la misión» → F2·P1:

0. **¿Con qué unidades?** (lo elige el oficial; con la hoja vacía, tocar la opción la arma):
   - 🪖 *Unidades puras (orgánicas)*: las unidades que dependen DIRECTAMENTE de la unidad
     propia, como están en la **organización de la tarea de la orden** (cada columna del
     cuadro es una unidad; sus escuadrones, compañías, baterías y secciones no se dibujan;
     la columna «BAJO CONTROL» va con esa marca). La organización se lee de la Orden del
     escalón superior («Organización de la tarea») o de un documento aportado. Si no está,
     salen las fichas del calco.
   - 🧩 *FT / agrupaciones tácticas*: las de 🧩 Organización de la tarea, con su OD / OC /
     RES / SOST, su tarea táctica y su propósito; y las unidades orgánicas que no entraron
     en ninguna FT (con «(-)» si dieron parte de sus elementos; si dieron todo, no van).
   - ↔️ *Mi unidad entre las adyacentes*: la cadena hasta el CE y, en la fila, la unidad
     propia con las del mismo escalón que nombra la orden («fuerzas amigas»).
1. **La unidad propia** sale de la Orden («Unidad»); si está vacía, de la misión («La
   DIVMEC-1 defiende…») o del OBJETO de una orden aportada. Si no aparece, la pantalla
   la pide. **La cadena de mando**: hasta tres escalones por encima (para una División:
   CTO, FF.TT.T.O. y CE); el inmediato superior sale de «Escalón superior» y la tarea y el
   propósito de cada comando, de su frase en «fuerzas amigas».
2. **🤖 Trabajar esta hoja con IA**: el pedido lleva el expediente, la doctrina, **la
   jerarquía con sus magnitudes**, la opción elegida, **lo que ya identificó la Mesa**
   (unidad propia, cadena, las 12 unidades de la organización o las FT con su composición,
   las adyacentes), qué hacer si el expediente nombra **otras divisiones** (son
   adyacentes: nunca debajo de la propia), **cómo se identifican las relaciones directas e
   indirectas** y una verificación final. Al aplicar la respuesta, la Mesa **pone cada
   unidad en su escalón** aunque la IA se equivoque (la División que quedó en la fila sube
   a la cadena, un escalón repetido se junta, otra división sale de las filas) y avisa qué
   corrigió.
3. **🧹 Acomodar cada unidad en su escalón**: aparece si la hoja guardada tiene unidades
   fuera de su escalón (por ejemplo una hoja v2 con la «Unidad sin nombre» y la DIV.MEC.-1
   en la fila).
4. **👁️ Ver la hoja · 📄 Word · 🖨️ Imprimir** y **✏️ Corregir a mano** como antes; la
   cadena de mando admite los escalones que hagan falta.

Todo se guarda con el ejercicio en `g3.entrelazados` (esquema `conceptos-v3`, `enfoque`
= `puras` | `ft` | `adyacentes`). Las hojas v2 (`superior2`/`superior1`, `enfoque`
`subordinadas`) y v1 se leen igual.

## Archivos (`v3/`)

- `modelo.js` — esquema, jerarquía, lectura de designaciones (RCB, RIM, RIAT, RAM, RAA,
  BATING, BAT. LOG., COMP. ICIA…), organización de la tarea, armado con las tres opciones,
  `acomodarJerarquia`, texto para el expediente. Sin DOM.
- `laminas.js` — las láminas SVG: la cadena de mando (hasta cinco escalones), la fila
  debajo de la unidad propia con flechas que no se cruzan, apoyo de combate, SPAC y
  continuaciones. Sin DOM.
- `ia.js` — el pedido a la IA y la aplicación de su respuesta (JSON). Sin DOM.
- `editor.js`, `word.js`, `runtime.js` — la pantalla, el Word y lo que presta el compilado.

Si se cambian estos módulos, conviene publicarlos en una carpeta nueva y apuntar el
compilado ahí, por la caché (así se hizo `v2/` y `v3/`).

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
FICTICIAS y una respuesta de IA de ejemplo; `conceptos-divmec.js` tiene la forma del
caso del docente (cadena CTO → FF.TT.T.O. → I CE → DIVMEC-1, la organización de la tarea
de la orden con 11 unidades y una BAJO CONTROL, tres FT, otra división adyacente) con
nombres ficticios, y una respuesta de IA que se equivoca como la del Word de la v2. Las capturas y los Word de las pruebas
quedan en `pruebas/salidas-conceptos/` (no se versionan).
