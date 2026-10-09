---
name: habilitar-hojas-seccion
description: Habilita TODAS las hojas y documentos de una sección del Estado Mayor (G-5, EME… — el G-1 ya está hecho y es el modelo) en «📋 Mis hojas» de la Mesa del EM (calcos/), como ya están el G-1, el G-2, el G-3 y el G-4 — 📘 guía «¿Para qué es y cómo se llena?», 🌱 traer del calco lo que falte, 🤖 IA que analiza TODOS los documentos adjuntados al ejercicio y los análisis de los calcos con los reglamentos, Word de la hoja y Word con el formato militar de la Escuela, cada documento con SU formato. Usar cuando pidan «hacé lo mismo con el G-5», «habilitá las hojas del G-x con IA», «la apreciación / el anexo del G-x se baja hecha, no se puede trabajar», «completar con los prompts de la IA los documentos del G-x», «llenar las hojas de trabajo o los documentos militares del G-x», aunque no digan «skill».
---

# Habilitar las hojas de una sección del Estado Mayor (motor `calcos/estado-mayor`)

El 03-10-2026 se hizo para el **G-1** (ver `calcos/estado-mayor/README.md` y las entradas
del 03-10 de `calcos/CAMBIOS-EN-EL-COMPILADO.md`). Desde esos compilados
(`index-personal-20261003.js` y, encima, `index-lector-20261003.js`) los ganchos de la Mesa
son GENÉRICOS: para otra sección **no hay que volver a tocar el compilado para que
funcione** — se escribe `calcos/estado-mayor/vN/campos/<g>.js`, se registra, y se versiona
la carpeta. La versión vigente es la carpeta que importa el compilado vigente (hoy `v6`: sumó el Comandante y el JEM; la `v5` sumó la
Potencia Relativa de Combate del G-3: `v5/prc.js`).

El **G-5** se hizo el 03-10-2026 con este skill (`v3/campos/g5.js`, entrada «2026-10-03 (3)»
de `CAMBIOS-EN-EL-COMPILADO.md`): es el segundo modelo, y el que hay que mirar si la sección
necesita algo del calco que el motor no recibía (el G-5 necesitó las CAPAS y las cuentas de
su panel: `reemplazos-2026-10-03-g5.js`), si su modelo analiza por FUNCIÓN y no por CAP, o
si tiene un apartado con texto propio Y subapartados.

El **Comandante y el JEM** se hicieron el 09-10-2026 (`v6/campos/cmte.js`, `jem.js` y `mando.js`, entrada
«2026-10-09 (2)» de `CAMBIOS-EN-EL-COMPILADO.md`): no tienen modelo de la Escuela, no son `Nx` (su panel es
`wDe`/`PLe`/`OLe`) y sus hojas son de trabajo (campos y filas) con 🌱 que lee lo que ya hizo cada sección
(`mando.js`); lo que comparten con el G-3 (`compartida: 'g3'`) es el MISMO dato. La Mesa no manda al
expediente las hojas de estos dos puestos: `registro.js` (`conMando`) se las pasa a las demás secciones.
Desde la v6 la guía 📘 viene plegada y las instrucciones del modelo van en el placeholder de cada casilla
(menos texto en pantalla: el usuario no quiere explicaciones, sólo herramientas).

**La IA no siempre contesta en JSON** (a veces escribe el documento en Markdown). Eso ya lo
resuelve `lector.js` del motor para TODOS los documentos registrados y, en el compilado, para
las hojas de trabajo de siempre de todas las secciones: no hace falta nada por sección.
Pero la prueba de la sección nueva TIENE que pegar una respuesta escrita como documento
(como `calcos/pruebas/respuesta-prosa-personal.md`) y comprobar que cae en sus apartados.

Lo que el usuario quiere, en sus palabras: «que lo habilites para todos los documentos de
acuerdo al formato del documento correspondiente… no te equivoques… la IA es para rellenar
con el análisis de los documentos y los calcos y todo lo que corresponde a los
reglamentos». Es decir:

1. **Cada documento con SU forma**: la del modelo de la Escuela que ya está en el catálogo
   del formato militar (`calcos/formato-militar/v1/catalogo.js`), apartado por apartado y en
   orden. Nunca una forma inventada.
2. **Todas las hojas** de la sección: los documentos que hoy «se bajan hechos» (tipo
   `remite`: Apreciación F1·P3, la actualizada F2·P13, el Anexo F7·P1) pasan a trabajarse
   en la hoja; las hojas de trabajo de siempre (filas, dos listas, campos) suman guía y 🌱.
3. **La IA con todo**: el expediente completo (que ya trae la Orden, los documentos
   aportados por el oficial con su texto, el calco, el CMOC, la PICB, los documentos del G-3 y
   las hojas de todos), lo que calcula la Mesa para esa sección, lo que entregaron las
   otras, la doctrina y reglamentos de la sección, el formato exacto y las ideas del oficial.

## Paso 0 — Mirar qué hay

```bash
node .claude/skills/habilitar-hojas-seccion/scripts/hojas-de-seccion.cjs g5   # las hojas de la sección, su tipo, si ya tienen 📘/🌱
node .claude/skills/habilitar-hojas-seccion/scripts/ver-modelo.mjs           # los modelos del catálogo
node .claude/skills/habilitar-hojas-seccion/scripts/ver-modelo.mjs aprec-acgm # el árbol de uno, numerado I.- A.- 1.- a.- 1)
```

- La apreciación de cada sección: `registroHoja` (formato-militar/v1/modelo.js) ya asocia
  `aprecActiva`/`aprecOrientacion` → `aprec-personal` (g1), `aprec-acgm` (g5)…; el anexo
  `anexoF7P1` → `plan-personal` (g1), `plan-aspc` (g4). Si la sección NO tiene modelo de
  anexo en el catálogo (el G-5 no lo tenía): no lo inventes. Para el G-5, Sergio dijo que se
  use lo que ya estaba cargado («ya había formatos cargados por cada sección con membrete
  con OCA»): la estructura del anexo que ya bajaba la Mesa (su productor, `fNe`) con el
  formato militar común (`registro: { id: 'anexoF7P1', militar: true }`; la prueba compara
  la forma con los títulos que produce ese productor). Si la sección tampoco tiene productor
  propio, pedile el modelo de la Escuela.
- Lo que la Mesa ya sabe de la sección está en el compilado vigente (el que carga
  `calcos/index.html`). Buscá su panel y sus productores con el índice AST de
  `calcos/pruebas/extraer.js` (por ejemplo, para el G-5: el panel `CDe` «Asuntos Civiles»,
  la apreciación `TNe` de `LNe`, el anexo `gNe`, `x6e` del expediente con `estadosRecursos` y
  `evacuacion`). Para el G-1 fueron `_De` (panel), `iC` (bajas), `RU`/`Ose` (PP.GG.), `INe`
  y `pNe`. Esos textos son la doctrina que ya usaba la Mesa: citala igual.
- Si el usuario adjunta reglamentos o modelos, leelos completos y citá la fuente en
  `DOCTRINA`/`FUENTES`.

## Paso 1 — Versionar la carpeta

El navegador guarda los módulos: el repo versiona por carpeta (como `conceptos/v2…v4`).
Copiá la carpeta vigente (hoy `calcos/estado-mayor/v6`) a la siguiente libre (`v7`) y
trabajá en la copia. No cambies la vigente (la usa el compilado publicado).

## Paso 2 — Escribir `campos/<g>.js` (copiar la forma de `campos/g1.js`)

Lo que tiene que exportar por defecto (ver `campos/g1.js`, que está comentado):

| Clave | Qué es |
|---|---|
| `id`, `nombre`, `color`, `seccionIA`, `seccionWord` | `'g5'`, `'G-5 Asuntos Civiles / GM'`, el color de `Nx` del compilado, «SECCIÓN V — …», «E. M. G-5» |
| `documentos` | por id de hoja (`aprecActiva`, `aprecOrientacion`, `anexo`…): `{ def, nota, registro: { id }, firma(ctx), propuestas(ctx, hoja), tablas?(ctx), producto(ctx, hoja), verificacion[], ideasQue, ideasEjemplo, sembrarAyuda, partirDe? }` |
| `doctrina()` | la doctrina y reglamentos en renglones, CON la fuente |
| `datosCalco(ctx)` | lo que la Mesa calculó y tiene en el calco para la sección (texto, son DATOS) |
| `entregas(ctx)` / `entregasTexto(ctx)` | lo que entregaron la Orden superior y las otras secciones |
| `otrasHojas(ctx, sin)` | lo que ya dicen las otras hojas de la sección |
| `estadoCalco(ctx)` | ✓/✗ de lo que el documento toma del calco y botones `{ texto, accion: 'herramienta'|'colocar', arg }` |
| `guias` | `{ [idHoja]: { para, como[], ejemplo } }` para TODAS las hojas (también las de siempre) |
| `guiaIA(idHoja)` | la guía que va al pedido de la IA de las hojas de siempre (la guía + «usá la doctrina…») |
| `semillas` | `{ [idHoja]: (ctx, hoja) => propuesta }` para las hojas de siempre: filas → `[{ col: valor }]`, dos listas → `{ a: [], b: [] }`, campos → `{ campo: texto }` |

### La definición del documento (`def`) — la parte donde NO hay que equivocarse

- `preliminares`: los rótulos del modelo (`catalogo[plantilla].rotulos`), con ids.
- `arbol`: los apartados del modelo, **en el mismo orden y nivel**, con el título del
  modelo (se pueden corregir tildes y sacar el «.-» final de los títulos de nivel 1: la
  numeración la pone el Word). Cada hoja del árbol (sin hijos) es un campo con `id` único.
- Los apartados del modelo que son **instrucciones** («Expresar si la operación puede…»,
  «Valorizar los factores…») van con un rótulo descriptivo y la instrucción **literal** en
  `ayuda` (así lo hace todo el formato militar).
- El ANÁLISIS por curso de acción: `{ caps: true }` dentro del apartado, y en `def.cap` los
  campos `porFase` (si el modelo pide «Fase 1 – Fase 2…») y/o `porCap`. COMPARACIÓN de
  ventajas y desventajas por CAP: `{ ventajas: true, t, ayuda }`.
- Un apartado sin numeración (como la Organización de la Tarea): `sinNumero: true`.
- Si el modelo del catálogo tiene un salto de nivel (le falta un subtítulo), poné el que
  corresponde según el productor que ya tenía la Mesa y **anotalo** en el README.
- `obligatorios`: lo que la revisión marca como faltante (`tipo: 'err'` lo indispensable).
- `nivel: 'anexo'` para los anexos (el Word pide la letra y la Orden; lo firma el Cmte.:
  `firma: () => ''`). `registro: { id: 'anexoF7P1' }` para que `registroHoja` le dé su
  plantilla; las apreciaciones usan `{ id: 'aprecActiva' }`/`{ id: 'aprecOrientacion' }`.
- `archivo`: el nombre del Word sin tildes (`'Apreciacion_de_ACGM'`).

### Lo que trae 🌱 (`propuestas`, `semillas`)

- SÓLO lo que sale del ejercicio: el calco vivo (`ctx.calco`: ops, unidades, fasesCOA,
  bajasPorFase, conceptoApoyo, misionLog, estadosRecursos, evacuacion, orgTarea, ordenSup,
  hojasG, g3, picb), la Orden superior (`ctx.ordenSup`) y las hojas (`ctx.hojas`). Nada de
  texto genérico de relleno: eso lo hace la IA.
- Nunca pisa: el motor llena sólo lo vacío; las semillas de filas no duplican por la
  primera columna.
- Las cifras con el formato de la Mesa (`toLocaleString('es')`, decimales con coma).
- Nada de emojis en lo que va al Word (en los avisos, «ATENCIÓN:»).
- Si la sección necesita algo del calco que el motor no recibe, hay que sumarlo en
  `sincronizarEM` (runtime.js) Y en el efecto del compilado (eso sí requiere otra lista de
  reemplazos: ver el Paso 4).

## Paso 3 — Registrar

En `vN/registro.js`: `import EME from './campos/eme.js'` y `CAMPOS = { g1: G1, g5: G5, eme: EME }`.
`fasesConDocumentos` convierte en `docEM` las hojas que estén en `documentos`; las demás
siguen como estaban y suman 📘/🌱 si tienen `guias`/`semillas`.

## Paso 4 — El compilado (sólo para apuntar a la carpeta nueva)

Nueva lista `calcos/pruebas/reemplazos-AAAA-MM-DD-<g>.js` (copiar la forma de
`reemplazos-2026-10-03-respuestas.js`, que hizo esto de v3 a v4) que cambie la línea de
imports del motor de `"../estado-mayor/v5/` a `"../estado-mayor/v6/` (son 3 imports: editor,
runtime y registro; contalos con `split().length - 1`), y un `construir-<g>.js` como
`construir-respuestas.js`
(ANTERIOR = el compilado vigente, NUEVO = `index-<g>-AAAAMMDD.js`). Si la sección necesita
funciones o estado de la Mesa que el motor no tiene: un `configurarEM({...})` más antes de
`t6.createRoot(` (desde la v3, configurarEM SUMA) y un efecto nuevo con
`sincronizarExtraEM` (como el de las capas del G-5), nunca dentro de lo que insertaron listas
anteriores.
Reglas de siempre:

- Cada `viejo` aparece exactamente `veces` veces; deshaciendo se vuelve byte por byte.
- **Ninguna inserción dentro de lo que insertaron listas anteriores** (la prueba
  «ningún gancho cae DENTRO…» de `estado-mayor.cjs` lo verifica: copiala). La única
  excepción es el cambio de versión de la carpeta en los imports.
- Sumá el paso al principio de `PASOS` en `reemplazos-compilado.js` con el SHA-256 del
  compilado anterior (`sha256sum`). Tiene que seguir dando los mismos 10 fallos históricos.
- `logistica.cjs` y `estado-mayor.cjs` comprueban «el compilado vigente»: si alguna prueba
  fija un nombre de compilado, cambiala para que lea el que carga `calcos/index.html`.

## Paso 5 — Probar (no se termina sin esto)

0. `estado-mayor.cjs` (G-1) y `estado-mayor-g5.cjs` ya prueban la carpeta que importa el
   compilado vigente: tienen que seguir pasando con la carpeta nueva.
1. `calcos/pruebas/<g>-ejemplo.js`: un ejercicio FICTICIO (todo con «(FICT.)») con lo que
   la sección toma del calco, la Orden con tareas/limitaciones, un documento aportado, hojas
   ya trabajadas y respuestas de IA de ejemplo (incluí textos «que NO debe pisar»).
2. `calcos/pruebas/estado-mayor-<g>.cjs` (copiar `estado-mayor-g5.cjs`, que también compara
   el NIVEL de cada apartado y lee las hojas REALES del compilado): la forma contra el
   catálogo **apartado por apartado** (la función `fiel`), el 🌱 con las funciones REALES del
   compilado (`cargarConDependencias`), el pedido (expediente, documentos aportados, datos,
   doctrina, formato, ideas, JSON, «FORMATO DE TU RESPUESTA») y la respuesta (sólo completar
   no pisa; mejorar reescribe; también ESCRITA como documento, sin JSON, y con el JSON
   roto o cortado), guías y semillas de TODAS las hojas, el registro y los reemplazos.
3. `calcos/pruebas/e2e/<g>.cjs` (copiar `e2e/g5.cjs`; si la sección usa capas, ponelas en
   el estado de la Mesa como `ponerCapas` de esa prueba: sin red no se descargan): escritorio y teléfono, abrir el
   panel de la sección → «📋 Mis hojas», una hoja de siempre (guía, 🌱, pedido), cada
   documento (🌱, ideas, pedido, respuesta, vista previa, Word descargado y leído), avance,
   guardado y `a.errores` vacío.
4. Sumá las dos al `package.json` de `calcos/pruebas` y corré TODAS: `node <cada>.cjs` y las
   e2e de logística, reconocimiento, riesgo, conceptos, personal y g5 (y `respuestas-hojas.cjs`:
   el pedido de las hojas de TODAS las secciones termina con el formato).
5. **Mirá el Word**: `node .claude/skills/habilitar-hojas-seccion/scripts/ver-docx.cjs
   salida.docx captura.png "TEXTO"` y leé la captura (membrete, SECRETO, numeración, cuadros,
   firma, sin emojis ni marcas de la IA).

## Paso 6 — Documentar, commit y push

- `calcos/estado-mayor/README.md`: la sección nueva (tabla de hojas, qué trae 🌱, qué es
  doctrina y qué es criterio de la Mesa).
- `calcos/CAMBIOS-EN-EL-COMPILADO.md`: entrada nueva arriba (Qué pasaba / Qué se hizo / Qué
  se tocó en el compilado / En el fuente / Cómo se comprobó), con lo que de verdad se
  corrió y lo que no se pudo (p. ej. no hay LibreOffice).
- `calcos/formato-militar/README.md`: las filas nuevas de la tabla de asociación.
- `.gitignore` de pruebas: `salidas-<g>/`.
- Commit en la rama asignada y push. Sin el modelo de un documento, decíselo al usuario y
  no lo inventes.
