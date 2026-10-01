# Formato militar — Calcos

Implementación del paquete de Sergio Morales (30-SEP-2026). Base de integración `a8d8ceddc6a17d57313ee2de6b17ce5280a3666d`. No se modifican datos tácticos al exportar. Código legible v1 separado del compilado; el original permanece disponible.

## Uso

Desde la hoja, pulse **Word (formato militar)**. Revise membrete, número propio del título, firma y destinos del contenido. Complete la fecha/hora de la línea de tiempo si no está registrada expresamente; nunca se usa el reloj del equipo ni se confunde la vigencia de una orden superior con la expedición. Para un subordinado, seleccione el padre del mismo ejercicio/unidad o registre su título y número real. Vista previa militar y DOCX usan el mismo generador. Las previsualizaciones ordinarias existentes siguen siendo genéricas.

El correlativo se guarda en `ops.documentosMilitares`, junto al ejercicio, por ejercicio y unidad considerada. La identidad incluye G, hoja, fase/paso, modelo y nivel. Reexportar conserva el correlativo y los campos revisados. Exportar no equivale a expedir una orden. Se mantiene el guardado existente del ejercicio; no se introduce un contador global de servidor ni una numeración concurrente entre copias independientes del ejercicio. Para conservarlo al trasladar el ejercicio, guarde/exporte el ejercicio después de generar sus documentos.

## Completar el documento con IA

El diálogo militar contiene **Completar documento con IA**. **Preparar prompt del documento** obtiene el expediente actual mediante el productor existente `Ju`: ejercicio, base documental, orden superior, calcos, medios, organización, hojas y fase activa. Incluye el contenido vigente y las rutas exactas del modelo de cada G. Copie el prompt a la IA, pegue el JSON completo y pulse **Incorporar respuesta al documento**. La aplicación organiza los apartados, conserva las tablas originales y guarda el borrador para la próxima apertura. El texto añadido se identifica con «IA — verificar» y sus fuentes. Los metadatos aportados por IA requieren fuentes y completan campos vacíos; deben revisarse en el diálogo.

La unidad considerada se toma del contexto registrado; un valor vacío de una hoja no la borra. Cuando falte, se identifica una vez en el diálogo y se guarda por ejercicio en `ops.contextoDocumental`. Nunca se usa el nombre geográfico del área como unidad. El prompt no inventa decisiones ni datos faltantes; solicita resumir información documentada y marcar pendientes. La IA continúa mediante el flujo de copiar/pegar, sin una llamada automática a un proveedor externo.

La matriz nativa de reconocimiento se conserva con sus siete columnas y se vincula automáticamente con las tareas de unidades subordinadas del modelo. Los destinos permanecen disponibles para revisión en un bloque desplegable.

## Asociación explícita

| Ruta existente | Modelo | Nivel / origen |
|---|---|---|
| G-3 `ivr` F2·P9 | Orden de reconocimiento | Principal; matriz y campos vigentes |
| G-3 `prep1`, `prep2`, `prep3` | Preparatorias 1, 2 y 3 | Principal; formulario del paso |
| G-3 `opord` | Orden de operaciones | Principal; formulario |
| `aprecActiva`, `aprecOrientacion`, `aprecOps` | Apreciación de la sección correspondiente | Principal; ejercicio/calco vigente |
| G-1 `anexoF7P1`, `mNe` | Plan de personal | Anexo; productor existente de personal |
| G-4 `anexoF7P1`, `dDe` | Plan de apoyo de servicio de combate | Anexo; el productor contiene personal/logística/ACGM, no sólo abastecimientos |
| `NNe` G-1 a G-5, Art., Ing., Com., ADA | Apreciación específica | Principal; productor actual por especialidad |
| `HNe` Ing., Com., ADA, Fuegos | Plan específico | Principal; productor de la especialidad |
| `HNe` Art. | Apéndice de apoyo de fuegos | Apéndice; requiere padre registrado |
| `a4e` logística, engaño, reconocimiento, movimiento, calco | Modelo específico | Contenido del productor actual |
| G-5 anexo y hojas auxiliares sin modelo dedicado | Estructura nativa y formato común | Aviso explícito; no se sustituyen por otra clase |

`v1/catalogo.js` conserva fuentes y SHA-256 de sus lecturas; contiene 26 clases (las versiones Markdown y Word duplicadas no cuentan como clases nuevas). Las instrucciones numeradas del modelo se conservan como instrucciones, no como contenido elaborado; se usan rótulos descriptivos para sus conclusiones. La sección VI Log. del modelo de movimiento se conserva como variante explícita. El modelo de misión está incompleto y no se impone a la hoja de misión reexpresada.

Los campos que no coinciden de forma única requieren asignación explícita. Se conservan tablas y celdas combinadas del esquema nativo, datos, imágenes preparadas y pendientes. No se publican adjuntos ni capturas de interfaz del paquete. Los documentos multiparte pasan por revisiones y descargas individuales, cada parte con su propia identidad y correlativo.

## Formato y pruebas

Arial; Carta; márgenes 2/2/2/3 cm; SECRETO en encabezado y pie; campos PAGE y NUMPAGES; membrete 10 negrilla; título 16; cuerpo/OCA 12; estilos y numeración editables I.- A.- 1.- a.- 1) a). Títulos subordinados con tabulación y sangría francesa. Firma/autenticación/distribución en bloques. Calcos conservan orientación e imágenes proporcionalmente.

- `python calcos/pruebas/construir-formato-militar.py`: construye el nuevo compilado desde el original y registra reemplazos verificables.
- `python calcos/pruebas/construir-catalogo-militar.py <lectura del paquete>`: reconstruye el catálogo.
- `node calcos/pruebas/formato-militar.cjs`: selección, identidad, vínculos y cinco Word con datos administrativos de prueba. Requiere docx del runtime o dependencia equivalente.
- `TEST_DEPS=<node_modules con jsdom> node calcos/pruebas/formato-militar-ui.cjs`: diálogo, generación real, vista previa invocada, persistencia, reexportación, cancelación y protección de contenido sin correspondencia.
- `node calcos/pruebas/formato-militar-ia.cjs`: unidad por ejercicio, matrices completas, prompt, rutas, fuentes y rechazo de respuestas de otra unidad.
- `NODE_PATH=<node_modules con acorn> node calcos/pruebas/formato-militar-integracion.cjs`: ejecuta funciones extraídas del compilado y verifica reversibilidad byte por byte.

Los cinco DOCX fueron renderizados en LibreOffice e inspeccionadas todas sus páginas: título largo de anexo/apéndice, tablas multipágina, seis niveles, firmas y paginación. Pasan las pruebas funcionales anteriores de autollenado, agua, estudio, simbología, fuegos, conceptos y riesgo. La prueba histórica `reemplazos-compilado.js` ya falla sobre la base anterior (no incluye integraciones posteriores de fichas/ejes); su fallo se comprobó también sin este cambio y se conserva sin silenciarlo. No se ejecutó una sesión completa de Chromium: no hay navegador instalado en este entorno. La prueba de vista previa en DOM comprueba generación y llamada, no equivalencia visual de docx-preview con Word.

## Continuidad y reversión

El alcance está limitado a `calcos/index.html`, nuevo asset, módulos de formato y pruebas. Para revertir, vuelva a cargar `index-ficha-documental-20260930.js` desde `calcos/index.html` y retire el CSS nuevo; los datos añadidos del ejercicio son compatibles y no deben borrarse. No hay cambios en notas, disciplina, horarios ni autenticación.
