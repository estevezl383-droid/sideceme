# 📜 F7·P1 — ORDEN GENERAL DE OPERACIONES del G-3 (TEXTO PMTD 2017, Capítulo VII)

`v1/ogo.mjs` es todo lo de la Orden General de Operaciones que el G-3 coordina en **⚔️ G-3 Operaciones → 📄 Documentos →
7 · Elaborar planes y órdenes → F7·P1**: la forma, lo que trae 🌱, la doctrina y el ejemplo para la IA, y el Word. Sin
DOM: se prueba en Node (`calcos/pruebas/orden-operaciones.mjs`). Lo conecta al motor de documentos del Estado Mayor
`estado-mayor/v8/campos/g3.js`.

Lo pidió Sergio el 30-10-2026, con el Word que bajó de la F7·P1 del CE-I, dos órdenes de ejemplo (la OGO No. 01/21 del
CE-I «KILÓMETRO 7» y la Orden de Operaciones 05/24 del RI-20) y el texto del PMTD: «la Mesa y toda la información que se
generó ya es completa: están los cursos de acción enemigos, los propios, las tareas y propósitos… la IA debería integrar
TODA la información que generó la aplicación manteniendo el formato del PMTD… quiero una buena orden de operaciones, muy
completa, clara y que tenga todos los elementos. Es en esto en lo que desemboca todo el ejercicio».

## Qué estaba mal

- La hoja era un **formulario plano de 32 casillas** («A.1 Maniobra», «A.2.b Apoyo de artillería…»). El Word militar le
  ponía su numeración ENCIMA de la de las casillas («III. I.- SITUACIÓN», «E. 2.b Apoyo de artillería») y dejaba afuera
  lo vacío: salía sin IV.- APOYO DE SERVICIO ni V.- COMANDO Y COMUNICACIONES.
- 🌱 escribía **cuentas, no una orden**: «Agrupación (OD): Atacar con Fuego.», «Medios disponibles: RES (alcance 23 km)»,
  «18 límite(s), 15 punto(s) de coordinación…», «Plan de barreras: 13 trabajo(s), 479 h…».
- El pedido a la IA **no tenía la doctrina** del Capítulo VII (cómo se redactan la misión, la intención, el concepto, la
  maniobra por fases y las tareas), ni el CAP aprobado fase por fase con la tarea y el propósito de cada unidad, ni el
  CAE del G-2; y el encabezado común de todos los pedidos le decía «NO escribas… la Orden de Operaciones».
- «Mesa EM → Orden de Operaciones» y «📄 OPORD» del 🎬 C.A. por fases bajaban **otro** Word: un esqueleto con
  «[Completar: QUIÉN, QUÉ…]».

## Cómo es ahora

### La forma (`DEF`)

El modelo del Capítulo VII, apartado por apartado y en orden, con la **instrucción literal del PMTD** en cada uno (la ven
el oficial y la IA):

```
OBJETO · CARTAS · ANEXOS
ORGANIZACIÓN DE LA TAREA.                       (sin número; en el Word, el cuadro y «BAJO CONTROL:»)
I.-   SITUACIÓN.  A.- Fuerzas enemigas (1.- CAE más probable, 2.- más peligroso) · B.- Fuerzas propias ·
                  C.- Refuerzos y reducciones (sin hipótesis: es una ORDEN)
II.-  MISIÓN.
III.- EJECUCIÓN.  Intención del Comandante (sin número, antes de A.-)
                  A.- Concepto de la operación: 1.- Maniobra · 2.- Apoyo de fuegos (a.- aéreo, b.- artillería, c.- MCAF) ·
                      3.- Reconocimiento y vigilancia · 4.- Inteligencia · 5.- Ingenieros · 6.- Defensa antiaérea ·
                      7.- QBN · 8.- Policía Militar · 9.- AC/GM
                  B.- Tareas de las unidades de maniobra · C.- de apoyo de combate
                  D.- Instrucciones de coordinación: 1.- vigencia · 2.- RCIC (a.- RPI, b.- RIFA, c.- EEIA) · 3.- riesgos ·
                      4.- reglas · 5.- ambiente · 6.- protección · 7.- adicionales · 8.- límite de avance · 9.- MCAF ·
                      10.- ensayo · 11.- amenaza en la retaguardia · 12.- restricciones
IV.-  APOYO DE SERVICIO.  A.- Concepto de apoyo · B.- Logística · C.- Personal · D.- AC/GM
V.-   COMANDO Y COMUNICACIONES.  A.- Comando (1.- sucesión, 2.- puestos comando) · B.- Comunicaciones (1.- IOC, 2.- prioridad)
```

Dentro de un apartado, los subapartados se escriben «1.- DIV MEC-2 (OD).», «a.- …», «1) …», «a) …» y las fases
«FASE I (NOMBRE) desde … hasta …», cada uno en su renglón: el Word los numera (`estructurar`), las fases van como
subtítulos sin número (como en «KILÓMETRO 7») y un subapartado sin nada debajo es un inciso. Lo que se escribe después de
una lista de guiones queda después de la lista.

### La hoja vieja (`desdeHojaVieja`)

Lo escrito en las 32 casillas viejas pasa a su apartado al abrir la hoja (el motor v8 lee la forma vieja con
`def.desdeViejo` y la guarda con la nueva en el primer cambio). Lo que escribía el 🌱 viejo (las cuentas) no pasa; lo que
tenía «[IA — verificar]» queda marcado para revisar. «A. Comando» con la sucesión va a la sucesión de mando.

### 🌱 (`propuestas`) — todo lo del Estado Mayor, sin pisar lo escrito

| Apartado | De dónde |
|---|---|
| OBJETO, CARTAS, ANEXOS | la unidad y la forma de maniobra; la carta de la Orden superior; los anexos de la Tabla 28 |
| Organización de la tarea | F4·P2, las agrupaciones (OD, OC-n, RESERVA) y las fichas con su dependencia; lo demás «BAJO CONTROL» |
| I.- A.- y el CAE | la Orden superior, el calco del G-2, la misión estimada; el **más probable** y el **más peligroso** de la PICB (H.T. 18, enunciado y H.T. 19 fase por fase) |
| I.- B.- | misión, intención y concepto de dos escalones arriba y las adyacentes, como subpárrafos |
| II.- | la misión aprobada (F2·P12), transcripta |
| Intención | la de la F6·P2 o la F2·P14 dicha como en el PMTD: propósito, punto decisivo, tareas clave numeradas, estado final |
| Concepto | «Cumpliremos la misión mediante…», la forma de maniobra, el esfuerzo principal, los secundarios y la lista de fases |
| **Maniobra** | el CAP aprobado en la carta **fase por fase**: «La DIV MEC-2 (OD), esfuerzo principal, defiende la LPR en Estancia Esmeralda, con el propósito de…» (lo que sigue igual: «continúa defendiendo…»), la reserva y el riesgo |
| Fuegos, artillería, MCAF | el concepto (F3·P6), la prioridad por fase, la F4·P7, los fuegos de la carta, la OAPC con la relación de cada unidad (F4·SAL) |
| Reconocimiento, ingenieros, antiaérea, AC/GM | F2·P9 y las A.I.N., la H.T. 20; el plan de barreras y los obstáculos de la carta; la sincronización; el anexo del G-5 |
| **Tareas** | «1.- DIV MEC-2 (OD).» y sus tareas «a.- FASE I: Se concentra en Turco.» de la carta; las de apoyo de combate con su relación |
| Coordinación | vigencia (D, H); **RCIC** de cada sección (F2·P8 de cada G y el Plan de búsqueda del G-2), primero los priorizados por el Comandante (RPI, RIFA y EEIA por separado); la matriz de riesgo; las limitaciones (reglas, ambiente, restricciones); puntos de decisión (F4·P4); ensayo (F6·SAL); nivel de amenaza (G-4) |
| IV.- | la misión logística y el concepto por fase del G-4; el anexo del G-4 (EPA, EPE…), del G-1 (reemplazos, PP.GG.…) y del G-5 |
| V.- | la sucesión de mando; los PC (los del concepto o las fichas «PC» de la carta con el lugar); las IOC de la Orden superior; la prioridad por fase |

Lo que la Mesa no puede saber (apoyo aéreo, inteligencia, QBN, PM, protección, límite de avance) queda para el oficial o
la IA. Nunca escribe cuentas ni remisiones a hojas de la Mesa.

### La IA

El pedido lleva: el producto (la Orden con TODO lo del Estado Mayor), **LO QUE LA MESA YA CALCULÓ** (`datosParaIA`: la
Orden superior, las unidades con su rol, el CAE, la misión, el CAP aprobado y sus fases en la carta unidad por unidad, lo
del Comandante, RCIC, eventos, recursos, fuegos, sincronización, limitaciones, riesgo, reconocimiento y los anexos con
el título de cada apartado), lo que entregaron las otras secciones, la **doctrina del Capítulo VII** (`DOCTRINA`: cómo se
redactan la misión, la intención, el concepto, la maniobra, los fuegos, las tareas y la coordinación, con los ejemplos
del PMTD), un **EJEMPLO** de redacción con la OGO «KILÓMETRO 7» (como forma y nivel de detalle, no para copiar), las
reglas (`REGLAS`) y la verificación final (`VERIFICACION`). Como la Orden es larga, se puede pedir **por partes**
(`PARTES`: I-II · III concepto · III tareas · IV-V): el pedido muestra el formato completo y pide sólo esas claves. El
encabezado común ya no le prohíbe escribir la Orden.

### El Word (`especificacion`)

Con el formato militar común de la Mesa (`estructuraPropia`): membrete, «ORDEN GENERAL DE OPERACIONES No. 01», OBJETO,
CARTAS y ANEXOS, el cuadro de la Organización de la Tarea con «BAJO CONTROL:», I.- a V.- con la numeración del PMTD
(I.- A.- 1.- a.- 1) a)), lo vacío como «[Pendiente de elaboración]», la firma «EL COMANDANTE DEL CE-I», la autenticación
del **G-3** y la distribución (Original al escalón superior, una copia por agrupación y las de bajo control, ARCHIVO).

Los botones «Mesa EM → Orden de Operaciones» y «📄 OPORD» del 🎬 C.A. por fases bajan **esta** Orden: lo escrito en la
F7·P1 y, en lo vacío, lo que trae 🌱 (sin guardar nada en la hoja). Sin nada en la F7·P1 ni en el calco, bajan lo de antes.

## 30-10-2026 (tarde) — el CONTENIDO de cada párrafo con la forma del PMTD

Sergio volvió con el Word de la F7·P1 que le dio la Orden ya hecha (con la IA) y el TEXTO PMTD 2017: «los párrafos, la
estructura está bien, pero te explico cómo debe ser el contenido». Lo que estaba mal y cómo va ahora (en 🌱 **y** en lo
que se le pide a la IA: la instrucción de cada apartado, la `DOCTRINA`, el `EJEMPLO`, las `REGLAS` y la `VERIFICACION`):

| Párrafo | Antes | Ahora (como en el PMTD) |
|---|---|---|
| II.- MISIÓN | «El CE-I defiende el AO LAUCA a partir del D… **reteniendo** la LPR… **sin permitir**… con el propósito de…» | UNA oración en el orden QUIÉN, QUÉ (tipo de operación + tarea táctica), CUÁNDO, DÓNDE y PROPÓSITO (paso 11). Con los cinco elementos de la F2·P12 escritos, 🌱 la arma con ellos en ese orden («El CE-I, defiende y bloquea a… a partir del D (0400) hasta el D+15 (1800) en el AO LAUCA con el propósito de…») |
| Intención | «**Propósito:** … **Punto decisivo:** … **Tareas clave:** … **Estado final:** …» (o las tareas clave numeradas) | En prosa, sin rótulos (la Hoja de trabajo de la Intención): «Mi intención es (propósito), para esto es clave inicialmente (tareas clave), asimismo es importante…» y, en otro párrafo, «Al finalizar la operación, (propia fuerza), (enemigo), encontrándonos en condiciones de (operación futura).». `intencionEnProsa` pasa a prosa la que venga con rótulos (la F6·P2) o como la escribía antes la Mesa |
| III.- A.- Concepto | «Cumpliremos la misión…», la hoja del CAP copiada («Esfuerzo principal: Asignado a la División…») | Como el enunciado del CAP de la Div-2: «Vamos a cumplir la misión mediante una defensa de área. El punto decisivo es… porque…», una oración por unidad con la tarea y el propósito de la **fase decisiva** («Una División Mecanizada (OD y esfuerzo principal) detiene…, con el propósito de…»; las OC con «esfuerzo secundario»; la reserva «… constituye la reserva, encontrándose en condiciones de… con orden, con prioridad de planeamiento a la OD y posteriormente a la OC-1»), «El propósito del apoyo de fuegos es…», de la defensa antiaérea, «La prioridad de esfuerzo de ingeniería será…, la prioridad de trabajo será para la Unidad que lleve la OD», la operación de sostenimiento, «La operación se desarrollará en las siguientes fases:» (una por renglón) y el estado final. En el Word, las fases del concepto son renglones del texto (no subtítulos que se lleven el estado final) |
| 1.- Maniobra | «La DIV MEC-2 (OD), esfuerzo principal, …», «La RESERVA: Composición: …», «El riesgo a afrontar: …» | Fase por fase («FASE I: CONCENTRACIÓN (desde el D-10 hasta el D-8).») y «La DIV MEC-2 (OD y esfuerzo principal) defiende…, con el propósito de…»; la reserva con su prioridad de planeamiento; al final «Se acepta / Se asume como riesgo…», que en el Word va **después** de las fases |
| 2.- Fuegos, 4.- Inteligencia, 5.- Ingenieros, 6.- ADA | listas con rótulos de la Mesa («Matriz de ejecución (F4·P7):», «Obstáculos planificados en la carta:») | «Los medios de apoyo de fuegos tienen la tarea de…, con el propósito de…, el método: la prioridad de apoyo de fuegos…, se asignan los blancos…, restricciones:…, el efecto será…»; «El enfoque de recopilación de inteligencia está dirigido a… La prioridad de apoyo a la… Los recursos son…»; «La prioridad de esfuerzo es de contramovilidad mediante…, la prioridad de trabajo a la… (OD) y posteriormente a…»; «La tarea de los medios de defensa antiaérea es…, con el propósito de…, la prioridad de apoyo a la…» |
| III.- B.- y C.- Tareas | por unidad, con incisos «a.- FASE I: …» | **Fase por fase** y, en cada fase, **todas** las unidades (las de maniobra que dependen directamente, con la reserva; en C.- las de apoyo de combate): «1.- DIV MEC-2 (OD).» / «TAREA: …» / «PROPÓSITO: …». Sin ficha en una fase, «Continúa…» lo anterior; sin dato, «SIN DATO — verificar» (la IA lo completa). Las de apoyo de combate suman su relación de apoyo (F4·SAL) desde su fase y sus fuegos (F4·P7) |
| III.- D.- 2.- RCIC | sólo los del Comandante, o los del G-3; diez o menos | `requerimientosDe`: los que ya determinó **cada sección** — la F2·P8 «RCIC. y EEIA.» del G-1, G-3, G-4, G-5 y EME y el Plan de búsqueda de información del G-2 (sus requisitos; si no tiene, los vacíos de la H.T. 4) — primero los que priorizó el Comandante (F2·P8 y F6·P2), sin repetir, RPI / RIFA / EEIA por separado, uno por renglón. Van a la IA con su sección («- RPI (G-2): …») y al panel de lo que entregaron las secciones |
| IV.- A.- Concepto de apoyo | «enfoque de apoyo en…; prioridad de apoyo: …» | «el enfoque de apoyo logístico es de…, la prioridad de apoyo a la…» |

La unidad «genérica» del concepto (`genericoDe`) sale del escalón y el arma de la ficha («División» + «mecanizada» →
«Una División Mecanizada»; una FT, «Una Fuerza de Tarea»), como en el ejemplo del PMTD; en la maniobra y en las tareas va
la designación. La fase decisiva (`faseDecisiva`) es la que se llama como el combate (defensa, ataque, bloqueo…) y no como
un movimiento (concentración, desplazamiento, ocupación…).

🌱 no pisa lo escrito. Para una Orden que ya estaba hecha con otra forma está **♻️ Rehacer con la forma del PMTD** (debajo de
🌱): reemplaza la misión, la intención, el concepto con sus subpárrafos (maniobra, fuegos, reconocimiento, inteligencia,
ingenieros, antiaérea), las tareas, los RCIC y el concepto de apoyo (`REHACER`) por lo que trae la Mesa; los demás
apartados no se tocan. Lo que había queda en el valor (`anterior`) y **↩️ Volver a lo que estaba antes de rehacer** lo
trae de vuelta (motor v8: `rehacer`, `volverAnterior`; el editor muestra el botón si el documento tiene `rehacer`).

**Sin hipótesis.** Una ORDEN de operaciones no lleva hipótesis: I.- SITUACIÓN termina en C.- Refuerzos y reducciones. El
apartado ya no existe; lo que la IA escriba igual como «D.- Hipótesis.» (que el lector dejaba al final de los refuerzos) se
corta en todos los apartados (`sinHipotesis`, por `def.limpiar` del motor, al guardar, al aplicar la respuesta y en el
Word), y la casilla «D. Hipótesis» de la hoja vieja no pasa.

## Qué es de la doctrina y qué es criterio de la Mesa

- **Doctrina (PMTD 2017, Parte Primera, Cap. VII y Parte Tercera)**: los cinco párrafos y sus subpárrafos, las
  instrucciones de cada uno, la misión (quién, qué, cuándo, dónde, propósito), la intención (propósito, punto decisivo,
  tareas clave, estado final), el concepto y el esquema de maniobra por unidad y por fase, los cuatro elementos del apoyo
  de fuegos, los RCIC sólo en III.- D.- 2.-, sin hipótesis en una ORDEN, el orden de los anexos de la Tabla 28.
- **Criterio de la Mesa**: las letras de los anexos en el orden de la Tabla 28 (con Logística, Personal y AC/GM, la
  Logística va dentro del Anexo de Apoyo de Servicio de Combate: «F» ASC, «G» Personal, «H» AC/GM, «I» Comunicaciones; el
  formato militar toma la letra de cada anexo de esta lista); la oración de cada unidad como en «KILÓMETRO 7»; la
  conjugación de las tareas de la carta («Defender la LPR» → «defiende la LPR», «continúa defendiendo…»).

## Pruebas

- `node calcos/pruebas/orden-operaciones.mjs` — la forma contra el Capítulo VII (con la instrucción literal), la hoja
  vieja, 🌱 con el ejercicio ficticio de `pruebas/ogo-ejemplo.js`, la conjugación, el pedido (doctrina, ejemplo, por
  partes, sin «NO escribas… la Orden de Operaciones»), la respuesta (JSON y escrita como documento), el Word (numeración,
  fases, incisos, cuadro, distribución, el orden de lo escrito), el registro y los ganchos del compilado.
- `node calcos/pruebas/e2e/orden-operaciones.cjs` — en la Mesa real (escritorio y teléfono): la hoja vieja migrada, 🌱,
  la IA por partes, la vista previa, el Word militar bajado y leído, «📄 OPORD», el avance y el guardado.
