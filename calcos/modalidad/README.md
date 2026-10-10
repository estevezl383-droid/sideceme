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
| `carpeta.js` | **📕 La carpeta del profesor** (pura, se prueba en Node): las respuestas de la IA de cada paso, lo «PARA EL PROFESOR» que se va sumando, lo que es solución y lo que va a los alumnos, el bloque para los pedidos que siguen y el .md para bajarla y volver a cargarla. |
| `biblioteca.js` | **📚 La biblioteca del profesor** (puro, se prueba en Node con `jszip.min.js`): lee un Word (.docx) con sus párrafos y TABLAS; reconoce el **COE** (la tabla «CLASE \| CMDO. \| RCB-1 \| … \| TOTAL» con PERSONAL · ARMAMENTO · VEHÍCULOS · EQUIPO ESPECIAL) y devuelve la División con cada unidad, su efectivo, armamento y vehículos; da el arma y el escalón de la Mesa por la sigla (RCB, RIM, RIAT, RAM, BAT. AA, BATING, BAT. COM, BAT. LOG, COMP. ICIA, ERM, RI, RAC…); arma las fichas de un COE y el resumen para la IA. |
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

**📚 Mis documentos: COE, organización, armamento (10-10-2026).** Lo pidió Sergio con los
Word del Tema Base «DIAMANTE»: «que en la aplicación pueda cargar en formato Word estos docs,
así los COE y la organización de cada división… donde se necesite lo puedo cargar». Arriba del
tablero del profesor, **📚 Mis documentos** → **📤 Cargar Word, PDF o .zip** (varios a la vez;
un .zip se abre y se lee cada Word o PDF de adentro). Cada documento queda con su **tipo**
(COE · Organización · Armamento · Inteligencia · Reglamento · Otro, adivinado por el nombre y el
texto, se cambia), su **bando** (AZUL / ROJO: «RAGNAR», «enemigo»… lo pone en ROJO) y la casilla
**IA**. Un **COE** se reconoce solo y muestra «🪖 DIV MEC-1 · 13 unidades · 3.805 H»: **➕ A la
carta** pone el Cmdo. de la División y sus unidades (sin la Comp. C y S) con su arma y su
escalón, la maniobra adelante, los apoyos en el medio y los servicios atrás (ROJO espejado);
**➕ Todos los COE a la carta** las pone una al lado de la otra (a 60 km). En el paso 6 también
está **«Desde mis COE»** con la lista de Divisiones. **Todo lo marcado «IA» entra en TODOS los
pedidos a la IA** («Biblioteca del profesor»: los COE resumidos enteros con efectivos,
armamento y vehículos por unidad; lo demás recortado en partes iguales, la doctrina al final),
y la OGO y el orden de batalla tienen la regla de **usar esas unidades y esos apéndices en vez
de inventarlos**. Queda en el IndexedDB «sid-biblioteca» de ESE navegador: sirve para todos los
ejercicios, pero no viaja a otro equipo (hay que cargarlos allá también). Los PDF se leen con
el lector de la Mesa (pdf.js); un PDF escaneado no tiene texto y lo avisa. De cada documento se
guardan hasta 400 mil caracteres (un reglamento como el RDO-20001 se recorta y lo dice).

**📕 La carpeta del profesor y el CMOC en el pedido (10-10-2026).** Lo pidió Sergio con la captura
del paso 4: el pedido del CMOC salía con **3081 caracteres** —sin los corredores, caminos y avenidas
que había dibujado— y, cuando la IA le devolvió el análisis, «no hay dónde pegar el resultado… debe
ir registrado en algún lado, ya que servirá para los cursos de acción o el anexo de inteligencia… y
si hay algo para el profesor, que se vaya sumando para que el profesor vaya solucionando».
- **Por qué salía vacío.** El tablero buscaba el ejercicio en el IndexedDB «calcos» con su nombre;
  con la Mesa publicada el ejercicio se guarda en SIDECEME y en el navegador sólo queda una copia de
  respaldo («<nombre>__anterior», de hasta 2 min atrás). El pedido salía sólo con las fichas (que
  vienen por el puente). Ahora se lee **la Mesa tal como está**: el autoguardado deja
  `window.SIDMesaEjercicio` (`calcos/guardado/v1/autoguardado.mjs`, sólo lectura); si no está, el
  IndexedDB con su nombre y, por último, la copia de respaldo (el pedido dice de dónde lo leyó).
- **El CMOC en texto.** Antes iba como JSON crudo recortado a 15 mil caracteres: las áreas
  restringidas (cientos de vértices) se comían el espacio antes de llegar a los corredores y las
  avenidas. Ahora va `resumenTerreno` (en `ia-profesor.js`), ANTES de la Orden: cada corredor (escalón
  y su ancho, bando, si va sobre caminos y cuál, de dónde a dónde, por dónde pasa, km), cada avenida
  (eje, ancho dibujado), el terreno clave, las áreas restringidas y severamente restringidas (las
  dibujadas a mano primero, después las más grandes, con superficie y centro), lo defendible, las
  áreas de empeñamiento, los desplazamientos, los obstáculos, los objetivos y el Área de Operaciones;
  todo en **lat, lng**. El pedido del paso 4 manda **partir de lo dibujado**: nombrar cada elemento,
  calificarlo, decir qué no corresponde y completar lo que falte.
- **📥 La respuesta de la IA.** Dentro de cada «🤖 IA», debajo del pedido: se pega lo que contestó la
  IA y **💾 Guardar en la carpeta**. Una respuesta por paso (guardar otra vez la reemplaza; 🗑️ la
  saca). El botón del paso muestra **📕✓**.
- **🔒 Solución o 📤 para los alumnos.** Cada pedido le pide a la IA una primera línea «DESTINO: …»;
  con eso (o con lo que diga el texto: «solución del profesor», «no debe entregarse a los alumnos»)
  la carpeta lo clasifica, y el profesor lo cambia. Fijos: la idea del ejercicio (1), los cursos de
  acción del enemigo (7) y la pauta (9) son solución; la OGO (5), la situación (8) y las
  instrucciones (10) van a los alumnos.
- **Entra en los pedidos que siguen.** Lo guardado va en todos los pedidos de los OTROS pasos
  («CARPETA DEL PROFESOR… es la BASE de este pedido», con su propio espacio de 45 mil caracteres
  repartido entre los pasos). La OGO toma del CMOC guardado el párrafo 1.a y el **Anexo A
  (Inteligencia)** a nivel del superior, sin darle al alumno lo que tiene que producir él; los
  **cursos de acción del enemigo** (7) salen de esas avenidas con sus nombres; la **pauta de
  corrección** (9) toma la solución y lo «PARA EL PROFESOR» de cada paso.
- **📕 Carpeta del profesor** (arriba del tablero, al lado de 📚): los pasos guardados (👁️ Ver, Ir al
  paso ▸) y **🧑‍🏫 Para el profesor (se va sumando)**: la sección «PARA EL PROFESOR» de cada respuesta,
  en orden. **⬇️ Bajar la carpeta (.md)**: tres partes (1 Para el profesor · 2 🔒 Solución · 3 📤 Lo que
  va a los alumnos) y, en un comentario invisible al final, los datos para **📤 Cargarla** en otro
  equipo (se suma a la del ejercicio abierto; de cada paso queda la respuesta más nueva).
- **Dónde queda.** En el IndexedDB «sid-profesor» de ESE navegador, una carpeta por ejercicio (por su
  nombre), **NO en el ejercicio**: el ejercicio se reparte a los alumnos y la solución del profesor no
  tiene que viajar con él (la prueba lo comprueba en lo que se manda a SIDECEME). Para llevarla a otro
  equipo, bajarla y cargarla allá. Sin ejercicio abierto no se guarda (lo pegado queda en el cuadro).
- `carpeta.js` es puro (se prueba en Node): `separar` (el documento y lo «PARA EL PROFESOR»: un
  título «#», en negrita, en MAYÚSCULAS o solo en su línea; una oración que empieza «Para el
  profesor…» no cuenta), `destinoDe`, `poner`/`quitar`/`cambiarDestino`, `notasProfesor`,
  `paraPedido`, `markdown`/`leerMarkdown`, `juntar`.

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

### Sin cruzarse con los otros paneles (10-10-2026)
Lo pidió Sergio con capturas en modo Profesor: el tablero tapaba la punta derecha de la barra de
herramientas y el tablero «Mesa · Preparación» le quedaba encima; había botones a los que no se
llegaba. Ahora (pantalla ancha; en el teléfono sigue abajo, como estaba):
- el tablero va **entre la barra de arriba y lo que esté apoyado abajo** (Mesa · Preparación,
  Fichas, Despliegue del TO, la leyenda): se achica lo que haga falta y lo de adentro se desplaza.
  Se revisa cada 0,4 s (la barra cambia de filas, el tablero de abajo se abre y se cierra);
- si ahí no entra (portátil de 1280 × 800 con «Mesa · Preparación» desplegado), lo de abajo se
  angosta y le deja libre la columna (`body[data-sid-mod-col]` en `modalidad.css`). Sólo si ni así
  entra (pantalla muy baja) queda encima de lo de abajo, que se puede ocultar;
- mientras un tablero de la Mesa ocupa la columna derecha (Unidades, Área de Ops, Mesa EM,
  Defensa… o el de 🧩 Superponer) **se pliega solo**, con la pestaña pegada al costado de ese
  tablero; al cerrarlo, vuelve. Si se lo despliega igual, va a la izquierda de ese tablero (si
  entra sin pisar el panel de la izquierda);
- con la piel Pandora, la barra de herramientas termina antes del tablero abierto a la derecha
  (antes quedaba debajo y sus botones de la punta no se podían tocar): `pandora.js` mide el
  tablero (`--sid-pd-tablero`) y `pandora.css` angosta la barra (`.botones-mapa.con-tablero`),
  que baja una o dos filas. Por eso `e2e/edicion.cjs` traza el Área de Influencia y el frente de
  Cuerpo debajo de la barra (la mide con el panel abierto);
- también con Pandora, el tablero de abajo desplegado empieza después del panel de la izquierda
  (como ya lo hacía plegado) y no lo tapa; si el tablero de los pasos plegado no entra al costado
  de un tablero de la derecha, lo de abajo le deja lugar igual que al desplegado.

Prueba: `node calcos/pruebas/e2e/paneles-sin-cruce.cjs` (2000 × 1290, 1440 × 900 y 1280 × 800;
capturas en `pruebas/salidas-paneles/`): nada se cruza, cada botón del tablero y de la barra se
puede tocar.

### Lo que es criterio de la Mesa y lo que NO hace (para ser honestos)
- Las fases, los pasos, los documentos y los responsables son los de la **Visión Horizontal 2020**
  (hoja «PMTD 2020»); los «qué es» de cada fase resumen el texto PMTD 2017. Dónde se abre cada
  hoja es criterio de la Mesa (la prueba comprueba que cada una exista en el compilado).
- Lo marcado como hecho, la fase abierta, el escalón y el foco quedan en **localStorage de ese
  navegador**: no viajan con el ejercicio ni se ven desde otro equipo. Las hojas de verdad siguen
  en el ejercicio, como siempre.
- **La IA no se llama desde la Mesa**: el tablero arma el PEDIDO (el texto) y el profesor lo
  pega en la IA que use; lo que la IA conteste se pega en «📥 La respuesta de la IA» del mismo paso
  (queda en la 📕 carpeta del profesor) y, si va al ejercicio, a mano en «Mesa · Preparación», en
  los documentos del ejercicio o, las fichas, con «📥 Pegar fichas de la IA». No se gasta nada en
  llamadas. La carpeta NO dibuja en la carta: las coordenadas del CMOC que devuelve la IA se
  trazan a mano en el 🪖 editor CMOC.
- El compilado manda por `MesaAcademica.sincronizar` el NOMBRE del ejercicio abierto, las fichas
  y el centro de la vista; los datos del ejercicio (la Orden escrita, el CMOC, las fases, los
  documentos) se leen de la Mesa tal como está (`window.SIDMesaEjercicio`, del autoguardado) o,
  si no, del IndexedDB «calcos» (ver «📕 La carpeta del profesor y el CMOC en el pedido»). Si no
  hay ejercicio abierto, el pedido sale sin contexto y lo dice.
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
- `node calcos/pruebas/carpeta-profesor.cjs`: con la respuesta REAL del CMOC que pegó Sergio
  (`pruebas/respuesta-cmoc-profesor.md`): separa «PARA EL PROFESOR» (y no corta una oración que
  empieza así), reconoce que es solución, guarda/reemplaza/saca, suma las notas, arma el bloque de
  los pedidos repartiendo el espacio y el .md va y vuelve igual (aunque el texto traiga «-->»).
- `node calcos/pruebas/e2e/carpeta-profesor.cjs` (la Mesa real en Chromium, como está publicada,
  con el SIDECEME de mentira): el pedido del paso 4 lleva el CMOC dibujado (corredor sobre caminos,
  avenidas, terreno clave, área a mano) leído de la Mesa abierta; se pega y guarda la respuesta real
  (🔒 solución, 📕✓); sigue ahí después de recargar; entra en el pedido de la OGO y no en el del
  paso 4; se baja el .md, se saca y se vuelve a cargar; **lo que se guarda en SIDECEME no lleva nada
  de la carpeta**; sin errores de consola. Capturas en `pruebas/salidas-carpeta/`.
- `node calcos/pruebas/biblioteca.cjs`: con dos COE REALES del Tema Base «DIAMANTE»
  (`pruebas/fixtures/coe-div-mec-1.docx`, `coe-div-1.docx`): las 13 y 14 unidades con sus
  efectivos (suman el total del COE), armamento, vehículos y equipo; el arma y el escalón de
  cada sigla; las fichas (AZUL y ROJO, armas y escalones del compilado); tipo y bando de los
  documentos; el recorte; el resumen y el pedido de la OGO con la biblioteca.
- `node calcos/pruebas/ia-profesor.cjs`: el terreno dibujado en texto (30 áreas de 400 vértices
  no inflan el pedido; la dibujada a mano va primero; corredor, avenida con su ancho, terreno
  clave, desplazamiento, obstáculo, Área de Operaciones e Interés en lat, lng) antes de la Orden;
  la carpeta entra en la OGO (con la regla del Anexo A) y en los CAE, no en su propio paso; las
  armas y escalones de las organizaciones son los del compilado; las fichas de un C.E. AZUL y una D.I. ROJO (forma, número, espejado, ids);
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
  (10 fichas) en el calco y «📥 Pegar fichas de la IA» una más; 📚 se carga un .zip con los dos
  COE y un .txt (3 documentos), «➕ A la carta» mete la DIV MEC-1 (12 fichas), el pedido de la
  OGO lleva los dos COE y el texto, y la biblioteca sigue ahí después de recargar; vuelta a
  «Mesa»; sin errores de consola.
  Capturas en `calcos/pruebas/salidas-modalidad/`.
