# Motor de documentos de Estado Mayor — «📋 Mis hojas» del G-1 (y del G-5, EME… cuando se sumen)

Lo pidió Sergio el 03-10-2026 con capturas del panel del G-1: la **F1·P3 Apreciación Activa
de PERSONAL** sólo decía «se baja desde el botón de Apreciación» y el Word salía con casi
todo «[…]». Quería que TODOS los documentos del G-1 se trabajen como los del G-2 y el G-3:
📘 la guía «¿Para qué es y cómo se llena?», 🌱 traer del calco lo que falte, 🤖 la IA que
analiza TODOS los documentos adjuntados al ejercicio y los análisis de los calcos hasta donde
se llegó, con los reglamentos, y el Word de la hoja y el Word con el formato militar — cada
documento con SU formato. Y que quede repetible para el G-5 (hay un skill:
`.claude/skills/habilitar-hojas-seccion/`).

## En la Mesa: 👥 G-1 Personal → 📋 Mis hojas

| Hoja | Qué es ahora |
|---|---|
| **F1·P3 Apreciación de Situación de Personal** | Documento con la forma EXACTA del modelo de la Escuela (`aprec-personal` del catálogo): OBJETO, CARTAS, ANEXOS; I.- MISIÓN (tareas específicas/implícitas/esenciales, recursos, limitaciones, misión de personal); II.- SITUACIÓN Y CONSIDERACIONES DE PERSONAL (inteligencia, propia, logística, AC, hipótesis, situación de personal con sus 15 subapartados); III.- ANÁLISIS (cada CAP, **fase por fase**: mantenimiento del efectivo y administración de personal); IV.- COMPARACIÓN; V.- CONCLUSIONES Y RECOMENDACIONES |
| **F2·P13** la misma, actualizada | Igual, con «📋 Partir de la F1·P3 (sin pisar)» |
| **F7·P1 Anexo de Personal** | Forma del modelo de **Plan de Personal** (`plan-personal`): OBJETO, CARTA, APÉNDICE; I.- SITUACIÓN; II.- MISIÓN; III.- EJECUCIÓN (concepto de apoyo); IV.- APOYO DE PERSONAL (con el **cuadro de bajas por fase** en el Word); V.- COMANDO Y COMUNICACIONES. Es un ANEXO: el cuadro de revisión pide su letra y la Orden |
| F2·P3, F2·P5, F2·P6, F2·P8, F3·P1, F5·P1, F6·P3 | Las hojas de trabajo de siempre (con su IA, Vista previa y Word) suman **📘 la guía del G-1** y **🌱 Traer del calco lo que falte**; su pedido a la IA lleva además lo que calculó la Mesa para el G-1, lo que entregaron las otras secciones y la doctrina |

En cada documento: 📘 guía · 🔎 lo que ya entregaron las otras secciones (la Orden superior,
el G-2, el G-4, el G-5) · 🌱 traer del calco y de las hojas (sin pisar) · 💡 mis ideas ·
🤖 IA (Sólo completar / Completar y mejorar; lo suyo queda marcado «🤖 revisar») ·
🗺️ lo que toma del calco y lo que le falta (con «Trazar la Línea de Extraviados / la ruta de
PP.GG.») · el documento apartado por apartado con su numeración · 👁️ vista previa (el Word
real) · 📄 Word (formato militar) · revisión de lo que falta.

### Qué trae 🌱 (del calco y de las hojas)

- **Bajas por fase** con la MISMA cuenta del panel «📊 Bajas» (los nueve factores del
  ECEM 15-08; la función `iC` de la Mesa): total, de combate, fuera de combate, a evacuar,
  reemplazos, muertos y desaparecidos; el aviso si pasan el 20 % del efectivo. En la
  apreciación van al análisis fase por fase del CAP en estudio (el primero); en el anexo, al
  cuadro de «Efectivos».
- **PP.GG.**: la cadena (PPGG → DPG → CRPG → CCPG) colocada en el calco y la ruta trazada
  (por el EPE), quién los maneja y el trato (Ginebra).
- **Ley y orden y moral**: la Línea de Extraviados, el PCE y las demás instalaciones, los
  servicios de personal, el PRM y las sepulturas; el aviso si el Área de Descanso está a
  menos de 2 km del PRM.
- Las **fichas** propias y enemigas, las **fases del COA**, la **Orden superior** (misión,
  tareas, limitaciones, carta, PC), el **CAE del G-2**, la **sanidad y el EPE** del G-4 y la
  **evacuación de civiles** del G-5.
- De las hojas del G-1: tareas (F2·P3), limitaciones (F2·P5), suposiciones (F2·P6), las
  ventajas, desventajas y si se puede apoyar cada CAP (F5·P1); el anexo toma la misión y las
  hipótesis de la apreciación.

### Qué lleva el pedido a la IA

El encabezado de la Mesa, el **EXPEDIENTE COMPLETO** (la Orden, los **documentos aportados
por el oficial** con su texto, el calco, el CMOC, la PICB del G-2, los documentos del G-3 y
las hojas de todas las secciones), lo que **calculó la Mesa** para el G-1, lo que
**entregaron las otras secciones**, las **otras hojas del G-1**, la **doctrina** (ECEM 15-08 y
los modelos de la Escuela), **el formato del documento** (cada apartado con su numeración, la
instrucción del modelo y la clave del JSON), el documento como está, **las ideas del
oficial** (al final, donde más pesa), la tarea, cómo contestar y la verificación final.

## Cómo está hecho

```
estado-mayor/v1/
  motor.js        el documento genérico: árbol del modelo, normalizar, 🌱 sin pisar, partir de,
                  revisión, texto, especificación del Word militar (numeración I.- A.- 1.- a.-,
                  CAP y fases, cuadros), HTML, pedido y respuesta de la IA
  registro.js     las secciones registradas (CAMPOS = { g1 }) y los GANCHOS que llama el
                  compilado: uN (las hojas pasan a tipo «docEM»), esDocumento, tieneDocumento,
                  textoDocumento, guiaIA, pedidoHoja, sembrarHoja
  runtime.js      lo que presta la Mesa (React, hU, Qq, uU, Mx, Ni, Sc, iC, voe) y el calco vivo
  editor.js       <EditorDocumento> y <AyudaHoja> (guía y 🌱 de las hojas de siempre)
  campos/g1.js    TODO lo del G-1: los dos documentos (copian el catálogo), doctrina, lo que
                  sabe del calco, lo que trae 🌱, las guías y semillas de las hojas de trabajo
```

Se guarda con el ejercicio en `hojasG.g1`:

```js
aprecActiva / aprecOrientacion: { esquema: 'aprec-personal-v1', numero, campos: { objeto, cartas, anexos, tareasEsp, …, problemas }, caps: [{ id, nombre, valores: {}, fases: [{ nombre, valores: { mantenimiento, administracion } }], ventajas, desventajas }], ideas, firma, iaCampos }
anexo: { esquema: 'anexo-personal-v1', numero, campos: { objeto, carta, apendice, fuerzasPropias, …, comunicaciones }, ideas, firma, iaCampos }
```

### Para sumar otra sección (G-5, EME…)

Escribir `campos/<g>.js` con la forma de `campos/g1.js` y agregarla a `CAMPOS` en
`registro.js`. Los ganchos del compilado son genéricos: **no hace falta otro compilado**
salvo para versionar la carpeta (ver el skill `.claude/skills/habilitar-hojas-seccion/`).

## Qué es de la doctrina y qué es criterio de la Mesa

- La forma de los documentos es la de los modelos de la Escuela del catálogo del formato
  militar (la prueba lo comprueba apartado por apartado). En COMPARACIÓN y CONCLUSIONES el
  modelo trae INSTRUCCIONES: quedan con un rótulo descriptivo y la instrucción literal como
  ayuda del apartado (como en el resto del formato militar).
- En el Anexo, el modelo del catálogo pone «Reemplazos.» directamente debajo de IV.- APOYO DE
  PERSONAL (le falta el subtítulo de nivel 2): se usa «A.- Mantenimiento de efectivos. 1.-
  Efectivos. 2.- Reemplazos. 3.- Partes e informes.», como el Anexo de Personal que ya bajaba
  la Mesa y como la apreciación.
- Las cifras de bajas son las del panel (referencias de planeamiento editables del ECEM
  15-08); el umbral del 20 % y la distancia Área de Descanso–PRM son los que ya usaba la Mesa.
- Las bajas del panel se aprecian para UN curso de acción (el que se estudia): 🌱 las pone en
  el CAP N° 1; los demás CAP los analiza el oficial o la IA.

## Pruebas

```bash
cd calcos/pruebas
node estado-mayor.cjs           # forma vs catálogo, motor, G-1 con la cuenta REAL de bajas, IA, hojas, reemplazos
node e2e/personal.cjs           # la Mesa real en Chromium, escritorio y teléfono
node construir-estado-mayor.js  # vuelve a armar el compilado (y comprueba que es reversible)
```

`personal-ejemplo.js` tiene un ejercicio FICTICIO (División en la ofensiva, tres fases) y
respuestas de IA de ejemplo. Las capturas y los Word de la prueba quedan en
`pruebas/salidas-personal/` (no se versionan).
