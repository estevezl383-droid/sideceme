# Orden de Reconocimiento — F2·P9 (G-3 con el G-2)

Es la **ORDEN completa**, con la forma del ejemplo de la Escuela
(«06. ORDEN DE RECONOCIMIENTO», DIV.MEC.-2) y el **membrete de los demás documentos**
de la Mesa (formato militar: Arial, carta, SECRETO arriba y abajo, «1 - N» al pie,
numeración I.- A.- 1.- a.-, firma, autenticación y distribución):

```
                                   SECRETO
CE-I                                                  ← escalón superior
DIV.MEC.-2                       CG. ORURO D-90 (0830) ← unidad · PC · fecha y hora
EMO/SEC-III                                           ← sección
No. 004/AVV                                           ← correlativo / iniciales
                     ORDEN DE RECONOCIMIENTO No. 01
     OBJETO   :  Reconocimiento del AO de la DIV.MEC.-2 entre la LF. «TRUENO» y la LS.
     CARTA    :  Especial Oruro, Esc. 1:250.000.
     ANEXOS   :  “A” Calco de reconocimiento.
ORGANIZACIÓN DE LA TAREA:
┌──── EQ. ZULU ────┬──── EQ. TANGO ────┬─── EQ. VICTOR ───┐
│ - SECC. AV 2     │ - OA. REAM-3       │ - ERM/8          │
│ - SECC. IM-2     │ - OA. RAAM-7 …     │ - ERM/9          │
└──────────────────┴────────────────────┴──────────────────┘
I.-   SITUACIÓN.      A.- Enemiga.  B.- Propia.
II.-  MISIÓN.
III.- EJECUCIÓN.      A.- Plan de Reconocimiento.  1.- Objetivo general  2.- Método
                      B.- Tareas para los equipos de reconocimiento.
                          1.- Forma de llegar …   a.- b.- c.-
                          2.- Tareas.  a.- Equipo ZULU.  Obtener información referente a:  - …
                          3.- Plazos en tiempo.  (y los de cada equipo, con dónde informa)
                      C.- Instrucciones de coordinación.  1.- 2.- …
IV.-  APOYO DE SERVICIO.        A.- Abastecimientos (1.- …)  B.- Transporte.
V.-   COMANDO Y COMUNICACIONES. A.- Comando (1.- …)  B.- Comunicaciones (1.- …)
                    EL COMANDANTE DE LA DIV.MEC.-2
Autenticación:                           Distribución:
                                   SECRETO
                                    1 - 4
```

Lo vacío sale como «[Pendiente de elaboración]», para que se vea qué falta.

## En la Mesa

Tablero del G-3 → 📄 Documentos → «Analizar la misión» → **F2·P9 Orden de Reconocimiento**:

1. **👁️ Vista previa** (el Word real, dibujado en la pantalla) y **📄 Word (formato
   militar)**: la descarga directa del formato militar, con el contenido de la hoja.
2. **🌱 Traer del calco lo que falte**: cada órgano de reconocimiento del calco que no
   esté en ningún equipo (con el alcance de su medio), la carta de la Orden del escalón
   superior y, si hay Orden Preparatoria, «Ver Orden Preparatoria No. … y Anexo de
   Inteligencia.». **No pisa** lo escrito.
3. **💡 Cómo querés el reconocimiento**: las ideas del oficial (qué equipos, qué medios,
   qué buscar, dónde, cuándo). No se imprimen: van al pedido a la IA, que las sigue.
4. **🤖 Trabajar esta hoja con IA**: el mismo panel de las demás hojas. El pedido lleva el
   expediente entero, los órganos del calco con su alcance, la doctrina (RC-02-107), el
   ejemplo de la Escuela, las ideas del oficial y la orden de hoy (con los `id` de los
   equipos). «Sólo completar» no pisa nada; «Completar y mejorar» reescribe. Lo que pone
   la IA queda marcado **«🤖 revisar»** en la pantalla (no se imprime).
5. **Cada apartado se escribe o corrige a mano**, en el orden en que se imprime: número,
   OBJETO, CARTA, ANEXOS; los equipos (nombre clave, elementos, tarea, área, alcance,
   no antes de / no después de, dónde informa y lo que tienen que obtener); I a V; la
   firma y la distribución (vacías = lo que arma la Mesa).
6. **Revisión**: lo que le falta para quedar completa.

**La hoja de antes** (la matriz Órgano · Tarea · Área · Alcance · No antes de · No
después de · Dónde informa, con «[IA — verificar]») se lee sola: cada renglón es un
EQUIPO con su órgano como elemento y no se pierde ningún dato. Se guarda con el formato
nuevo recién cuando el oficial la toca.

Se guarda con el ejercicio en `g3.ivr`, esquema `reconocimiento-v1`:

```js
{ esquema: 'reconocimiento-v1', numero, objeto, carta, anexos,
  equipos: [{ id, nombre, elementos: [], tarea, area, alcance, noAntes, noDespues, informa,
              obtener: [], ia, antes? }],
  enemiga, propia, mision, objetivo, metodo, formaIntro, medios: [], plazos,
  coordinacion: [], abastecimientos: [], transporte, comando: [], comunicaciones: [],
  ideas, firma, distribucion, iaCampos: [], legado? }
```

## Archivos (`v1/`)

- `modelo.js` — esquema, hoja anterior, siembra, firma, distribución, revisión, texto
  para el expediente. Sin DOM.
- `documento.js` — la orden como documento: la especificación que recibe el formato
  militar (`estructuraPropia: true`, sin pasar por el modelo genérico del paquete) y el
  HTML de la carpeta del G-3.
- `ia.js` — el pedido a la IA, la aplicación de su respuesta y la fusión con lo que
  traen otros pedidos (`hojas_g3.ivr`).
- `editor.js`, `runtime.js` — la pantalla y lo que presta el compilado (React, el panel
  de IA `hU`, el encabezado `Qq`, el corrector `uU`, la siembra `l3e` y el formato
  militar `Mx` / `SIDMilHoja` / `vistaMilitar` / `mostrarDocx`).

Cambios en `formato-militar/v1` (versión `reco20261001`), opcionales y sin efecto en los
demás documentos: el cuadro `organizacion`, los incisos numerados sin negrilla (`item`),
los guiones (`vinetas`), la estructura propia (sin reacomodar en el modelo), el número y
la distribución de la hoja, y la vista previa sin descarga. Además: el OBJETO breve ya no
se corta en «AO.», «LF.», «PC.»… delante de un nombre en mayúsculas, y el membrete no
repite «CG.» cuando el puesto de mando ya lo trae.

## Pruebas

```bash
cd calcos/pruebas
CODEX_PRIMARY_RUNTIME_NODE_MODULES=<node_modules con docx y jszip> NODE_PATH=<con acorn> node reconocimiento.cjs
node e2e/reconocimiento.cjs      # la hoja en la Mesa real, escritorio y teléfono
node construir-reconocimiento.js # vuelve a armar el compilado (y comprueba que es reversible)
```

`reconocimiento-ejemplo.js` tiene el ejemplo de la Escuela cargado en la hoja, la matriz
de antes, un ejercicio FICTICIO y una respuesta de IA de ejemplo. Los Word y las
capturas de la prueba en el navegador quedan en `pruebas/salidas-reconocimiento/` (no
se versionan).
