# Motor de documentos de Estado Mayor — «📋 Mis hojas» del G-1 y del G-5 (y del EME cuando se sume)

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

## En la Mesa: 🏛️ G-5 AC/GM → 📋 Mis hojas (03-10-2026, `v3/campos/g5.js`)

Lo pidió Sergio con capturas del panel del G-5: la Apreciación de AC/GM y el Anexo «se
bajaban hechos». Se hizo con el skill `.claude/skills/habilitar-hojas-seccion/`.

| Hoja | Qué es ahora |
|---|---|
| **F1·P3 Apreciación de Situación de AC/GM** | Documento con la forma EXACTA del modelo de la Escuela (`aprec-acgm` del catálogo, 89 apartados, mismo orden y nivel): OBJETO, CARTA, ANEXOS; I.- MISIÓN; II.- SITUACIÓN Y CONSIDERACIONES DE AC/GM (inteligencia —CC.MM., terreno con sus efectos, POBLACIÓN con disponibilidad local, refugiados y evacuados, daños a la economía, gobierno civil, estado sanitario, abastecimientos—, situación enemiga, táctica, de personal, de AC, hipótesis); III.- ANÁLISIS **función por función** (unidades de AC, gobierno, economía política, instalaciones públicas, funciones especiales); IV.- COMPARACIÓN (problemas, cursos de acción de AC/GM, ventajas y desventajas de cada CAP); V.- CONCLUSIONES Y RECOMENDACIONES. En el Word, el cuadro de recursos clasificados y el de evacuación |
| **F2·P13** la misma, actualizada | Igual, con «📋 Partir de la F1·P3 (sin pisar)» |
| **F7·P1 Anexo de AC/GM** | La Escuela **no tiene modelo de anexo del G-5** en el catálogo: sale con la estructura del Anexo de AC/GM que ya bajaba la Mesa (`fNe`: Organización de la Tarea; I.- SITUACIÓN —fuerzas enemigas, fuerzas propias con la población, su actitud, autoridades y recursos, hipótesis—; II.- MISIÓN; III.- EJECUCIÓN —concepto de apoyo con la evacuación, los ejes humanitarios y las instalaciones; tareas a los equipos de Gobierno, Economía, SS.PP.EE. y Servicios Especiales; instrucciones de coordinación—; IV.- APOYO DE SERVICIO; V.- COMANDO Y COMUNICACIONES) y el **formato militar común** (membrete, OCA, letra del anexo y Orden, autenticación). Con los cuadros de recursos y de evacuación |
| F2·P3, F2·P5, F2·P6, F2·P8, **F2·P11**, F3·P1, F5·P1, F6·P3 | Las hojas de trabajo de siempre suman **📘 la guía del G-5** y **🌱 Traer del calco lo que falte**; su pedido a la IA lleva lo que calculó la Mesa para el G-5, lo que entregaron las otras secciones y la doctrina |

### Qué trae 🌱 (con las MISMAS cuentas del panel del G-5)

- **Población** (`mP`): habitantes y centros poblados, con el Censo 2024 o la referencia por
  tipo de lugar.
- **Recursos del área** (`rC`) con la **clasificación del G-5** (EXPLOTABLE / PROTEGIDO /
  NEGADO; si no la tocó, la sugerida): por categoría, con sus nombres; lo que se **descarga
  al G-4** (`SDe`); para cada función del análisis, lo que la Mesa identificó (tribunales,
  alcaldías, bancos, escuelas que son albergues, mercados, tanques de agua, radios,
  terminales, templos…).
- **Evacuación** (`fN`, con los valores del panel «🚸 Evacuación»): evacuados, agua,
  raciones, albergues (y cuántos faltan), viajes.
- **Ejes humanitarios** y cuántos km se **montan sobre el EPA** (a menos de 500 m); las
  **instalaciones de AC/GM** (PC, PRE, CCE, LDS, ayuda humanitaria) y los **bienes que no se
  baten**; los problemas que mide la Mesa.
- Las fichas, las fases del COA, la **Orden superior**, el CAE del G-2, las instalaciones de
  personal y el personal civil del G-1, el EPA/EPE, las instalaciones logísticas y la
  prioridad por fase del G-4; de las hojas del G-5, tareas, limitaciones, suposiciones,
  temas y ventajas y desventajas de cada CAP; el anexo toma la misión, las hipótesis y el
  mejor curso de acción de AC/GM de la apreciación.

### Qué es de la doctrina y qué es criterio de la Mesa (G-5)

- La forma de la Apreciación es la del modelo de la Escuela (la prueba lo comprueba
  apartado por apartado y nivel por nivel). El catálogo trae dos conclusiones como
  «Conclusión pendiente» con la instrucción aparte: quedan con rótulo descriptivo y la
  instrucción literal. El ANÁLISIS es por función porque así es el modelo («necesidades,
  disponibilidades, limitaciones y recomendaciones» es el criterio que ya usaba la Mesa).
- La forma del Anexo NO es un modelo de la Escuela: es la del anexo que ya bajaba la Mesa
  (así lo pidió Sergio). Si la Escuela da el modelo, hay que pasarlo al catálogo y al anexo.
- La doctrina citada: el modelo; la secuencia de planeamiento de AC/GM que ya usaba el
  panel del G-5 («el texto»: pasos 2 a 5, medios civiles primero, el eje humanitario fuera
  del EPA, bienes que no se baten); el DICA (IV Convenio de Ginebra, La Haya 1954,
  Protocolo I arts. 53, 54 y 56); el PMTD.
- Las referencias de planeamiento (20 L de agua y 1 ración por persona y día, 150 por
  albergue, 40 plazas por medio de transporte, 5.000 L por fuente explotable, 30 % y 3 días
  por defecto) son las del panel y son editables. Los 500 m para decir que un eje
  humanitario «se monta» sobre el EPA son criterio de la Mesa.

## Si la IA no contesta en JSON (03-10-2026, `v2/lector.js`)

Sergio pegó en la F2·P13 la respuesta de la IA y la Mesa dijo «No se encontró un JSON
válido»: la IA había escrito el DOCUMENTO (títulos en Markdown, «**A.- …**», listas
numeradas) en vez del bloque JSON. Ahora:

- **El pedido termina con «FORMATO DE TU RESPUESTA»** (lo último que lee la IA): sólo el
  bloque ```json, los saltos de línea como `\n`, qué hacer si no entra entero, y que si no
  puede contestar en JSON escriba el documento con los MISMOS títulos y numeración.
- **La Mesa lee la respuesta como venga**, en este orden: el JSON tal cual; el JSON
  **reparado** (saltos de línea crudos dentro de los textos, comas de más, comillas
  tipográficas); los **fragmentos** de un JSON cortado por el largo; y el **documento
  escrito**, que se reparte por los títulos del formato (en orden, así «Refuerzos.» de la
  situación propia no se confunde con el del mantenimiento del efectivo), los CAP y las
  fases por su número («CAP N° 1», «Fase I»), un «B.-» sin título por su lugar, y lo demás
  como texto del apartado (sin las negritas). El mensaje dice cómo se leyó, para revisar.
- **Las hojas de trabajo de siempre de TODAS las secciones** (el `dU` del compilado):
  antes de dar el error prueban el JSON reparado, la **tabla de Markdown** (renglones), las
  **dos listas** debajo de sus títulos y «**Casilla: texto**».
- El motor pasó a `v2/` (carpeta nueva para que el navegador baje los módulos nuevos);
  `v1/` queda para el compilado anterior.

## Cómo está hecho

```
estado-mayor/v3/   (la vigente; v2/ es la del compilado index-lector-20261003.js, v1/ la de index-personal)
  motor.js        el documento genérico: árbol del modelo, normalizar, 🌱 sin pisar, partir de,
                  revisión, texto, especificación del Word militar (numeración I.- A.- 1.- a.-,
                  CAP y fases, cuadros), HTML, pedido y respuesta de la IA
  registro.js     las secciones registradas (CAMPOS = { g1, g5 }) y los GANCHOS que llama el
                  compilado: uN (las hojas pasan a tipo «docEM»), esDocumento, tieneDocumento,
                  textoDocumento, guiaIA, pedidoHoja, sembrarHoja
  runtime.js      lo que presta la Mesa (React, hU, Qq, uU, Mx, Ni, Sc, iC, voe; y para el G-5 rC,
                  mP, fN, SDe, LU), el calco vivo y las capas cargadas (sincronizarExtraEM)
  editor.js       <EditorDocumento> y <AyudaHoja> (guía y 🌱 de las hojas de siempre)
  lector.js       lee la respuesta de la IA: JSON, JSON reparado, fragmentos, el documento
                  escrito por sus títulos; y en las hojas de siempre, tabla, listas y casillas
  campos/g1.js    TODO lo del G-1: los dos documentos (copian el catálogo), doctrina, lo que
                  sabe del calco, lo que trae 🌱, las guías y semillas de las hojas de trabajo
  campos/g5.js    TODO lo del G-5, con la misma forma
```

Se guarda con el ejercicio en `hojasG.g1`:

```js
aprecActiva / aprecOrientacion: { esquema: 'aprec-personal-v1', numero, campos: { objeto, cartas, anexos, tareasEsp, …, problemas }, caps: [{ id, nombre, valores: {}, fases: [{ nombre, valores: { mantenimiento, administracion } }], ventajas, desventajas }], ideas, firma, iaCampos }
anexo: { esquema: 'anexo-personal-v1', numero, campos: { objeto, carta, apendice, fuerzasPropias, …, comunicaciones }, ideas, firma, iaCampos }
```

y en `hojasG.g5`:

```js
aprecActiva / aprecOrientacion: { esquema: 'aprec-acgm-v1', numero, campos: { objeto, carta, anexos, tareasEsp, …, recomendaciones }, caps: [{ id, nombre, valores: {}, fases: [], ventajas, desventajas }], ideas, firma, iaCampos }
anexo: { esquema: 'anexo-acgm-v1', numero, campos: { objeto, carta, apendice, orgTarea, enemigo, fuerzasPropias, actitud, …, comunicaciones }, ideas, firma, iaCampos }
```

### Lo que sumó la v3 (para el G-5)

- Un apartado puede tener **texto propio y subapartados** (`{ id, t, hijos }`): el texto va
  debajo del título, antes de los subapartados (en el editor, el Word, la vista previa, el
  pedido y el lector).
- Si el documento **no analiza por CAP**, los CAP se nombran, se agregan y se quitan en la
  COMPARACIÓN (`{ ventajas: true }`), sin fases.
- `configurarEM` **suma** lo que recibe (el compilado lo llama dos veces);
  `sincronizarExtraEM({ capas })` pasa las capas cargadas; el contexto da
  `inventarioAC()`/`poblacionAC()` (una cuenta por juego de capas), `evacuacionAC`,
  `descargaAC` y `estadosAC`.
- `registroWord(doc, r)`: con `registro.militar`, un documento sin modelo dedicado sale con
  el formato militar común.
- El lector reconoce la instrucción del modelo repetida como título («2) Estimar el número
  de refugiados… del área. 3.780») y «- Ventajas: …» en viñeta debajo de cada CAP.
- `cfg.sinNadaHoja`: el aviso del 🌱 de las hojas de trabajo de cada sección.

### Para sumar otra sección (G-5, EME…)

Escribir `campos/<g>.js` con la forma de `campos/g1.js` (o `g5.js`) y agregarla a `CAMPOS`
en `registro.js` (en una carpeta de versión nueva, `v4/`, copia de `v3/`). Los ganchos del compilado son genéricos: **no hace falta otro compilado**
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
node estado-mayor.cjs           # forma vs catálogo, motor, G-1 con la cuenta REAL de bajas, IA, lector, hojas, reemplazos
node estado-mayor-g5.cjs        # lo mismo del G-5, con las cuentas REALES del panel del G-5 (rC, mP, fN, SDe) y el anexo fNe
node e2e/personal.cjs           # la Mesa real en Chromium, escritorio y teléfono (también con la respuesta escrita, no JSON)
node e2e/g5.cjs                 # ídem G-5: las capas puestas en el estado de la Mesa llegan al panel y al motor
node construir-estado-mayor.js  # arma index-personal-20261003.js (y comprueba que es reversible)
node construir-lector.js        # arma index-lector-20261003.js encima
node construir-g5.js            # arma index-g5-20261003.js encima (el vigente)
```

`personal-ejemplo.js` tiene un ejercicio FICTICIO (División en la ofensiva, tres fases) y
respuestas de IA de ejemplo; `respuesta-prosa-personal.md`, una respuesta escrita como
documento (como la que mostró Sergio). `g5-ejemplo.js` (capas de población e
infraestructura, clasificación, evacuación, un eje humanitario que se monta sobre el EPA) y
`respuesta-prosa-g5.md`, lo mismo para el G-5. Las capturas y los Word de la prueba quedan
en `pruebas/salidas-personal/` y `pruebas/salidas-g5/` (no se versionan).
