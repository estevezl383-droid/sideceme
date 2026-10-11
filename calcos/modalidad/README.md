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
| `catalogo.js` | Las **7 fases con sus pasos en orden** (hoja «PMTD 2020» de la Visión Horizontal; 7·17·8·8·3·4·3 pasos), con el documento que sale, el responsable y **dónde se abre en la Mesa** (sección + número de hoja, o herramienta). Más los **13 pasos del profesor** (cada uno con su pedido a la IA; el de la OGO, uno por documento), los **escalones** (FF.TT.→CE, CE→DIV, DIV→BRIG, BRIG→Unidades), los **focos** (qué G entrena el ejercicio) y las **organizaciones tipo** (FF.TT., C.E., D.I., D. Mec., Brigada, COE). Se carga en el navegador y en Node. |
| `ia-profesor.js` | **La IA del profesor** (puro, se prueba en Node): `armarPedido(paso, ctx)` arma el pedido de cada paso con el escalón, el foco y el ejercicio recortado (la Orden escrita, las fichas, el CMOC, los documentos adjuntos); el del paso 5 pide **lo esencial de la Orden** (los campos de «Mesa · Preparación»). `fichasDeOrganizacion` y `fichasDeJSON` arman las fichas (la forma de `academico.js`) de una organización tipo o del bloque ```json que devuelve la IA. |
| `ogo-modelos.js` | **📜 Los modelos de la OGO y sus anexos** (datos): la Orden de Operaciones, el Calco, los planes de Inteligencia, Apoyo de Fuegos (y el apéndice de Fuegos de Artillería), Ingeniería, Defensa Antiaérea, Comunicaciones, Logística, Personal, AC/GM, Apoyo de Servicio de Combate y Engaño, cada uno con su **modelo de la Escuela** (los párrafos con su numeración y lo que tiene que decir cada uno, del .zip «MODELOS DE CONTENIDO DE DOCUMENTOS»), su sección, su autenticador y los apartados que revisa `ogo.js`. |
| `ogo.js` | **📜 La OGO completa** (puro, se prueba en Node): el pedido de cada documento, la revisión contra su modelo, lo que contestó la IA pasado a la forma del Word militar de la Mesa (`formato-militar/v1/word.js`), el .md de ida y vuelta y los documentos para el ejercicio. |
| `ogo-mesa.js` | **📍 Lo que la OGO lee de la Mesa** (puro): quién expide (el «¿Quién soy?» del inicio), su escalón superior (FF.TT.T.O. → **CTO**), los alumnos (las fichas del escalón de abajo), el **CG por la población más cercana** a su PC (capa «Centros poblados» de los calcos), el reconocimiento de designaciones («I CUERPO DE EJÉRCITO (I CE)» = «CE-I»), las unidades de la organización de la tarea, las que faltan en la carta y dónde ponerlas. |
| `ogo-terreno.js` | **🧭 Dónde poner una unidad, mirando el terreno** (puro): una rejilla de ~1100 puntos dentro del Área de Operaciones calificada con las capas de los calcos (carreteras, caminos, ríos y lagos, poblaciones, aeródromos, cimas), el CMOC (restringido, severamente restringido, avenidas del enemigo), el PC y el enemigo, según lo que pide cada tipo de unidad; dice el porqué y objeta una ubicación (la de la IA) en el agua o al alcance del enemigo. |
| `ogo-coherencia.js` | **🔎 La revisión de coherencia** (puro): UN pedido con todos los documentos, leer la respuesta consolidada (en partes), aplicarla y volver atrás; **📍 las unidades por ubicar** con ✓ Aceptar (la ficha y los documentos sin «(supuesto)») y **📐 las medidas de la IA** con ✓ Dibujar (a las capas de la Mesa). |
| `ogo-calco.js` | **🗺️ El Anexo A como gráfico** (puro: arma un SVG): el Área de Operaciones, los límites con su magnitud, las medidas, las fichas propias con su símbolo, los PC y las **dos cruces de amarre** sobre la cuadrícula UTM con sus coordenadas; el navegador lo pasa a PNG para el Word. |
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
**Desde el 11-10-2026 son 13 pasos:** … 10 📜 OGO completa con sus anexos · **11 🔎 Revisión de coherencia:
documentos consolidados** · **12 📍 Unidades que faltan en la carta** · **13 📤 Repartir el ejercicio** (ver
«🔎 La OGO sin contradicciones, las unidades que faltan, el calco gráfico y el reparto», abajo). Las claves
`n` nuevas son 12 y 13; «Repartir» conserva su `n: 10` (se muestra como 13).

Tablero «Armar el ejercicio»: 1 ¿quién soy, para quién y qué entreno? (el **escalón**: muestra
quiénes son los alumnos y qué Orden se escribe; y el **foco**: G-1 · G-2 · G-3 · G-4 · G-5 o el
PMTD completo) · 2 Área de Operaciones y de Interés · 3 Generar calcos · **4 CMOC** (avenidas de
aproximación, corredores, terreno clave, obstáculos: abre el 🪖 editor CMOC y el 🧠 Análisis IA
del terreno; si no hay calcos avisa «Primero ⚡ Generar calcos») · 5 Orden del escalón superior:
lo esencial (Mesa EM) · 6 Unidades y Tareas · 7 Situación enemiga por fases y Defensa · 8 Documentos
del ejercicio · 9 Revisar los tableros de cada sección (los ocho botones) · **10 📜 OGO completa con
sus anexos** · 11 Repartir (Los 5 enlaces). El mismo orden del tablero «Mesa · Preparación».
(Lo marcado y la carpeta se guardan por la clave `n` de cada paso: la OGO es `n: 11` y se muestra
como 10; «Repartir» sigue siendo `n: 10` y se muestra como 11, así no se mezcla lo ya guardado.)

**🔎 La OGO sin contradicciones, las unidades que faltan, el calco gráfico y el reparto (11-10-2026, tarde).**
Lo pidió Sergio con capturas del paso 10 y del Word del Anexo A, el calco de la Escuela (RI-13 «MONTES») y
la organización de la tarea con unidades «(supuesto)»: «antes del paso 11 una revisión de todos los
documentos que arregle contradicciones o incoherencias… que se conviertan en documentos sólidos»; «generame
esas unidades y su ubicación, y que me salga un panel que diga aceptar»; «el calco es un gráfico, no es
texto… el Área de Operaciones, las unidades, las dos cruces de amarre con sus coordenadas»; «siempre que se
habla de FF.TT.T.O. el escalón superior es el CTO… la unidad considerada ya te dije al inicio… el CG tiene el
nombre de la población más cercana… No. 002/XYZ… APÉNDICES: S/A.»; y «compartir a los alumnos por ciclo o por
paralelo, siempre con el JSON, y con mi tijerita compartirles sólo la parte que seleccione».
- **El membrete** (`ogo-mesa.js` + `ogo.js · completarConfig/cfgWord`): lo vacío de «🧾 Datos de la Orden»
  se completa con la Mesa (y dice de dónde salió): **quien expide** es el «¿Quién soy?» del inicio del
  ejercicio cuando es del escalón del profesor (o si «Mesa · Preparación» no nombra otro escalón superior, o
  nombra el suyo); si no, el «Escalón superior» de «Mesa · Preparación» (y el «¿Quién soy?» son los alumnos).
  El **escalón superior de las FF.TT.T.O. es el CTO**. Los **alumnos**, las fichas propias del escalón de
  abajo («CE-I, CE-II y CE-III»). El **CG**, la población más cercana a la ficha (o al PC) de quien expide,
  de la capa «Centros poblados» de los calcos (hasta 60 km). La **fecha** la fija la IA: cada pedido le dice
  la de la OGO o, si no hay, que la escriba en la primera línea («FECHA Y HORA: D-60 (0800)»); esa línea va
  al membrete de todos los documentos (`est.auto.fechaHora`, la de la Orden manda) y no al cuerpo. Sin
  iniciales, **«No. 002/XYZ.»** (el correlativo es el del documento en su sección: la Orden es la 001 del
  EMO/SEC-III y el calco la 002). Sin apéndices, **«APÉNDICES : S/A.»** (también si la IA escribió «Sin
  novedad.»). Firma «EL COMANDANTE DE LAS FF.TT.T.O.»; distribución «Original: CTO». El Word queda:
  `CTO` / `FF.TT.T.O.  CG. Tunapa. D-60 (0800)` / `EMO/SEC-III` / `No. 002/XYZ.`. Cada pedido lleva además
  la población más cercana a cada ficha propia y las del Área de Operaciones, con la regla de nombrar PC,
  CG e instalaciones por la población más cercana, y la de marcar «(supuesto)» la unidad que no esté en la
  carta (la Mesa se la ofrece al profesor para colocarla).
- **El Anexo A es un GRÁFICO** (`ogo-calco.js`): el Word del calco lleva la imagen de lo dibujado en la Mesa
  —el Área de Operaciones de quien expide (la MÁS GRANDE de las áreas; las cortadas con la tijera van
  punteadas), los límites con su magnitud (XXX…), las líneas, zonas, objetivos y puntos de las medidas, las
  fichas PROPIAS con su marco, su arma y su escalón (el enemigo va en el Anexo de Inteligencia), los PC con
  su asta— y las **dos cruces de amarre** (noroeste y sudeste) sobre la cuadrícula UTM (10 km para un
  Teatro), con los dos dígitos principales al lado de cada brazo, como en el calco de la Escuela, y al pie la
  coordenada entera (UTM y geográfica) y la escala gráfica. Sin texto «REFERENCIAS DEL CALCO»: la IA las
  sigue escribiendo para controlar que todo lo que nombra la Orden esté dibujado. Sin escribir, el calco
  igual sale (🗺️ gráfico de la Mesa): el OBJETO y la CARTA los pone la Mesa. Un calco alto se achica para
  entrar en la hoja.
- **Paso 11 · 🔎 Revisión de coherencia** (`ogo-coherencia.js · pedido`): UN pedido con TODOS los documentos
  escritos (cada uno con su marca `=== DOCUMENTO: id · título ===`), los datos fijos del membrete, la lista
  de chequeo (misma misión, fases y fechas, misma organización de la tarea y designaciones, mismas letras,
  mismas coordenadas dentro del Área de Operaciones, PC por la población más cercana, apoyos que sostienen
  la maniobra, tiempos que encajan, escalón, sin vacíos, ninguna unidad «(supuesto)»), las fichas de la carta
  con su población más cercana, las unidades que nombran los documentos y no están en la carta, las
  poblaciones y el contexto de siempre. La IA contesta `=== REVISIÓN ===` (lo que corrigió),
  `=== DATOS ===` (```json con la fecha, las unidades que faltan con su ubicación y las medidas) y cada
  documento consolidado. **💾 Aplicar** reemplaza cada documento (el anterior queda: **↶ Volver a lo
  anterior**); si la IA cortó («SIGUE: …»), **🤖 Pedido para seguir** pide sólo los que faltan, en la misma
  conversación; lo pegado puede ir en varias partes, una debajo de la otra. Un documento que no es de la
  OGO se avisa y no se toca.
- **Paso 12 · 📍 Unidades que faltan en la carta** (`porUbicar` / `aceptar`): las de los DATOS de la IA y las
  de la organización de la tarea de la Orden («GALM-1 (OPCON…)», «BATALLÓN LOGÍSTICO DE FF.TT.: Orgánico
  (supuesto)»…) que no están entre las fichas propias (ni quien expide, ni el enemigo), cada una con su
  ubicación y la **población más cercana**. La ubicación (desde el 11-10-2026, tarde, `ogo-terreno.js`)
  **sale del terreno**, no de una distancia fija al PC: lo logístico detrás del PC, fuera del alcance de la
  artillería enemiga (≥ 35 km), junto a una carretera y a una población; la aviación atrás, en terreno
  llano, junto a un aeródromo; la artillería al alcance del frente (12–30 km del enemigo) y fuera de las
  poblaciones, los lanzadores más atrás; ingenieros, comunicaciones (en altura), antiaérea y PC alterno
  cerca del PC y de los caminos; la maniobra adelante, sobre las avenidas del enemigo que tiene que
  cerrar; la reserva en profundidad. **Nunca** en un lago o humedal ni en terreno severamente
  restringido, y separadas entre sí (dos sugeridas no quedan a menos de ~1,5 km). Cada una dice
  **🧭 por qué** («detrás del PC · a 42 km del enemigo (fuera del alcance de su artillería) · a 0,8 km de
  una carretera · junto a SABAYA»). La de la IA se respeta, salvo que el terreno la objete: si cae en el
  agua, en terreno severamente restringido o a tiro directo del enemigo, se cambia por la del terreno y
  lo dice (**↪ Se cambió: la de la IA (…) caía en un lago o humedal**); si sólo es discutible (terreno
  restringido, sobre una avenida del enemigo) queda y se avisa (ℹ️). Sin capas de terreno ni CMOC, el
  análisis usa lo que haya (el PC, el enemigo, las poblaciones); sin Área de Operaciones, la regla de antes. **✓ Aceptar** (o ✓ Aceptar todas) la pone en la
  carta por el puente (`agregarUnidades`; el ↶ Deshacer de la barra la quita) y saca el «(supuesto)» de las
  líneas de los documentos que la nombran; **✕ No colocar** (↺ la vuelve a ofrecer). Al aplicar la
  coherencia, si hay unidades para colocar, el tablero baja a este paso.
- **📐 Medidas de coordinación y control** (mismo paso, `medidasPorDibujar` / `aceptarMedidas`): las que la IA
  trae en los DATOS (`"medidas"`: líneas de fase, límites, áreas de empeñamiento, objetivos, puntos) con
  **✓ Dibujar** (o ✓ Dibujar todas) entran a la carta por el puente nuevo `agregarOps`
  (`index-medidas-20261011.js`, ver `CAMBIOS-EN-EL-COMPILADO.md`): una línea a ⚫ límites (simple; un
  «límite» con escalón, con su magnitud), un área a límites punteada y cerrada, un objetivo a objetivos, un
  punto a coordinación, **con su nombre** en la carta 2D y en el calco del Anexo A. Las coordenadas que la IA
  pone como [lat, lng] (o al revés) se ordenan solas (las que caen dentro del Área de Operaciones). El ↶
  Deshacer de la barra las quita y el paso las vuelve a ofrecer (lo que manda es la carta: una medida con el
  mismo nombre ya dibujada no se ofrece). **✕ No dibujar** (↺ la vuelve a ofrecer). Los nombres y
  descripciones que escribió la IA entran sin `< > & " ' \``.
- **Paso 13 · 📤 Repartir**: 1) los documentos consolidados (se eligen) con **⬇️ Word (.zip) con el JSON**,
  **⬇️ JSON del ejercicio** y **📎 Adjuntar al ejercicio** (el Anexo A va como la IMAGEN del calco); 2) qué
  parte del ejercicio va: las áreas, con la **seleccionada en la Mesa** marcada (la que se acaba de cortar con
  la **✂️ tijera / lazo**; si se corta otra, pasa a ser ésa; lo elegido queda en el navegador), «✂️ Elegir
  otra parte con la tijera» abre ▧ ÁREA DE OPS, y lo de adentro (límites, medidas, fichas; el enemigo si se
  marca); 3) **a quién**: «👥 Ver a quién» trae de SIDECEME los destinos **por ciclo** («Todo el 1ER CICLO»),
  **por paralelo** («1ER CICLO · Paralelo A») y los Estados Mayores; nombre del envío e indicaciones (las del
  paso 13 de la carpeta, si están) y **📤 Enviar a los alumnos**. Va por calco-ops (`areas_destinos`,
  `ejercicio_enviar`: la Mesa del profesor tal como está, sin esperar al autoguardado; ver
  `areas-operaciones/README.md`); el cursante lo recibe en su Mesa en ▧ ÁREA DE OPS → «Compartir en la
  aplicación / Recibidos» → «Incorporar al ejercicio». El JSON es el paquete de áreas de la Mesa
  (`sideceme-areas-operaciones`), con los documentos: se abre con «Importar áreas compartidas».
- Queda en el IndexedDB «sid-profesor-ogo» (como la OGO): la revisión (`coherencia`), lo colocado
  (`colocadas`) y lo descartado; viaja en el .md de la OGO.
- Lo que NO hace: no llama a la IA. La ubicación del terreno es una **sugerencia de escuela** con lo que la
  Mesa tiene (las capas generadas y el CMOC del ejercicio; sin relieve fino, sin alcances reales de cada
  sistema de armas, sin la maniobra de la Orden en texto): el profesor la acepta o la mueve en 🪖 Unidades.
  El envío por ciclo/paralelo está publicado desde el 11-10-2026 (migración aplicada y `calco-ops` v9).

**📜 La OGO completa con sus anexos (11-10-2026).** Lo pidió Sergio con el .zip «MODELOS DE
CONTENIDO DE DOCUMENTOS» (la Orden de Operaciones y los planes de apoyo de la Escuela): «cuando
termine todos esos pasos, en conjunción con la Mesa de planeamiento, con todo lo que se construyó,
salga una OGO completa con sus planes de apoyo para darles a los alumnos… los formatos ya funcionan,
pero el contenido que deben tener los documentos es éste… no quiero ser objeto de observaciones y
críticas con órdenes mal hechas o incompletas». Antes el paso 5 pedía la OGO con 8 anexos en UN
solo pedido, antes de tener las unidades, el enemigo y los documentos, con un formato genérico (las
letras no eran las de los modelos) y la IA la devolvía cortada.
- **El paso 10** (también **📜 OGO completa con sus anexos** arriba del tablero, al lado de 📚 y 📕):
  🧾 **Datos de la Orden y del membrete** (Orden o Plan, N°, unidad que expide, su escalón superior,
  la unidad de los alumnos, CG, fecha-hora, carta, iniciales del elaborador y del JEM, firma,
  distribución, leyenda de enseñanza: lo vacío sale de «Mesa · Preparación»), y la lista de los
  documentos: la Orden y los anexos, que se eligen (por defecto: Calco, Inteligencia, Apoyo de
  Fuegos, Ingeniería, Defensa Antiaérea, Comunicaciones, Logística, Personal y AC/GM; a elección:
  el apéndice de Fuegos de Artillería, el Plan de Apoyo de Servicio de Combate —el de los tres
  campos en uno— y el de Engaño). Las letras son las de los modelos (**A** Calco, **B** Inteligencia,
  **C** Apoyo de Fuegos) y las demás seguidas; se cambian a mano si el reglamento las ordena distinto.
  ⭐ marca el documento del campo que entrena el ejercicio.
- **🤖 Pedido de cada documento**: el modelo de la Escuela de ESE documento (sus párrafos y lo que
  tiene que decir cada uno), las reglas para que no tenga observaciones (ningún apartado vacío ni
  «……», datos de este ejercicio, la biblioteca adecuada al ejercicio, coherente con lo ya escrito,
  escalón, Orden sin hipótesis / Plan con hipótesis), cómo contestar (sin membrete ni firma, el
  encabezado OBJETO/CARTA/ANEXOS, la organización de la tarea en líneas «AGRUPACIÓN: unidad; unidad»,
  cada apartado en su línea con su numeración), **lo ya escrito de la OGO** (la Orden entera y el
  comienzo de los otros anexos), la organización de la tarea de la Mesa y el contexto de siempre
  (terreno dibujado, fichas, la Orden de «Mesa · Preparación», documentos, 📚 biblioteca y 📕 carpeta).
  En el documento del campo que se entrena: completo y detallado en lo que el superior da (cifras,
  instalaciones, capacidades), sin resolverle al alumno lo suyo.
- **📥 Lo que contestó la IA → 💾 Guardar y revisar**: queda por ejercicio en el IndexedDB
  «sid-profesor-ogo» de ESE navegador (como la carpeta: NO en el ejercicio). **✅ La revisión** contra
  el modelo dice, por documento: los apartados que faltan, los vacíos (un título sin nada debajo),
  las marcas sin llenar («……», «[completar]», «XXX»), si vino cortada («SIGUE:»), los «(supuesto)»
  para confirmar; en la Orden, además: los anexos que no nombra en ANEXOS, la misión sin el para qué
  o sin el cuándo, la unidad de los alumnos que no aparece en las tareas, las «Hipótesis» en una Orden
  y la organización de la tarea que no vino en líneas. **🤖 Pedido de corrección**: le dice a la IA
  qué le falta y le pide el documento completo corregido (con la Orden ya escrita).
- **✅ Revisar todo**: cuántos documentos están sin observaciones, los que faltan escribir, los datos
  del membrete que faltan y lo que falta dibujar en la carta (Área de Operaciones, límites, fichas
  propias y enemigas).
- **⬇️ Word** (de cada documento) y **⬇️ Todo en Word (.zip)**: el formato militar de la Mesa, el
  MISMO `formato-militar/v1/word.js` de todos los documentos (membrete con la sección y el correlativo
  de cada uno, título —«ANEXO “B” (Plan de Inteligencia / Inteligencia) A LA ORDEN DE OPERACIONES No.
  01»—, OBJETO/CARTA/ANEXOS, el cuadro de la organización de la tarea, I.- A.- 1.- a.- 1) a), firma,
  autenticación del G que corresponde y distribución). Lo «PARA EL PROFESOR» no va. El .zip lleva
  además el .md con todo. **⬇️ Todo (.md)** / **📤 Cargar (.md)**: para llevar la OGO a otro equipo.
- **📎 Adjuntar al ejercicio**: los documentos escritos van a los documentos del ejercicio (la
  Orden como «orden», el de Inteligencia como «anexoicia»), sin lo del profesor; los ven los alumnos y
  se guardan en SIDECEME con el ejercicio. Adjuntar otra vez los reemplaza.
- Lo que NO hace: no llama a la IA (como los otros pasos: se copia el pedido y se pega la respuesta);
  la revisión mira la FORMA y lo que el modelo exige, no juzga si la táctica es buena; el calco del
  Anexo A es lo dibujado en la Mesa (el anexo trae sus referencias, no la imagen).

**🤖 La IA en cada paso (10-10-2026).** Lo pidió Sergio: «en todas las partes debe haber opción
a trabajar con IA para generar el prompt adecuado… para el profesor debe salir una OGO con todos
sus anexos para que el alumno planifique». Cada paso tiene un botón **🤖 IA: …** que arma el
pedido con lo que ya hay en la Mesa (el escalón, el foco, la Orden escrita en «Mesa ·
Preparación», las fichas de la carta, el CMOC, las fases, los documentos adjuntos, recortado a
≈ 90 mil caracteres) y lo muestra para **📋 Copiar** o **⬇️ Bajar .md** y dárselo a ChatGPT,
Gemini o Claude. (Hasta el 11-10-2026 el del paso 5 pedía la OGO con 8 anexos en un solo pedido;
ahora pide lo esencial de la Orden y la OGO completa sale en el paso 10, documento por documento:
ver «📜 La OGO completa con sus anexos».) La regla de siempre: completa en todo salvo en el campo
que entrena el ejercicio; ahí la IA completa lo que el superior sabe y **deja el trabajo al
alumno**. Los demás pedidos: la idea del ejercicio, los límites del AO/AI, el análisis de
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
`MesaAcademica.sincronizar → agregarUnidades`; el ↶ Deshacer de la barra las quita —desde el 11-10-2026: antes no las quitaba, ver `CAMBIOS-EN-EL-COMPILADO.md`—). **📥 Pegar
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
- `node calcos/pruebas/ogo-coherencia.cjs` (11-10-2026, tarde): las designaciones («I CUERPO DE EJÉRCITO (I CE)» =
  «CE-I», GALM-1 por su sigla), la capa de poblaciones y la más cercana, el Área de Operaciones más grande,
  quién expide (FF.TT.T.O. · CTO · CE-I, CE-II y CE-III · Tunapa) en sus tres casos, las unidades de la
  organización de la tarea (OPCON, «(supuesto)»), las que faltan y la ubicación sugerida (dentro del área,
  lo logístico detrás del PC, la artillería hacia el enemigo), la fecha que fija la IA, el membrete del Word
  (`No. 002/XYZ.`, `S/A.`, la imagen en lugar de las referencias), el pedido de coherencia, leer la respuesta
  (`fixtures/ogo-consolidado-ia.md`: marcas adornadas, «SIGUE», un anexo que no es de la OGO), aplicar en
  dos partes, volver atrás, el pedido para seguir, ✓ Aceptar / ✕ No colocar, el .md de ida y vuelta, UTM, el
  dibujo del calco (sin el enemigo, con las dos cruces) y el Word del Anexo A con la imagen. Y el **terreno**
  (`ogo-terreno.js`, con una carretera, un lago, un área severamente restringida, una avenida del enemigo y
  un aeródromo): lo logístico a < 3 km de la carretera, a ≥ 35 km del enemigo, detrás del PC, ni en el lago
  ni en lo severo, con su porqué; la artillería a 11–31 km del enemigo y más adelante que lo logístico; la
  aviación junto al aeródromo; la maniobra sobre la avenida; dos del mismo tipo separadas; lo que objeta de
  una ubicación de la IA (en el lago, al alcance del fuego) y el cambio en el panel. Y las **medidas**: las
  cuatro formas (línea, límite con magnitud, área cerrada, objetivo, punto), el orden [lat, lng], las ya
  dibujadas o con el mismo nombre en la carta, la vuelta a ofrecer si se quitaron, sin HTML, y el calco con
  sus nombres (el área punteada) sin que los rótulos se pisen.
- `node calcos/pruebas/e2e/ogo-coherencia.cjs` (la Mesa real en Chromium, con el SIDECEME de mentira): los
  pasos 10–13, el pedido con FF.TT.T.O./Tunapa/CTO, la fecha D-60, el Word del Anexo A (membrete de la
  imagen 5, imagen del calco), la coherencia aplicada, las unidades con ✓ Aceptar (la ficha entra en la
  carta, el «(supuesto)» se va, ✕ y ↺, ✓ Aceptar todas, el PC alterno como PC), **la ubicación del terreno**
  (con una carretera y un lago: «buscada en el terreno» con su 🧭 porqué, el PC alterno que la IA puso en el
  lago se cambia y no queda en el agua), **las medidas** (✓ Dibujar LF ALFA: entra a la carta con su nombre
  visible; ✓ Dibujar todas: AE-1 punteada y cerrada, OBJ 1, PC 2; ↶ Deshacer las quita y el paso las vuelve a
  ofrecer), el calco que ahora dibuja las fichas y las medidas con su nombre, el JSON de la parte cortada con la tijera (sólo lo de adentro) y el envío a «1ER CICLO · Paralelo
  A»; sin errores de consola. Capturas y los Word en `pruebas/salidas-coherencia/`.
- `node calcos/pruebas/areas-compartir.mjs`: el servidor con los destinos por ciclo y paralelo (sólo cursantes
  activos), `ejercicio_enviar` con la Mesa del profesor, los documentos elegidos y lo que recibe cada
  cursante (lo de su paralelo y lo de todo su ciclo, no lo de otro).
- `node calcos/pruebas/ogo.cjs`: los 13 documentos con su modelo (los del paquete de la Escuela), las
  letras y los títulos (A LA ORDEN / AL PLAN / el apéndice al anexo), los datos de «Mesa ·
  Preparación» que llenan lo vacío sin pisar, el pedido de cada documento (modelo, reglas, lo ya
  escrito, organización de la tarea, contexto, carpeta, biblioteca, el campo que se entrena), la
  revisión con una Orden completa (`fixtures/ogo-respuesta-ia.md`: sin faltas) y un anexo incompleto
  (`fixtures/ogo-anexo-icia-incompleto.md`: falta, vacío, marcas, cortado), la Orden con faltas
  (anexo sin nombrar, misión sin para qué ni cuándo, sin la unidad de los alumnos, hipótesis en una
  Orden, organización en prosa), el Word armado con `word.js` y la librería docx y leído, el .md de
  ida y vuelta y los documentos para el ejercicio.
- `node calcos/pruebas/e2e/ogo.cjs` (la Mesa real en Chromium con el SIDECEME de mentira): el paso 10,
  el pedido con la Mesa, la Orden completa ✓, el anexo con observaciones y su pedido de corrección,
  el Word y el .zip, ✅ Revisar todo, los datos del membrete, 📎 al ejercicio (y SIDECEME lo guarda
  sin lo del profesor), y todo sigue después de recargar. Capturas en `pruebas/salidas-ogo/`.
- `node calcos/pruebas/modalidad.cjs`: 7 fases, 50 pasos, **96 «Abrir» que existen en el
  compilado** (cada uno una sola hoja, en el catálogo de su sección), herramientas y secciones
  con botón real (el editor CMOC incluido), los 13 pasos del profesor en orden con su pedido a
  la IA (la OGO al final, con su clave `n` propia), los focos, la sección de cada documento de la
  OGO, sintaxis de los módulos y el orden de los `<script>` en el `index.html`.
- `node calcos/pruebas/carpeta-profesor.cjs`: con la respuesta REAL del CMOC que pegó Sergio
  (`pruebas/respuesta-cmoc-profesor.md`): separa «PARA EL PROFESOR» (y no corta una oración que
  empieza así), reconoce que es solución, guarda/reemplaza/saca, suma las notas, arma el bloque de
  los pedidos repartiendo el espacio y el .md va y vuelve igual (aunque el texto traiga «-->»).
- `node calcos/pruebas/e2e/carpeta-profesor.cjs` (la Mesa real en Chromium, como está publicada,
  con el SIDECEME de mentira): el pedido del paso 4 lleva el CMOC dibujado (corredor sobre caminos,
  avenidas, terreno clave, área a mano) leído de la Mesa abierta; se pega y guarda la respuesta real
  (🔒 solución, 📕✓); sigue ahí después de recargar; entra en el pedido del paso 5 y en el del
  Anexo de Inteligencia de la OGO, y no en el del paso 4; se baja el .md, se saca y se vuelve a cargar; **lo que se guarda en SIDECEME no lleva nada
  de la carpeta**; sin errores de consola. Capturas en `pruebas/salidas-carpeta/`.
- `node calcos/pruebas/biblioteca.cjs`: con dos COE REALES del Tema Base «DIAMANTE»
  (`pruebas/fixtures/coe-div-mec-1.docx`, `coe-div-1.docx`): las 13 y 14 unidades con sus
  efectivos (suman el total del COE), armamento, vehículos y equipo; el arma y el escalón de
  cada sigla; las fichas (AZUL y ROJO, armas y escalones del compilado); tipo y bando de los
  documentos; el recorte; el resumen y el pedido de la OGO con la biblioteca.
- `node calcos/pruebas/ia-profesor.cjs`: el terreno dibujado en texto (30 áreas de 400 vértices
  no inflan el pedido; la dibujada a mano va primero; corredor, avenida con su ancho, terreno
  clave, desplazamiento, obstáculo, Área de Operaciones e Interés en lat, lng) antes de la Orden;
  la carpeta entra en lo esencial de la Orden y en los CAE, no en su propio paso; las
  armas y escalones de las organizaciones son los del compilado; las fichas de un C.E. AZUL y una D.I. ROJO (forma, número, espejado, ids);
  el JSON de la IA (bandos sueltos, arma/escalón inexistentes, sin lat/lng); el pedido de lo
  esencial de la Orden (los campos de «Mesa · Preparación»), el contexto del ejercicio y su recorte;
  un pedido por paso (la OGO completa la prueba `ogo.cjs`); sin ejercicio sale igual.
- `node calcos/pruebas/e2e/modalidad.cjs` (la Mesa real en Chromium, escritorio y teléfono):
  selector; Aprendizaje con las 7 fases y la columna de la derecha escondida; «Abrir» de la
  F1·P6 abre la Guía Inicial del Cmte., la F2·P3 las Tareas de Personal del G-1 (📋 Mis hojas)
  y la F1·P1 la Orden de Alerta del G-3 (📄 Documentos); lo marcado queda después de recargar;
  Profesor con los 11 pasos (numerados en orden), el escalón, el foco, los 10 botones de IA, los 13
  documentos de la OGO con el pedido de la Orden (modelo de la Escuela, anexos, foco) y el del Anexo
  de Inteligencia (campo que se entrena), y las 6 organizaciones; en escritorio, con un ejercicio sembrado
  y abierto: el pedido lleva su nombre, su Orden y sus fichas, «➕ Insertar» mete una D.I. ROJO
  (10 fichas) en el calco y «📥 Pegar fichas de la IA» una más; 📚 se carga un .zip con los dos
  COE y un .txt (3 documentos), «➕ A la carta» mete la DIV MEC-1 (12 fichas), el pedido de la
  OGO (la Orden) lleva los dos COE y el texto, y la biblioteca sigue ahí después de recargar; vuelta a
  «Mesa»; sin errores de consola.
  Capturas en `calcos/pruebas/salidas-modalidad/`.
