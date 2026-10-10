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
| `catalogo.js` | Las **7 fases con sus pasos en orden** (hoja «PMTD 2020» de la Visión Horizontal; 7·17·8·8·3·4·3 pasos), con el documento que sale, el responsable y **dónde se abre en la Mesa** (sección + número de hoja, o herramienta). Más los **9 pasos del profesor** y los **escalones** (FF.TT.→CE, CE→DIV, DIV→BRIG, BRIG→Unidades). Se carga en el navegador y en Node. |
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
Tablero «Armar el ejercicio»: 1 ¿quién soy y para quién? (el **escalón**: muestra quiénes son
los alumnos y qué Orden se escribe) · 2 Área de Operaciones y de Interés · 3 Generar calcos ·
4 Orden del escalón superior (Mesa EM) · 5 Unidades y Tareas · 6 Situación enemiga por fases y
Defensa · 7 Documentos del ejercicio · 8 Revisar los tableros de cada sección (los ocho botones)
· 9 Repartir (Los 5 enlaces). El mismo orden del tablero «Mesa · Preparación».

### Lo que es criterio de la Mesa y lo que NO hace (para ser honestos)
- Las fases, los pasos, los documentos y los responsables son los de la **Visión Horizontal 2020**
  (hoja «PMTD 2020»); los «qué es» de cada fase resumen el texto PMTD 2017. Dónde se abre cada
  hoja es criterio de la Mesa (la prueba comprueba que cada una exista en el compilado).
- Lo marcado como hecho, la fase abierta y el escalón quedan en **localStorage de ese navegador**:
  no viajan con el ejercicio ni se ven desde otro equipo. Las hojas de verdad siguen en el
  ejercicio, como siempre.
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
  con botón real, pasos del profesor en orden, sintaxis de los módulos y el `index.html`.
- `node calcos/pruebas/e2e/modalidad.cjs` (la Mesa real en Chromium, escritorio y teléfono):
  selector; Aprendizaje con las 7 fases y la columna de la derecha escondida; «Abrir» de la
  F1·P6 abre la Guía Inicial del Cmte., la F2·P3 las Tareas de Personal del G-1 (📋 Mis hojas)
  y la F1·P1 la Orden de Alerta del G-3 (📄 Documentos); lo marcado queda después de recargar;
  Profesor con los 9 pasos y el escalón; vuelta a «Mesa»; sin errores de consola. Capturas en
  `calcos/pruebas/salidas-modalidad/`.
