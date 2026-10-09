# Matriz de administración del riesgo — F2·P7 y su actualización F6·P3

Es la **HOJA DE TRABAJO** del reglamento **RO-06-01-04 «Administración del Riesgo»**
(RC-02-103), **Anexo «B»**, con los ejemplos del **Anexo «C»**: una **MATRIZ**, no una
lista. Antes la Mesa la trataba como una hoja de renglones y el Word salía como
«A.- Peligro identificado: … · Probabilidad: … · Severidad: …», sin membrete y con
RESERVADO. Ahora sale como la matriz del reglamento y como la de la Escuela (la de la
DIMEC-1):

```
                                   SECRETO
I CUERPO DE EJÉRCITO                               ← escalón superior
DIV.MEC.-1                    CG. VIACHA D-15 (2300) ← unidad considerada · PC · hora
EMO/SEC-III                                        ← sección
No. 001/XYZ                                        ← número / clave del redactor
                 MATRIZ DE ADMINISTRACIÓN DEL RIESGO
┌ A. Misión o tarea ───────────┬ B. Grupo fecha/hora ┬ C. Fecha de preparación ┐
├ D. Preparado por ──────────────────────────────────────────────────────────────┤
│ E. Tarea │ F. Obstáculos │ G. Estimar │ H. Controles │ I. Residual │ J. Implementar │
│  …una fila por obstáculo; la tarea ocupa las filas de sus obstáculos…          │
├ K. Nivel general: BAJO (B)  MODERADO (M)  (ALTO (A))  SUMAMENTE ALTO (SA) ─────┤
                      EL COMANDANTE DE LA DIV.MEC.-1
                                   SECRETO
                                    1 - 2
```

- **Membrete táctico** en **Arial 10 negrilla**: sale de la Orden del escalón superior
  (escalón superior, unidad considerada, puesto de mando, hora del membrete, clave del
  redactor). Lo que el oficial escribe en la hoja («✏️ Corregir» en el membrete) manda.
- **SECRETO** arriba y abajo de cada página (aunque la orden diga RESERVADO; se puede
  cambiar en la hoja) y la **numeración «1 - 2»** al pie.
- **Rótulos**: los del reglamento (**A – K**, por defecto) o los de la Escuela
  (**1 – 11**, como la matriz de la DIMEC-1: tareas en mayúsculas, «A (IIB)», viñetas «-»).
- **G e I** (estimación y riesgo residual): probabilidad **A–E** (Cuadro 4) × severidad
  **I–IV** (Cuadro 5) → nivel con la **Figura 6** (SA · A · M · B), que calcula la Mesa.
  La casilla lleva el nivel y el código: «Alto (A) (IIB)».
- **K**: el **MAYOR** riesgo residual de la matriz (no un promedio — Paso 3), encerrado
  en un círculo (una elipse de verdad en el Word).
- Firma: «EL COMANDANTE DE LA …» (o «DEL …» para un regimiento o un batallón).

## En la Mesa

Tablero del G-3 → 📄 Documentos → «Analizar la misión» → **F2·P7**, y «Aprobar el curso
de acción propio» → **F6·P3** (la misma matriz, actualizada):

1. **👁️ Vista previa** (la hoja entera, carta apaisada; en el teléfono se achica para
   entrar) y **📄 Word (formato militar)**.
2. **🌱 Armar con lo del ejercicio**: la misión (reexpresada, F2·P12; si no, la de la
   orden), el grupo fecha/hora y la fecha de preparación (Línea Inicial de Tiempo: la
   F2·P7 al terminar el análisis de la misión, la F6·P3 al aprobar el curso de acción;
   si no hay línea, las horas de la misión), quién la prepara y las tareas de la F2·P3.
   **No pisa** lo escrito. En la F6·P3, **📋 Partir de la matriz de la fase II**.
3. **🤖 Trabajar esta hoja con IA**: el mismo panel de las demás hojas. El pedido lleva el
   **expediente entero** (orden del escalón superior / tema base, documentos aportados,
   terreno con el **COC** —se calcula si falta— y el **CMOC**, meteorología, enemigo,
   fases, hojas de todo el Estado Mayor), lo que leyó la Mesa, el **método del
   RO-06-01-04** (MATT-TCE, Cuadros 4 y 5, Figura 6, controles con quién/qué/dónde/
   cuándo/cómo, residual, implementación), los ejemplos y la matriz de hoy con sus `id`.
   La IA devuelve letras; la Mesa calcula los niveles. «Sólo completar» no pisa nada;
   «Completar y mejorar» reescribe la matriz. Lo que pone la IA queda marcado
   **«🤖 revisar»** en la pantalla (no se imprime) hasta que el oficial lo da por revisado.
4. **La matriz**: por TAREA (E) sus OBSTÁCULOS (F), con el factor MATT-TCE, la
   estimación (G), los controles (H), el residual (I), cómo se implementan (J) y de dónde
   sale (no se imprime). K se calcula sola.
5. **Revisión** (RO-06-01-04): faltantes, residual más alto que el inicial, residual
   SUMAMENTE ALTO, tareas repetidas, factores MATT-TCE sin revisar.

**La hoja de antes** (una lista de renglones, con «[IA — verificar]») se lee sola: cada
renglón pasa a ser un obstáculo de una tarea sin nombre, con la probabilidad y la
severidad pasadas a letras cuando se puede («Alta» → B / II) y lo que decía a la vista
(«Antes decía: …»). Se guarda con el formato nuevo recién cuando el oficial la toca.

Se guarda con el ejercicio en `g3.riesgo` y `g3.riesgoFinal`, esquema `riesgo-v1`:

```js
{ esquema: 'riesgo-v1', rotulos: 'reglamento' | 'eceme',
  mision, empieza, termina, preparacion, preparadoPor,
  tareas: [{ id, tarea, peligros: [{ id, peligro, factor, prob, sev, controles: [],
                                    probRes, sevRes, implementar: [], fuente, ia, antes? }] }],
  membrete: { clasificacion?, superior?, unidad?, puesto?, fechaHora?, seccion?, numero? },
  firma?, legado? }
```

El texto se guarda **tal cual** se escribe (la hoja se guarda en cada tecla) y se limpia
al imprimir, al bajar el Word y al armar el pedido a la IA.

## Archivos (`v1/`)

- `modelo.js` — esquema, Figura 6, rótulos, hoja anterior, membrete, lectura del
  ejercicio, armado, K, revisión, texto para el expediente. Sin DOM.
- `ia.js` — el pedido a la IA, la aplicación de su respuesta y la fusión con lo que
  traen otros pedidos (`hojas_g3`). Sin DOM.
- `docx.js` — Word sin bibliotecas: el XML de Word a mano (con la elipse) en un ZIP.
- `word.js` — el Word de la matriz. `vista.js` — la matriz en HTML (vista previa y carpeta).
- `editor.js`, `runtime.js` — la pantalla y lo que presta el compilado (React, el panel
  de IA `hU`, el encabezado `Qq`, el corrector `uU`, la Línea de Tiempo `MS`).

Si se cambian estos módulos, conviene publicarlos en una carpeta nueva (`v2/`) y apuntar
el compilado ahí, por la caché de los navegadores (como `calcos/conceptos/`).

## Pruebas

```bash
cd calcos/pruebas && npm ci
node riesgo.cjs                  # modelo, Figura 6, hoja anterior, membrete, IA, Word (sin navegador)
node reemplazos-compilado.js     # la cadena de compilados es reversible
node e2e/riesgo.cjs              # la hoja en la Mesa real, escritorio y teléfono
python3 word-riesgo.py           # los Word que bajaron las pruebas: formato militar
```

`riesgo-ejercicio.js` es un ejercicio de División con unidades y lugares FICTICIOS, la
F2·P7 guardada con el formato de antes y una respuesta de IA de ejemplo. Los Word y las
capturas quedan en `pruebas/salidas-riesgo/` (no se versionan).

## v2 (09-10-2026)

`v2/` es la `v1/` con el membrete táctico común (`calcos/membrete/v1`): el escalón superior es la unidad que expidió la Orden, la unidad considerada (RCB-1 por defecto) con su CG y la hora de la Línea de Tiempo, EMO/SEC-III y el correlativo del G-3 con las iniciales del usuario; «CG.» debajo de la R de SECRETO y la firma del Comandante de la unidad considerada. `v1/` queda como estaba (lo prueba `riesgo.cjs`).
