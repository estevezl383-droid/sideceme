# 🎓 Modalidad de la Mesa del EM — Mesa · Aprendizaje · Profesor (10-10-2026)

Lo pidió Sergio con una captura de la Mesa: estaba trabado porque entraba a cada G y avanzaba
en uno, después en otro, y el orden se perdía. Quería, arriba (al lado de «Vista clásica»),
una **modalidad Aprendizaje** (un solo alumno hace el PMTD entero, por fases, con los documentos
de la Visión Horizontal en orden) y una **modalidad Profesor** (armar un ejercicio: «yo soy el
Cmte. de FF.TT. / de Cuerpo y mis alumnos son los Cmtes. de Cuerpo / de División»).

## Qué hay

Código **aparte del compilado** (como la piel Pandora, el Superponer o el Despliegue): no toca
React, no guarda nada en el ejercicio y se puede quitar sacando tres líneas del `index.html`.

| Archivo | Qué es |
|---|---|
| `catalogo.js` | Las **7 fases con sus pasos en orden** (hoja «PMTD 2020» de la Visión Horizontal; 7·17·8·8·3·4·3 pasos), con el documento que sale, el responsable y **dónde se abre en la Mesa** (sección + número de hoja, o herramienta). Más los **10 pasos del profesor** (cada uno con su pedido a la IA), los **escalones** (FF.TT.→CE, CE→DIV, DIV→BRIG, BRIG→Unidades), los **focos** (qué G entrena el ejercicio), los **anexos de la OGO** y las **organizaciones tipo** (FF.TT., C.E., D.I., D. Mec., Brigada, COE). Se carga en el navegador y en Node. |
| `ia-profesor.js` | **La IA del profesor** (puro, se prueba en Node): `armarPedido(paso, ctx)` arma el pedido de cada paso con el escalón, el foco y el ejercicio recortado (la Orden escrita, las fichas, el CMOC, los documentos adjuntos); el del paso 5 pide la **OGO completa con todos sus anexos**. `fichasDeOrganizacion` y `fichasDeJSON` arman las fichas (la forma de `academico.js`) de una organización tipo o del bloque ```json que devuelve la IA. |
| `modalidad.js` | El selector **🎖️ Mesa · 🎓 Aprendizaje · 🧑‍🏫 Profesor** y el tablero de la derecha. |
| `modalidad.css` | Los estilos; con Pandora y una modalidad que no sea «Mesa», **esconde la columna CMTE./JEM./G-1…G-5** (el tablero ocupa su lugar y aprieta esos botones por el alumno). |

### 🎓 Aprendizaje
Tablero «PMTD por fases»: las 7 fases desplegables, cada una con su «qué es» y sus pasos
numerados. Cada paso: nombre · 📄 documento · chips de los responsables · botones **«G-3 · F1·P1 ▸»**
que abren el panel de esa sección, su pestaña (📋 Mis hojas / 📄 Documentos) y **la hoja**; o la
herramienta (Unidades, C.A. por fases, Mesa EM…). Casilla «hecho» por paso, barra de avance,
botón **«Siguiente: F2·P3 ▸»** (el primer paso sin marcar). Al abrir una hoja el tablero se pliega
a una pestaña vertical en el borde derecho (como Superponer) y se vuelve a abrir desde ahí.

### 🧑‍🏫 Profesor
Tablero «Armar el ejercicio»: 1 ¿quién soy, para quién y qué entreno? (el **escalón**: muestra
quiénes son los alumnos y qué Orden se escribe; y el **foco**: G-1 · G-2 · G-3 · G-4 · G-5 o el
PMTD completo) · 2 Área de Operaciones y de Interés · 3 Generar calcos · **4 CMOC** (avenidas de
aproximación, corredores, terreno clave, obstáculos: abre el 🪖 editor CMOC y el 🧠 Análisis IA
del terreno; si no hay calcos avisa «Primero ⚡ Generar calcos») · 5 Orden del escalón superior
(Mesa EM) · 6 Unidades y Tareas · 7 Situación enemiga por fases y Defensa · 8 Documentos del
ejercicio · 9 Revisar los tableros de cada sección (los ocho botones) · 10 Repartir (Los 5
enlaces). El mismo orden del tablero «Mesa · Preparación».

**🤖 La IA en cada paso (10-10-2026).** Lo pidió Sergio: «en todas las partes debe haber opción
a trabajar con IA para generar el prompt adecuado… para el profesor debe salir una OGO con todos
sus anexos para que el alumno planifique». Cada paso tiene un botón **🤖 IA: …** que arma el
pedido con lo que ya hay en la Mesa (el escalón, el foco, la Orden escrita en «Mesa ·
Preparación», las fichas de la carta, el CMOC, las fases, los documentos adjuntos, recortado a
≈ 90 mil caracteres) y lo muestra para **📋 Copiar** o **⬇️ Bajar .md** y dárselo a ChatGPT,
Gemini o Claude. El del paso 5, **«🤖 OGO con todos sus anexos (IA)»**, pide la Orden General de
Operaciones del escalón del profesor con los 8 anexos (A Inteligencia · B Operaciones · C Apoyo
de fuegos · D Logística · E Personal · F Asuntos Civiles · G Comunicaciones · H Ingenieros),
completa en todo salvo en el campo que entrena el ejercicio: ahí la IA completa lo que el
superior sabe y **deja el trabajo al alumno** (la regla va en el pedido y el anexo de ese campo
queda marcado). Los demás pedidos: la idea del ejercicio, los límites del AO/AI, el análisis de
los calcos, el CMOC con las avenidas calificadas, el orden de batalla de los dos bandos (con un
bloque ```json de fichas para pegar), los CAE por fases, las situaciones general y particular,
la pauta de corrección con rúbrica y las instrucciones para los alumnos.

**Insertar unidades de una vez (paso 6).** «Ya tengo COE, divisiones de AZUL o Cuerpos de
Ejército directo para insertar»: se elige la organización tipo (FF.TT. con 3 C.E. · Cuerpo de
Ejército con 3 Divisiones · División de Infantería · División Mecanizada · Brigada · COE), el
bando (🔵 AZUL / 🔴 ROJO, que se dibuja espejado) y el número, y **➕ Insertar en el centro de la
vista** pone las fichas en la carta (entran por el mismo puente que usa `academico.js`:
`MesaAcademica.sincronizar → agregarUnidades`; ⟲ Deshacer de la Mesa las quita). **📥 Pegar
fichas de la IA (JSON)** inserta el bloque que devolvió la IA (bandos sueltos y armas o
escalones que no existen se normalizan; las que vienen sin lat/lng se ponen junto al centro).
Son organizaciones genéricas de escuela, no la orgánica real de ningún ejército: se ajustan
ficha por ficha en 🪖 Unidades.

### Lo que es criterio de la Mesa y lo que NO hace (para ser honestos)
- Las fases, los pasos, los documentos y los responsables son los de la **Visión Horizontal 2020**
  (hoja «PMTD 2020»); los «qué es» de cada fase resumen el texto PMTD 2017. Dónde se abre cada
  hoja es criterio de la Mesa (la prueba comprueba que cada una exista en el compilado).
- Lo marcado como hecho, la fase abierta, el escalón y el foco quedan en **localStorage de ese
  navegador**: no viajan con el ejercicio ni se ven desde otro equipo. Las hojas de verdad siguen
  en el ejercicio, como siempre.
- **La IA no se llama desde la Mesa**: el tablero arma el PEDIDO (el texto) y el profesor lo
  pega en la IA que use; lo que la IA conteste se pega a mano en «Mesa · Preparación», en los
  documentos del ejercicio o, las fichas, con «📥 Pegar fichas de la IA». No se gasta nada en
  llamadas.
- El compilado manda por `MesaAcademica.sincronizar` el NOMBRE del ejercicio abierto, las fichas
  y el centro de la vista; los datos del ejercicio (la Orden escrita, el CMOC, las fases, los
  documentos) se leen del IndexedDB «calcos», donde la Mesa lo autoguarda cada pocos segundos
  (se lee sin crear nada; si recién escribiste algo, esperá unos segundos y volvé a armar el
  pedido). Si no hay ejercicio abierto, el pedido sale sin contexto y lo dice.
- El **escalón del profesor es una guía**, no un motor: no cambia lo que dibuja ni calcula la Mesa
  (eso lo decide la Orden que escribe el profesor y las unidades que coloca).
- Cuando la hoja no existe en esta Mesa (p. ej. la PICB del G-2 no es una «hoja», es su panel),
  el botón abre el tablero de la sección; si no encuentra el botón, dice «No está en esta Mesa».
- Las hojas de las secciones se abren apretando los botones reales (por su texto): si se cambia
  el texto de un botón o de una pestaña del compilado, hay que actualizar `SECCIONES`/
  `HERRAMIENTAS` en `catalogo.js` (la prueba avisa).

## Cómo se comprobó
- `node calcos/pruebas/modalidad.cjs`: 7 fases, 50 pasos, **96 «Abrir» que existen en el
  compilado** (cada uno una sola hoja, en el catálogo de su sección), herramientas y secciones
  con botón real (el editor CMOC incluido), los 10 pasos del profesor en orden con su pedido a
  la IA, los focos, los 8 anexos, sintaxis de los módulos y el `index.html`.
- `node calcos/pruebas/ia-profesor.cjs`: las armas y escalones de las organizaciones son los
  del compilado; las fichas de un C.E. AZUL y una D.I. ROJO (forma, número, espejado, ids);
  el JSON de la IA (bandos sueltos, arma/escalón inexistentes, sin lat/lng); el pedido de la
  OGO con los 8 anexos y el anexo del foco marcado (y ninguno con el PMTD completo), el contexto
  del ejercicio y su recorte; un pedido por paso; sin ejercicio sale igual.
- `node calcos/pruebas/e2e/modalidad.cjs` (la Mesa real en Chromium, escritorio y teléfono):
  selector; Aprendizaje con las 7 fases y la columna de la derecha escondida; «Abrir» de la
  F1·P6 abre la Guía Inicial del Cmte., la F2·P3 las Tareas de Personal del G-1 (📋 Mis hojas)
  y la F1·P1 la Orden de Alerta del G-3 (📄 Documentos); lo marcado queda después de recargar;
  Profesor con los 10 pasos, el escalón, el foco, los 10 botones de IA, el pedido de la OGO con
  sus anexos y el foco elegido, y las 6 organizaciones; en escritorio, con un ejercicio sembrado
  y abierto: el pedido lleva su nombre, su Orden y sus fichas, «➕ Insertar» mete una D.I. ROJO
  (10 fichas) en el calco y «📥 Pegar fichas de la IA» una más; vuelta a «Mesa»; sin errores de
  consola.
  Capturas en `calcos/pruebas/salidas-modalidad/`.
