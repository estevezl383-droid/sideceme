# Formato militar — Calcos

Implementación del paquete de Sergio Morales (30-SEP-2026). Base de integración `a8d8ceddc6a17d57313ee2de6b17ce5280a3666d`. No se modifican datos tácticos al exportar. Código legible v1 separado del compilado; el original permanece disponible.

## Uso

Desde la hoja, pulse **Word (formato militar)**. Los documentos principales se descargan directamente con los campos vigentes y el modelo seleccionado, sin repetir el análisis de IA ni copiar otra respuesta. El título y número se toman del documento actual. Para un documento subordinado sin vínculo, el formulario solicita identificar el padre del mismo ejercicio/unidad. La revisión explícita (`revisar: true`) permite ajustar formato y metadatos, sin una segunda IA. La revisión explícita de formato y el DOCX usan el mismo generador. Las previsualizaciones ordinarias existentes siguen siendo genéricas.

El correlativo se guarda en `ops.documentosMilitares`, junto al ejercicio, por ejercicio y unidad considerada. La identidad incluye G, hoja, fase/paso, modelo y nivel. Reexportar conserva el correlativo y los campos revisados. Exportar no equivale a expedir una orden. Se mantiene el guardado existente del ejercicio; no se introduce un contador global de servidor ni una numeración concurrente entre copias independientes del ejercicio. Para conservarlo al trasladar el ejercicio, guarde/exporte el ejercicio después de generar sus documentos.

## Formatos propios y recuperación integrada

La descarga usa el formato militar sólo para órdenes, preparatorias, guía inicial, apreciaciones, planes y anexos identificados. Línea inicial/actualizada de tiempo, programa general de planeamiento, matrices, conceptos entrelazados, misión reexpresada y cálculos auxiliares conservan sus productores y su formato propio. `SIDHojaWord` restaura literalmente el descargador nativo anterior; `Mx` decide por el registro explícito, sin convertir toda salida Word en plantilla militar. Los conceptos siguen usando su módulo independiente.

Antes de generar el Word, `v1/contexto.js` recupera datos del estado vigente: identidad confirmada, membrete del documento cargado, localidad más cercana al PC propio ya colocado (con su fuente de poblaciones), línea de tiempo compartida/actualizada y nombre del usuario activo de SIDECEME. La fecha específica registrada para el documento tiene prioridad; si sólo existe la recepción de la orden, se muestra como **referencia inicial del ejercicio**, con su origen visible. No se usa el reloj del dispositivo para completar ese campo. Un dato ausente de iniciales utiliza **XYZ**; las del elaborador corresponden al usuario actual cuando existe sesión.

El diálogo identifica el origen de cada campo, conserva correcciones manuales y oculta los campos de anexos mientras el documento sea principal. Los valores recuperados automáticamente se actualizan al cambiar sus fuentes; las correcciones manuales permanecen. La recuperación no escribe en las hojas, la línea de tiempo, las unidades ni las capas. La exportación recibe el estado vigente del ejercicio, incluidas las hojas y matrices ya trabajadas, datos de capas y resultados de los análisis.

## Contenido y análisis de la hoja

El análisis se realiza mediante **Trabajar esta hoja con IA**, en la hoja original. La exportación lee el contenido que ya está ahí; no vuelve a llamar al expediente ni genera otro prompt. Las tres preparatorias conservan íntegramente la estructura de campos del productor existente `f3e`, con objeto, carta, anexos, organización, situación, misión, ejecución, apoyo y comunicaciones; no se agregan subdivisiones vacías debajo de campos ya llenos. Las abreviaturas y apartados opcionales se asignan al modelo. Si un contenido no tiene equivalencia, la descarga conserva la estructura propia de la hoja, sin eliminarlo ni pedir un análisis nuevo.

Los borradores antiguos guardados en `ops.documentosMilitares` permanecen disponibles. Al exportar, un texto antiguo añadido por la IA del diálogo no duplica ni sustituye el contenido vigente de la hoja en el mismo apartado. No se modifican los datos del ejercicio ni se crea una segunda hoja.

## Asociación explícita

| Ruta existente | Modelo | Nivel / origen |
|---|---|---|
| G-3 `ivr` F2·P9 | Orden de reconocimiento (forma de la Escuela, `calcos/reconocimiento/v1`) | Principal; estructura propia de la hoja |
| Cmte. / G-3 `guiaInicial` F1·P6 (27-10-2026, `calcos/guia-inicial/v1`) | Guía Inicial del Comandante del PMTD 2017 (siete apartados, `estructuraPropia`) | Principal; distribución sólo al Estado Mayor (`spec.distribucion`), sin autenticación (`spec.sinAutenticacion`, word.js) y sin número en el título (`spec.sinNumero`, runtime.js) |
| G-3 `prep1`, `prep2`, `prep3` | Preparatorias 1, 2 y 3 | Principal; formulario del paso |
| G-3 `opord` | Orden de operaciones | Principal; formulario |
| `aprecActiva`, `aprecOrientacion`, `aprecOps` | Apreciación de la sección correspondiente | Principal; ejercicio/calco vigente |
| G-1 `anexoF7P1`, `mNe` | Plan de personal | Anexo; productor existente de personal |
| G-1 `aprecActiva`, `aprecOrientacion` (Mis hojas, `calcos/estado-mayor/v4`) | Apreciación de personal (forma del modelo, `estructuraPropia`) | Principal; se trabaja en la hoja (🌱, IA) |
| G-1 `anexo` F7·P1 (Mis hojas, `calcos/estado-mayor/v4`) | Plan de personal (forma del modelo, `estructuraPropia`, cuadro de bajas) | Anexo (`anexoF7P1`); se trabaja en la hoja (🌱, IA) |
| G-5 `aprecActiva`, `aprecOrientacion` (Mis hojas, `calcos/estado-mayor/v4`) | Apreciación de AC/GM (forma del modelo, `estructuraPropia`, cuadros de recursos y de evacuación) | Principal; se trabaja en la hoja (🌱, IA) |
| G-5 `anexo` F7·P1 (Mis hojas, `calcos/estado-mayor/v4`) | Sin modelo dedicado: la estructura del anexo de AC/GM de la Mesa (`fNe`) con el formato militar común (`registro.militar` → `registroWord`), cuadros de recursos y de evacuación | Anexo (`anexoF7P1`); se trabaja en la hoja (🌱, IA) |
| Cmte. `guiaFinal` F6·P2 (Mis hojas, `calcos/estado-mayor/v7`, 27-10-2026) | Sin modelo en el catálogo: la Guía de Planificación Final del TEXTO PMTD 2017 (I.- DECISIÓN … VI.- ENSAYOS) con el formato militar común (`registro.militar`), el título SIN número (`spec.sinNumero`: el «No. / Clave» va en el membrete) y la sección EMO/JEM | Principal; se trabaja en la hoja (🌱, IA) |
| G-4 `anexoF7P1`, `dDe` | Plan de apoyo de servicio de combate | Anexo; el productor contiene personal/logística/ACGM, no sólo abastecimientos |
| `NNe` G-1 a G-5, Art., Ing., Com., ADA | Apreciación específica | Principal; productor actual por especialidad |
| `HNe` Ing., Com., ADA, Fuegos | Plan específico | Principal; productor de la especialidad |
| `HNe` Art. | Apéndice de apoyo de fuegos | Apéndice; requiere padre registrado |
| `a4e` logística, engaño, reconocimiento, movimiento, calco | Modelo específico | Contenido del productor actual |
| G-5 anexo sin modelo dedicado | Estructura nativa con formato militar común | Documento militar identificado; no se sustituye por otro plan |
| Línea de tiempo, programa, conceptos, matrices y cálculos auxiliares | Formato propio de cada hoja | Sin diálogo ni plantilla militar |

`v1/catalogo.js` conserva fuentes y SHA-256 de sus lecturas; contiene 26 clases (las versiones Markdown y Word duplicadas no cuentan como clases nuevas). Las instrucciones numeradas del modelo se conservan como instrucciones, no como contenido elaborado; se usan rótulos descriptivos para sus conclusiones. La sección VI Log. del modelo de movimiento se conserva como variante explícita. El modelo de misión está incompleto y no se impone a la hoja de misión reexpresada.

Los campos que no coinciden de forma única requieren asignación explícita. Se conservan tablas y celdas combinadas del esquema nativo, datos, imágenes preparadas y pendientes. No se publican adjuntos ni capturas de interfaz del paquete. Los documentos multiparte pasan por revisiones y descargas individuales, cada parte con su propia identidad y correlativo.

## Formato y pruebas

Arial; Carta; márgenes 2/2/2/3 cm; SECRETO en encabezado y pie; campos PAGE y NUMPAGES; membrete 10 negrilla; título 16; cuerpo/OCA 12; estilos y numeración editables I.- A.- 1.- a.- 1) a). Títulos subordinados con tabulación y sangría francesa. Firma/autenticación/distribución en bloques. Calcos conservan orientación e imágenes proporcionalmente.

- `python calcos/pruebas/construir-formatos-integrados.py`: construye desde la versión vigente de inicio de ejercicio, conservando sus mejoras, y registra un parche reversible.
- `NODE_PATH=<node_modules con acorn> node calcos/pruebas/formatos-integrados.cjs`: recuperación CE-I/PC/Pucarani/tiempo/usuario/XYZ, conservación, separación de formatos y equivalencia exacta de la línea de tiempo con SVG y matrices.
- `python calcos/pruebas/construir-formato-militar.py`: construye el nuevo compilado desde el original y registra reemplazos verificables.
- `python calcos/pruebas/construir-catalogo-militar.py <lectura del paquete>`: reconstruye el catálogo.
- `node calcos/pruebas/formato-militar.cjs`: selección, identidad, vínculos y cinco Word con datos administrativos de prueba. Requiere docx del runtime o dependencia equivalente.
- `TEST_DEPS=<node_modules con jsdom> node calcos/pruebas/formato-militar-ui.cjs`: diálogo, generación real, vista previa invocada, persistencia, reexportación, cancelación y protección de contenido sin correspondencia.
- `node calcos/pruebas/formato-militar-ia.cjs`: unidad por ejercicio, matrices completas, prompt, rutas, fuentes y rechazo de respuestas de otra unidad.
- `NODE_PATH=<node_modules con acorn> node calcos/pruebas/formato-militar-integracion.cjs`: ejecuta funciones extraídas del compilado y verifica reversibilidad byte por byte.

Los cinco DOCX fueron renderizados en LibreOffice e inspeccionadas todas sus páginas: título largo de anexo/apéndice, tablas multipágina, seis niveles, firmas y paginación. Pasan las pruebas funcionales anteriores de autollenado, agua, estudio, simbología, fuegos, conceptos y riesgo. La prueba histórica `reemplazos-compilado.js` ya falla sobre la base anterior (no incluye integraciones posteriores de fichas/ejes); su fallo se comprobó también sin este cambio y se conserva sin silenciarlo. No se ejecutó una sesión completa de Chromium: no hay navegador instalado en este entorno. La prueba de vista previa en DOM comprueba generación y llamada, no equivalencia visual de docx-preview con Word.

## Continuidad y reversión

El alcance está limitado a `calcos/index.html`, nuevo asset, módulos de formato y pruebas. Para revertir, vuelva a cargar `index-ficha-documental-20260930.js` desde `calcos/index.html` y retire el CSS nuevo; los datos añadidos del ejercicio son compatibles y no deben borrarse. No hay cambios en notas, disciplina, horarios ni autenticación.

Corrección de formato del 01-10-2026: los seis niveles de numeración se exportan sin subrayado; el texto de los subtítulos conserva su estilo. Los subtítulos y párrafos del cuerpo tienen 12 puntos de separación posterior. Los bloques de contenido sin título heredan la alineación del subtítulo contenedor y no agregan sangrías. Las hojas de trabajo conservan su exportador propio.

Comprobación: `node calcos/pruebas/espaciado-militar.cjs` verifica el OOXML real de los seis niveles y las referencias de caché. `construir-espaciado-militar.py` reproduce el cambio de referencia del paquete vigente.

Corrección de autenticación e importación del 01-10-2026: el autenticador usa las iniciales del elaborador, incluido el cambio de usuario activo. Se reconocen las abreviaturas UU. y los apartados opcionales del modelo sin eliminar datos. El recorrido habitual de Word ya no ofrece una segunda importación de IA: toma el contenido vigente de la hoja.

Prueba: `TEST_DEPS=<node_modules con jsdom> node calcos/pruebas/autenticador-militar.cjs` verifica identidad, asignación y descarga real de la preparatoria.

Prueba de descarga directa: `NODE_PATH=<node_modules con acorn> TEST_DEPS=<node_modules con jsdom> node calcos/pruebas/exportacion-hoja.cjs` usa el productor real de las tres preparatorias, verifica todos los campos una sola vez en el OOXML y comprueba cero consultas de IA, conservación de contenido y correlativos.

### OCA y distribución

Objeto, Carta(s) y Anexos usan rótulos a 1 cm y contenido a 4 cm del margen de texto, con una línea de separación entre campos. El exportador presenta el asunto breve, la identificación/escala cartográfica y un anexo por línea; omite las explicaciones añadidas en estos tres campos. El asunto de emisión se abrevia con la unidad y el verbo inicial de su misión cuando están explícitos; no se cambia la hoja guardada. Los otros apartados conservan su contenido. Distribución empieza a 10,5 cm del margen de texto, con columnas alineadas para copia, dos puntos y destinatario.

Verificación: `node calcos/pruebas/oca-militar.cjs` (admite una especificación JSON de entrada y una ruta DOCX de salida).

### Orden de Reconocimiento y estructura propia (01-10-2026, versión `reco20261001`)

La F2·P9 se arma en `calcos/reconocimiento/v1` y llega con `estructuraPropia: true`: se exporta tal cual (no pasa por `aplicarPlantilla` ni por la asignación de apartados del diálogo), con su número y su distribución. `word.js` admite, sin cambiar los demás documentos: `organizacion` (el cuadro de ORGANIZACIÓN DE LA TAREA después de OBJETO/CARTA/ANEXOS, en filas de hasta cuatro equipos, Arial 10, con bordes), nodos `item` (incisos numerados con la numeración de la Mesa, sin negrilla, estilos `MilitarInciso1..6`) y `vinetas` (guiones con sangría francesa debajo del texto). `runtime.js` exporta `vistaMilitar` (el mismo Word, sin descargar ni registrar) y `mostrarDocx`. El OBJETO breve ya no se corta en «AO.», «LF.», «PC.»… delante de un nombre en mayúsculas y el membrete no repite «CG.» si el puesto de mando ya lo trae.

Verificación: `node calcos/pruebas/reconocimiento.cjs` y `node calcos/pruebas/e2e/reconocimiento.cjs`.

### La OGO del profesor y «AL PLAN» (11-10-2026)

`word.js` también arma los Word de la 📜 OGO completa con sus anexos del tablero del profesor
(`calcos/modalidad/ogo.js`): el tablero lo importa con su propio `?v=` y lo configura con las mismas
clases de docx del compilado (`window.SIDMilLib`, ver `CAMBIOS-EN-EL-COMPILADO.md`), así que el
formato es el mismo de todos los documentos. Único cambio en `word.js`: el título de un anexo cuyo
padre es un PLAN dice «AL PLAN DE OPERACIONES …» (antes «A LA PLAN…»); con una ORDEN sigue «A LA
ORDEN…». Prueba: `node calcos/pruebas/ogo.cjs`.

### El diálogo se llena solo (18-10-2026, `modelo.js?v=destinos20261018`)

Sergio, con la captura del diálogo del Anexo de Apoyo de Servicio de Combate (🎬 Concepto del G-4): «¿por
qué no se rellena sola?». Los contenidos que no coincidían EXACTO con un apartado del modelo de la Escuela
quedaban en «Seleccione apartado» y el DOCX no salía hasta elegirlos uno por uno; el anexo pedía además su
letra, su asunto y el padre, y la distribución podía quedar con «[Unidad superior pendiente]» aunque la
unidad superior ya estuviera arriba.

- **Cada contenido trae su apartado** (`sugerencias` → `sugerido`, `destinoCercano`): «Organización de la
  Tarea» va a un bloque **sin numerar antes de SITUACIÓN** (`§org`); lo que empieza con el título de un
  apartado («2.- Condiciones meteorológicas.») va a ese apartado; si no, el título más hondo que coincide
  (igual, o con todas sus palabras: «Personal» → «Funciones de Personal»; las fases → el Concepto de
  Apoyo) y si no, el de arriba («SITUACIÓN.»); lo que no tiene dónde ir se **conserva con su título de la
  hoja, al final** (`§propio`). El diálogo los muestra ya elegidos (y esas dos opciones arriba de la
  lista). Si el oficial deja uno en «Seleccione apartado», el aviso «Asigne el contenido…» sigue.
- **El título propio del renglón no se pierde** cuando su apartado es otro («Mantenimiento.» dentro de
  «Funciones Logísticas.», sin numerar). En un apartado exacto no se repite, como antes.
- **La descarga directa sin diálogo no cambia**: lo exacto sigue en `destino` y, si algo no coincide, se
  conserva la estructura propia de la hoja.
- **El anexo se identifica solo** (`completarSubordinado`): el asunto, del paréntesis del título; la
  letra, del título o del cuadro de anexos de la OGO del G-3 (si no, la de la OGO de la Mesa: «F» Apoyo
  de Servicio de Combate, «H» Personal, «I» AC/GM…); el padre, la OGO registrada en el ejercicio o, con el
  número de la Orden en el título («… ORDEN DE OPERACIONES Nº 3»), la ORDEN GENERAL DE OPERACIONES No. 3.
  Con todo eso **baja directo, sin diálogo**. Un padre escrito sólo con su número («24») es la ORDEN
  GENERAL DE OPERACIONES No. 24 (`tituloPadre`); lo que escribió el oficial no se pisa.
- **La distribución** toma la unidad superior aunque llegue del membrete después (y al descargar se
  reemplaza «[Unidad superior pendiente]» si quedó).

El compilado importa `runtime.js?v=sigla20261011` (no se tocó): el navegador puede tardar lo que dure su
caché en tomar el `runtime.js` nuevo, que ya importa `modelo.js?v=destinos20261018`.

Pruebas: `node calcos/pruebas/formato-militar-destinos.cjs` (los renglones del anexo, el Word con los
sugeridos, letra/asunto/padre) y `node calcos/pruebas/e2e/word-anexo-g4.cjs` (la Mesa real: directo con
el número de la Orden; sin él, el diálogo lleno y el DOCX con la OGO No. 24). `formato-militar-ui.cjs`
cambió con esto: el contenido sin correspondencia ya viene ubicado (`§propio`); el aviso se prueba
dejándolo a propósito sin apartado.

