/* Catálogo de la MODALIDAD de la Mesa del EM (código aparte del compilado).
   Dos cosas:
   · FASES: las 7 fases del PMTD con sus pasos EN ORDEN, tal como los numera la Visión
     Horizontal del PMTD 2020 (hoja «PMTD 2020») y los describe el texto PMTD 2017. Cada paso
     dice qué documento se elabora, quién es el responsable y, cuando la Mesa tiene esa hoja,
     dónde se abre (sección + número de hoja). Es lo que ve el ALUMNO en la modalidad
     Aprendizaje: un solo oficial hace todo el PMTD, paso a paso.
   · PROFESOR: los pasos para ARMAR un ejercicio, en orden, con la herramienta real de la Mesa
     que abre cada uno y el pedido a la IA de cada paso. Es lo que ve el PROFESOR en su modalidad.
   · FOCOS (qué G entrena el ejercicio), ANEXOS_OGO (con qué anexos sale la Orden del superior)
     y ORGANIZACIONES (FF.TT., C.E., División, Brigada, COE tipo para insertar de una vez).
   Las hojas citadas (num + nom) existen en el compilado: la prueba calcos/pruebas/modalidad.cjs
   lo comprueba contra el compilado publicado, para que ningún «Abrir» quede apuntando al aire.
   Se carga en el navegador (window.SIDModalidadCatalogo) y en Node (module.exports). */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica()
  else raiz.SIDModalidadCatalogo = fabrica()
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  // Cómo se llega a cada sección en la Mesa: el botón de la barra (por su texto) y, si hace
  // falta, la pestaña de su panel donde están las hojas. El Cmte., el JEM y el EME muestran
  // sus hojas apenas se abren; el G-1, G-4 y G-5 en «📋 Mis hojas»; el G-3 en «📄 Documentos».
  var SECCIONES = {
    cmte: { corto: 'CMTE.', nom: 'Comandante', color: '#dc2626', boton: /^\W*CMTE\./i },
    jem: { corto: 'JEM.', nom: 'Jefe de Estado Mayor', color: '#f59e0b', boton: /^\W*JEM\./i },
    g1: { corto: 'G-1', nom: 'Personal', color: '#7dd3fc', boton: /G-1/i, pestana: /^\W*Mis hojas$/i },
    g2: { corto: 'G-2', nom: 'Inteligencia', color: '#6ee08a', boton: /G-2/i },
    g3: { corto: 'G-3', nom: 'Operaciones', color: '#ff9a5c', boton: /G-3/i, pestana: /^\W*Documentos$/i },
    g4: { corto: 'G-4', nom: 'Logística', color: '#fbbf24', boton: /G-4/i, pestana: /^\W*Mis hojas$/i },
    g5: { corto: 'G-5', nom: 'AC/GM', color: '#a78bfa', boton: /G-5/i, pestana: /^\W*Mis hojas$/i },
    eme: { corto: 'EME.', nom: 'Estado Mayor Especial', color: '#cbd5e1', boton: /^\W*EME\./i }
  }

  // Herramientas de la Mesa que no son hojas (botones de la barra de arriba, del panel de la
  // izquierda o de la cinta de arriba). `donde`: 'barra' (.botones-mapa), 'panel' (izquierda),
  // 'cmoc' (los botones .btn-cmoc-abrir del panel de la izquierda: el editor CMOC y el Análisis
  // IA aparecen recién cuando hay calcos generados), 'cinta' (cualquier botón de la página).
  var HERRAMIENTAS = {
    areaOps: { nom: 'Área de Operaciones', boton: /ÁREA DE OPS/i, donde: 'barra' },
    areaInteres: { nom: 'Área de Interés', boton: /ÁREA DE INTERÉS/i, donde: 'barra' },
    generarCalcos: { nom: '⚡ Generar calcos', boton: /Generar calcos/i, donde: 'panel' },
    cmoc: { nom: '🪖 CMOC (editor del terreno)', boton: /^\W*CMOC$/i, donde: 'cmoc' },
    unidades: { nom: 'Unidades', boton: /^\W*UNIDADES$/i, donde: 'barra' },
    tareas: { nom: 'Tareas', boton: /^\W*TAREAS$/i, donde: 'barra' },
    caFases: { nom: 'C.A. por fases', boton: /C\.A\. POR FASES/i, donde: 'barra' },
    defensa: { nom: 'Defensa (plan de barreras)', boton: /^\W*DEFENSA$/i, donde: 'barra' },
    mesaEM: { nom: 'Mesa EM (Orden del escalón superior)', boton: /MESA EM|Mesa ·/i, donde: 'barra' },
    ejercicio: { nom: 'Ejercicio (documentos del ejercicio)', boton: /^\W*EJERCICIO$/i, donde: 'barra' },
    estudio: { nom: 'Estudio doctrinario', boton: /^\W*ESTUDIO$/i, donde: 'barra' },
    analisisIA: { nom: '🧠 Análisis IA del terreno', boton: /ANÁLISIS IA/i, donde: 'cmoc' },
    enlaces: { nom: 'Los 5 enlaces', boton: /LOS 5 ENLACES|Ver los 5 enlaces/i, donde: 'cinta' }
  }

  // Un «abrir» es {s: sección, num: 'F1·P3', nom: /regex del nombre/} (hoja) o {h: herramienta}.
  function H(s, num, nom) { return { s: s, num: num, nom: nom } }
  function T(h) { return { h: h } }
  var TODOS = ['g1', 'g3', 'g4', 'g5', 'eme']

  var FASES = [
    {
      id: 1, nom: 'Recibir la misión', corto: 'Recibir la misión',
      que: 'Llega la orden (o la anticipa el Cmte.). Se alerta al Estado Mayor, se juntan las herramientas, cada sección abre su apreciación activa y el Cmte. da su guía inicial. Sale la Orden Preparatoria N° 1.',
      pasos: [
        { n: 1, nom: 'Alertar al Estado Mayor', doc: 'Hoja de trabajo de la Orden de Alerta (se difunde sólo al EM)', resp: ['g3'], abrir: [H('g3', 'F1·P1', /Orden de Alerta/i)] },
        { n: 2, nom: 'Reunir las herramientas', doc: 'No hay documento: cartas, PON, reglamentos, apreciaciones anteriores y la Orden del escalón superior con sus anexos', resp: ['cmte', 'jem', 'g1', 'g2', 'g3', 'g4', 'g5', 'eme'], abrir: [T('mesaEM'), T('ejercicio'), T('estudio')] },
        { n: 3, nom: 'Actualizar las apreciaciones activas', doc: 'Apreciación activa de cada sección (NO se difunden)', resp: ['cmte', 'g1', 'g2', 'g3', 'g4', 'g5', 'eme'],
          abrir: [H('cmte', 'F1·P3', /Apreciación Activa del Comandante/i), H('g1', 'F1·P3', /Apreciación Activa/i), H('g3', 'F1·P3', /Apreciación Activa de Operaciones/i), H('g4', 'F1·P3', /Apreciación Activa/i), H('g5', 'F1·P3', /Apreciación Activa/i), H('eme', 'F1·P3', /Apreciación Activa/i)] },
        { n: 4, nom: 'Desarrollar la evaluación inicial', doc: 'No hay documento: cuánto tiempo hay, qué se sabe y qué falta', resp: ['cmte', 'jem', 'g1', 'g2', 'g3', 'g4', 'g5', 'eme'] },
        { n: 5, nom: 'Asignación inicial del tiempo disponible', doc: 'Línea de tiempo y Programa General de Planeamiento (se difunde sólo al EM)', resp: ['jem'], abrir: [H('jem', 'F1·P5', /Línea Inicial de Tiempo/i), H('jem', 'F1·P5', /Programa General/i)] },
        { n: 6, nom: 'Expedir la Guía Inicial del Comandante', doc: 'Guía Inicial del Comandante (se difunde sólo al EM)', resp: ['cmte'], abrir: [H('cmte', 'F1·P6', /Guía Inicial/i)] },
        { n: 7, nom: 'Expedir la Orden Preparatoria N° 1', doc: 'Orden Preparatoria N° 1 (a las unidades subordinadas, con firma del Cmte.)', resp: ['g3'], abrir: [H('g3', 'F1·P7', /Orden Preparatoria N° 1/i)] }
      ]
    },
    {
      id: 2, nom: 'Analizar la misión', corto: 'Análisis de la misión',
      que: 'Son 17 pasos. Define el problema táctico: la Orden del superior, la PICB del G-2, las tareas, limitaciones, hechos y suposiciones de cada sección, el riesgo, los RCIC, la misión reexpresada, la orientación al Cmte. y su intención y guía. Sale la Orden Preparatoria N° 2.',
      pasos: [
        { n: 1, nom: 'Analizar la Orden del escalón superior', doc: 'Hoja de trabajo de los Conceptos Entrelazados (no se difunde)', resp: ['cmte', 'jem', 'g1', 'g2', 'g3', 'g4', 'g5', 'eme'], abrir: [H('cmte', 'F2·P1', /Conceptos Entrelazados/i), H('g3', 'F2·P1', /Conceptos entrelazados/i)] },
        { n: 2, nom: 'Conducir la PICB', doc: 'Las hojas de la PICB: terreno, clima, enemigo, cursos de acción del enemigo más probable y más peligroso (no se difunden)', resp: ['g2'], abrir: [{ s: 'g2' }] },
        { n: 3, nom: 'Determinar las tareas específicas, implícitas y esenciales', doc: 'Párrafos 1, 2 y 3 de la hoja de Tareas, Hechos, Limitaciones y Suposiciones, por sección', resp: TODOS.concat(['g2']), abrir: TODOS.map(function (s) { return H(s, 'F2·P3', /Tareas específicas/i) }) },
        { n: 4, nom: 'Comprobar los recursos disponibles', doc: 'No hay documento (análisis mental)', resp: TODOS.concat(['g2']) },
        { n: 5, nom: 'Determinar las limitaciones', doc: 'Párrafo 6 de la hoja de Tareas, Hechos, Limitaciones y Suposiciones', resp: TODOS.concat(['g2']), abrir: TODOS.map(function (s) { return H(s, 'F2·P5', /Limitaciones/i) }) },
        { n: 6, nom: 'Identificar los hechos críticos y desarrollar suposiciones', doc: 'Párrafos 4 y 5 de la hoja de Tareas, Hechos, Limitaciones y Suposiciones', resp: TODOS.concat(['g2']), abrir: TODOS.map(function (s) { return H(s, 'F2·P6', /Hechos y suposiciones/i) }) },
        { n: 7, nom: 'Iniciar la administración del riesgo', doc: 'Matriz de administración del riesgo (G-3 en coordinación con el G-2)', resp: ['g2', 'g3'], abrir: [H('g3', 'F2·P7', /riesgo/i)] },
        { n: 8, nom: 'Determinar los RCIC y los EEIA', doc: 'Hoja de los RCIC y EEIA por sección; el Cmte. les asigna prioridad', resp: ['cmte'].concat(TODOS, ['g2']), abrir: TODOS.map(function (s) { return H(s, 'F2·P8', /RCIC/i) }).concat([H('cmte', 'F2·P8', /Prioridad a los RCIC/i)]) },
        { n: 9, nom: 'Iniciar la sincronización y el plan inicial de IVR', doc: 'Plan/Orden de reconocimiento (G-3 con el G-2); se actualiza a medida que avanza el planeamiento', resp: ['g3', 'g2'], abrir: [H('g3', 'F2·P9', /Reconocimiento/i)] },
        { n: 10, nom: 'Actualizar el plan para el uso del tiempo disponible', doc: 'Línea de tiempo actualizada y comparada con la del enemigo (se difunde sólo al EM)', resp: ['jem'], abrir: [H('jem', 'F2·P10', /Línea de Tiempo actualizada/i)] },
        { n: 11, nom: 'Desarrollar los temas y mensajes de información iniciales', doc: 'Temas y mensajes de información iniciales (se difunde)', resp: ['g5'], abrir: [H('g5', 'F2·P11', /Temas y mensajes/i)] },
        { n: 12, nom: 'Desarrollar la reexpresión de la misión', doc: 'Hoja de la reexpresión de la misión (el Cmte. la aprueba)', resp: ['g3'], abrir: [H('g3', 'F2·P12', /Reexpresión/i)] },
        { n: 13, nom: 'Presentar la orientación del análisis de la misión', doc: 'El JEM arma la orientación; cada sección expone el resumen de su apreciación activa actualizada', resp: ['jem'].concat(TODOS, ['g2']), abrir: [H('jem', 'F2·P13', /Orientación del Estado Mayor/i)].concat(['g1', 'g4', 'g5', 'eme'].map(function (s) { return H(s, 'F2·P13', /actualizada/i) })) },
        { n: 14, nom: 'Desarrollar y distribuir la Intención Inicial del Comandante', doc: 'Propósito ampliado, tareas clave y estado final deseado', resp: ['cmte'], abrir: [H('cmte', 'F2·P14', /Intención Inicial/i)] },
        { n: 15, nom: 'Distribuir la Guía de Planificación del Comandante', doc: 'Guía de Planificación del Cmte. (se difunde sólo al EM)', resp: ['cmte'], abrir: [H('cmte', 'F2·P15', /Guía de Planificación/i)] },
        { n: 16, nom: 'Desarrollar las normas de evaluación de los cursos de acción', doc: 'Hoja de las Normas de Evaluación', resp: ['jem'], abrir: [H('jem', 'F2·P16', /Normas de Evaluación/i)] },
        { n: 17, nom: 'Emitir la Orden Preparatoria N° 2', doc: 'Orden Preparatoria N° 2 (a las unidades subordinadas, con firma del Cmte.)', resp: ['g3'], abrir: [H('g3', 'F2·P17', /Orden Preparatoria N° 2/i)] }
      ]
    },
    {
      id: 3, nom: 'Desarrollar los cursos de acción propios', corto: 'Desarrollar los CAP',
      que: 'Con la potencia relativa de combate se generan opciones, se organizan las fuerzas, se arma el concepto amplio de la operación y cada CAP queda con su enunciado y su bosquejo. El Cmte. elige cuáles pasan al Juego de Guerra.',
      pasos: [
        { n: 1, nom: 'Evaluar la potencia relativa de combate', doc: 'Hoja de la Potencia Relativa de Combate (el G-3 la arma; las otras secciones aportan lo suyo)', resp: TODOS.concat(['g2']), abrir: [H('g3', 'F3·P1', /Potencia relativa/i)].concat(['g1', 'g4', 'g5', 'eme'].map(function (s) { return H(s, 'F3·P1', /potencia relativa/i) })) },
        { n: 2, nom: 'Generar opciones', doc: 'No hay documento: lluvia de ideas de todo el EM para los CAP', resp: TODOS.concat(['g2']) },
        { n: 3, nom: 'Organización inicial de las fuerzas', doc: 'Unidades genéricas y proporción requerida frente al enemigo de la plantilla situacional (agrupaciones tácticas)', resp: ['g3'], abrir: [H('g3', 'F3·P3', /Formación inicial/i), T('unidades')] },
        { n: 4, nom: 'Desarrollar un concepto amplio de la operación', doc: 'El G-3 describe cómo las fuerzas cumplen la intención del Cmte.; el resto desarrolla los conceptos de apoyo', resp: TODOS.concat(['g2']), abrir: [H('g3', 'F3·P4', /Concepto amplio/i), T('caFases')] },
        { n: 5, nom: 'Asignar comandos de unidad', doc: 'Se designa al Cmte. de cada agrupación táctica', resp: ['g3'], abrir: [H('g3', 'F3·P5', /comandos de unidad/i)] },
        { n: 6, nom: 'Preparar el enunciado y bosquejo del curso de acción', doc: 'Hoja del Curso de Acción (enunciado y bosquejo de cada CAP)', resp: ['g3'], abrir: [H('g3', 'F3·P6', /Curso de acción propio/i), T('caFases')] },
        { n: 7, nom: 'Llevar a cabo la exposición de los CAP', doc: 'PICB actualizada, posibles CAE, misión reexpresada, intención del Cmte. y del superior, enunciados y bosquejos de cada CAP', resp: TODOS.concat(['g2']) },
        { n: 8, nom: 'Seleccionar o modificar los CAP que pasan al Juego de Guerra', doc: 'Enunciados y bosquejos de los CAP seleccionados', resp: ['cmte'], abrir: [H('cmte', 'F3·P8', /Selección de los cursos/i)] }
      ]
    },
    {
      id: 4, nom: 'Analizar los cursos de acción (Juego de Guerra)', corto: 'Juego de Guerra',
      que: 'Cada CAP se somete al Juego de Guerra contra los CAE del G-2: se reúnen las herramientas, se enumeran fuerzas, suposiciones, eventos críticos y puntos de decisión, se elige el método y el registro, y se llenan las matrices.',
      pasos: [
        { n: 1, nom: 'Reunir las herramientas', doc: 'Apreciaciones activas, plantilla de eventos, CAP terminados, carta ampliada, matrices en blanco; el JEM arma su libreto', resp: ['jem'].concat(TODOS, ['g2']), abrir: [H('jem', 'F4·P1', /Libreto/i)] },
        { n: 2, nom: 'Indicar todas las fuerzas amigas', doc: 'Hoja de la Organización de la Tarea', resp: ['g3'], abrir: [H('g3', 'F4·P2', /Organización de la tarea/i)] },
        { n: 3, nom: 'Indicar las suposiciones', doc: 'No hay documento: el Cmte. y el EM actualizan sus suposiciones', resp: ['cmte'] },
        { n: 4, nom: 'Indicar los eventos críticos y los puntos de decisión', doc: 'Hoja de los Eventos Críticos', resp: ['g3'], abrir: [H('g3', 'F4·P4', /Eventos críticos/i)] },
        { n: 5, nom: 'Seleccionar el método del Juego de Guerra', doc: 'Faja, profundidad o caja (lo escoge el JEM)', resp: ['g3', 'jem'], abrir: [H('g3', 'F4·P5', /Método del Juego/i)] },
        { n: 6, nom: 'Seleccionar un método de registro', doc: 'Matriz de sincronización o borrador en blanco (se llena en el paso siguiente)', resp: ['jem', 'g3'], abrir: [H('jem', 'F4·P6', /matriz de sincronización en blanco/i)] },
        { n: 7, nom: 'Someter la operación al Juego de Guerra y evaluar los resultados', doc: 'Matriz de sincronización, matriz de ejecución de apoyo de fuegos, plantilla sustentadora de la decisión y lista de blancos lucrativos', resp: ['jem'].concat(TODOS, ['g2']), abrir: [H('g3', 'F4·P6-7', /Matriz de sincronización/i), H('g3', 'F4·P7', /apoyo de fuegos/i), H('g3', 'F4·P7', /Plantilla sustentadora/i), H('g3', 'F4·P7', /blancos lucrativos/i)] },
        { n: 8, nom: 'Orientación del Juego de Guerra (opcional)', doc: 'No hay documento', resp: ['jem'].concat(TODOS, ['g2']) }
      ]
    },
    {
      id: 5, nom: 'Comparar los cursos de acción', corto: 'Comparar los CAP',
      que: 'Cada sección analiza ventajas y desventajas de cada CAP desde su campo, se comparan con la matriz de decisión y el EM recomienda el mejor al Cmte. en la orientación para la decisión.',
      pasos: [
        { n: 1, nom: 'Analizar las ventajas y desventajas de los CAP', doc: 'Matriz de decisión: ventajas y desventajas, por sección', resp: TODOS, abrir: [H('g3', 'F5·P1', /Matriz de decisión/i)].concat(['g1', 'g4', 'g5', 'eme'].map(function (s) { return H(s, 'F5·P1', /Ventajas y desventajas/i) })) },
        { n: 2, nom: 'Comparar los cursos de acción', doc: 'No hay documento: se comparan las matrices (ventajas y desventajas, positivo-neutro-negativo, análisis numérico, fortalezas y debilidades)', resp: TODOS },
        { n: 3, nom: 'Orientación para la toma de decisiones', doc: 'Rol de exposiciones que arma el JEM; cada sección expone su apreciación y recomienda', resp: ['jem'].concat(TODOS, ['g2']), abrir: [H('jem', 'F5·P3', /Rol de exposiciones/i)] }
      ]
    },
    {
      id: 6, nom: 'Aprobar el curso de acción propio', corto: 'Aprobar el CAP',
      que: 'El Cmte. decide, expide su Guía de Planificación Final, se determina el riesgo residual de la operación y sale la Orden Preparatoria N° 3.',
      pasos: [
        { n: 1, nom: 'Decisión del Comandante', doc: 'No hay documento: el Cmte. decide después de escuchar al EM', resp: ['cmte'], abrir: [H('cmte', 'F6·P1', /Decisión del Comandante/i)] },
        { n: 2, nom: 'Expedir la Guía de Planificación Final', doc: 'Guía de Planificación Final (mejora la intención y los RCIC)', resp: ['cmte'], abrir: [H('cmte', 'F6·P2', /Guía de Planificación Final/i)] },
        { n: 3, nom: 'Determinar el riesgo de la operación', doc: 'Matriz de administración del riesgo, actualizada por sección', resp: TODOS.concat(['g2']), abrir: [H('g3', 'F6·P3', /riesgo/i)].concat(['g1', 'g4', 'g5', 'eme'].map(function (s) { return H(s, 'F6·P3', /Riesgos/i) })) },
        { n: 4, nom: 'Impartir la Orden Preparatoria N° 3', doc: 'Orden Preparatoria N° 3', resp: ['g3'], abrir: [H('g3', 'F6·P4', /Orden Preparatoria N° 3/i)] }
      ]
    },
    {
      id: 7, nom: 'Elaborar planes y órdenes', corto: 'Planes y órdenes',
      que: 'Se escribe la Orden General de Operaciones con sus anexos (cada sección el suyo), el Cmte. la revisa y aprueba antes de difundirla, y el puesto comando pasa del planeamiento a la ejecución.',
      pasos: [
        { n: 1, nom: 'Elaboración de órdenes', doc: 'Orden General de Operaciones y anexos (el anexo de cada sección)', resp: TODOS.concat(['g2']), abrir: [H('g3', 'F7·P1', /Orden General de Operaciones/i)].concat(['g1', 'g4', 'g5', 'eme'].map(function (s) { return H(s, 'F7·P1', /Anexo de/i) }), [H('g4', 'F7·P2', /sincronización logística/i)]) },
        { n: 2, nom: 'Diseminación de órdenes', doc: 'El Cmte. revisa y aprueba las órdenes antes de difundirlas', resp: ['cmte'], abrir: [H('cmte', 'F7·P2', /aprobación de las órdenes/i)] },
        { n: 3, nom: 'Transición del planeamiento a la ejecución', doc: 'Actividad de preparación dentro del puesto comando', resp: ['cmte', 'jem'].concat(TODOS, ['g2']), abrir: [H('g3', 'F7·P3', /Transición/i)] }
      ]
    }
  ]

  // Qué nivel juega el profesor y, en consecuencia, qué nivel juegan sus alumnos.
  var ESCALONES = [
    { id: 'fftt', profesor: 'Comandante de las FF.TT.', alumnos: 'Comandantes de Cuerpo de Ejército', orden: 'Orden / Plan de las FF.TT. a los Cuerpos' },
    { id: 'ce', profesor: 'Comandante de Cuerpo de Ejército', alumnos: 'Comandantes de División', orden: 'Orden del Cuerpo de Ejército a las Divisiones' },
    { id: 'div', profesor: 'Comandante de División', alumnos: 'Comandantes de Brigada / Agrupación', orden: 'Orden de la División a las Brigadas' },
    { id: 'brig', profesor: 'Comandante de Brigada', alumnos: 'Comandantes de Unidad (Regimiento / Batallón)', orden: 'Orden de la Brigada a las Unidades' }
  ]

  // Los pasos para ARMAR el ejercicio (modalidad Profesor), en el orden en que la Mesa los
  // necesita: el mismo orden del tablero «Mesa · Preparación del ejercicio», más el principio
  // (quién soy y para quién) y el final (los documentos y el reparto).
  // Qué campo del Estado Mayor entrena el ejercicio: la OGO y sus anexos salen COMPLETOS en lo
  // demás y dejan el TRABAJO al alumno en ese campo (es lo que la IA tiene que respetar).
  var FOCOS = [
    { id: 'pmtd', nom: 'PMTD completo (todas las secciones)', secs: ['cmte', 'jem', 'g1', 'g2', 'g3', 'g4', 'g5', 'eme'], deja: 'todo el PMTD: cada sección hace lo suyo',
      pide: 'el PMTD entero: cada sección arma lo suyo. La OGO del escalón superior sale completa, con todos sus anexos, y los alumnos planifican su propia operación desde cero.' },
    { id: 'g1', nom: 'G-1 · Personal', secs: ['g1'], deja: 'la apreciación de personal, el cálculo de bajas por fase y el Anexo de Personal',
      pide: 'el PERSONAL: el Anexo de Personal del superior trae la situación de efectivos, bajas previstas, reemplazos, prisioneros, moral y disciplina, servicios de personal y administración, con DATOS concretos (porcentajes de efectivos por unidad, flujo de reemplazos, capacidad de evacuación), y deja al alumno la apreciación de personal, el cálculo de bajas por fase y el Anexo de Personal de su propia Orden.' },
    { id: 'g2', nom: 'G-2 · Inteligencia', secs: ['g2'], deja: 'la PICB entera: CMOC, clima, amenaza, los CAE y la plantilla de eventos',
      pide: 'la INTELIGENCIA: el Anexo de Inteligencia del superior trae la situación enemiga tal como la conoce el escalón superior (orden de batalla, dispositivo conocido, capacidades, vulnerabilidades, pero NO los cursos de acción del enemigo resueltos), los EEI/RCIC del superior y los medios de reunión asignados; deja al alumno la PICB entera: terreno (CMOC), clima, evaluación de la amenaza, cursos de acción enemigos más probable y más peligroso y plantilla de eventos.' },
    { id: 'g3', nom: 'G-3 · Operaciones', secs: ['g3'], deja: 'el análisis de la misión, los CAP, el Juego de Guerra, la decisión y su Orden con el calco',
      pide: 'las OPERACIONES: la OGO del superior trae misión, intención, concepto de la operación, tareas a las unidades subordinadas, medidas de coordinación y el calco de operaciones del superior; deja al alumno el análisis de la misión, los cursos de acción propios, el Juego de Guerra, la decisión y SU Orden de Operaciones con el calco de operaciones.' },
    { id: 'g4', nom: 'G-4 · Logística', secs: ['g4'], deja: 'la apreciación logística, las necesidades por fase, el Anexo de Logística y el calco logístico',
      pide: 'la LOGÍSTICA: el Anexo de Logística / Apoyo de Servicio de Combate del superior trae las instalaciones logísticas del superior, rutas principales de abastecimiento, niveles de abastecimiento por clase, dotaciones, mantenimiento, evacuación sanitaria y transporte, con DATOS concretos (toneladas, días de abastecimiento, capacidades), y deja al alumno la apreciación logística, el cálculo de necesidades por fase, el Anexo de Logística de su Orden y el calco logístico.' },
    { id: 'g5', nom: 'G-5 · Asuntos Civiles / Gobierno Militar', secs: ['g5'], deja: 'la apreciación de asuntos civiles, los temas y mensajes y el Anexo de Asuntos Civiles',
      pide: 'los ASUNTOS CIVILES: el Anexo de Asuntos Civiles del superior trae la situación de la población (localidades, desplazados, autoridades, recursos locales, infraestructura crítica, organismos y ONG presentes), las reglas de relación con la población y las limitaciones del superior; deja al alumno la apreciación de asuntos civiles, los temas y mensajes de información, el Anexo de Asuntos Civiles de su Orden y la coordinación civil-militar por fase.' }
  ]

  // Los anexos con que sale la OGO del escalón superior y qué sección la recibe. Las letras son
  // las usuales en la Escuela; si el reglamento vigente las ordena distinto, el profesor las
  // cambia en el pedido (la IA las respeta tal como se las dan).
  var ANEXOS_OGO = [
    { letra: 'A', nom: 'Inteligencia (con el calco de situación enemiga)', sec: 'g2' },
    { letra: 'B', nom: 'Operaciones (calco de operaciones del superior, organización de la tarea)', sec: 'g3' },
    { letra: 'C', nom: 'Apoyo de fuegos', sec: 'g3' },
    { letra: 'D', nom: 'Logística / Apoyo de Servicio de Combate (con el calco logístico)', sec: 'g4' },
    { letra: 'E', nom: 'Personal', sec: 'g1' },
    { letra: 'F', nom: 'Asuntos Civiles / Gobierno Militar', sec: 'g5' },
    { letra: 'G', nom: 'Comunicaciones (con la carta de comunicaciones)', sec: 'eme' },
    { letra: 'H', nom: 'Ingenieros (plan de barreras y obstáculos del superior)', sec: 'eme' }
  ]

  // Organizaciones TIPO para insertar de una vez en la carta (paso «Unidades»): cada pieza con
  // su designación (el %N es el número que escribe el profesor), el arma y el escalón del
  // catálogo de la Mesa, y dónde va respecto del centro (en km: x al este, y al norte). Son
  // ORGANIZACIONES GENÉRICAS de escuela, no la orgánica real de ningún ejército; el profesor
  // las ajusta ficha por ficha en 🪖 Unidades después de insertarlas.
  var ORGANIZACIONES = [
    { id: 'fftt', nom: 'FF.TT. (teatro de operaciones) · 3 Cuerpos de Ejército', escalon: 'ejercito', piezas: [
      { d: 'Cmdo. FF.TT. «%N»', arma: 'infanteria', esc: 'ejercito', x: 0, y: -40 },
      { d: 'C.E. 1', arma: 'infanteria', esc: 'cuerpo', x: -60, y: 0 }, { d: 'C.E. 2', arma: 'infanteria', esc: 'cuerpo', x: 0, y: 0 }, { d: 'C.E. 3', arma: 'infanteria', esc: 'cuerpo', x: 60, y: 0 },
      { d: 'Br. Art. FF.TT.', arma: 'artilleria', esc: 'brigada', x: -25, y: -30 }, { d: 'Br. Ing. FF.TT.', arma: 'ingenieria', esc: 'brigada', x: 25, y: -30 },
      { d: 'Br. Av. Ej. FF.TT.', arma: 'aviacion', esc: 'brigada', x: 0, y: -55 }, { d: 'Br. Log. FF.TT.', arma: 'logistica', esc: 'brigada', x: 0, y: -75 } ] },
    { id: 'ce', nom: 'Cuerpo de Ejército · 3 Divisiones', escalon: 'cuerpo', piezas: [
      { d: 'Cmdo. C.E. %N', arma: 'infanteria', esc: 'cuerpo', x: 0, y: -25 },
      { d: 'D.I. %N1', arma: 'infanteria', esc: 'division', x: -30, y: 0 }, { d: 'D.I. %N2', arma: 'infanteria', esc: 'division', x: 0, y: 0 }, { d: 'D. Mec. %N3', arma: 'mecanizada', esc: 'division', x: 30, y: 0 },
      { d: 'Br. Bl. C.E. %N', arma: 'blindada', esc: 'brigada', x: 0, y: -12 },
      { d: 'Agr. Art. C.E. %N', arma: 'artilleria', esc: 'brigada', x: -15, y: -18 }, { d: 'Agr. Ing. C.E. %N', arma: 'ingenieria', esc: 'brigada', x: 15, y: -18 },
      { d: 'B. Com. C.E. %N', arma: 'comunicaciones', esc: 'batallon', x: -6, y: -30 }, { d: 'G. D.A.A. C.E. %N', arma: 'antiaerea', esc: 'regimiento', x: 6, y: -30 },
      { d: 'Agr. Log. C.E. %N', arma: 'logistica', esc: 'brigada', x: 0, y: -40 } ] },
    { id: 'di', nom: 'División de Infantería · 3 Brigadas', escalon: 'division', piezas: [
      { d: 'Cmdo. D.I. %N', arma: 'infanteria', esc: 'division', x: 0, y: -12 },
      { d: 'Br. I. %N1', arma: 'infanteria', esc: 'brigada', x: -14, y: 0 }, { d: 'Br. I. %N2', arma: 'infanteria', esc: 'brigada', x: 0, y: 0 }, { d: 'Br. I. Mot. %N3', arma: 'motorizada', esc: 'brigada', x: 14, y: 0 },
      { d: 'R.C. %N', arma: 'caballeria', esc: 'regimiento', x: 0, y: 8 },
      { d: 'R.A. %N', arma: 'artilleria', esc: 'regimiento', x: -7, y: -8 }, { d: 'B. Ing. %N', arma: 'ingenieria', esc: 'batallon', x: 7, y: -8 },
      { d: 'B. Com. %N', arma: 'comunicaciones', esc: 'batallon', x: -4, y: -17 }, { d: 'G. D.A.A. %N', arma: 'antiaerea', esc: 'batallon', x: 4, y: -17 },
      { d: 'B. Log. %N', arma: 'logistica', esc: 'batallon', x: 0, y: -22 } ] },
    { id: 'dmec', nom: 'División Mecanizada · 2 Br. Mec. + 1 Br. Bl.', escalon: 'division', piezas: [
      { d: 'Cmdo. D. Mec. %N', arma: 'mecanizada', esc: 'division', x: 0, y: -12 },
      { d: 'Br. Mec. %N1', arma: 'mecanizada', esc: 'brigada', x: -14, y: 0 }, { d: 'Br. Mec. %N2', arma: 'mecanizada', esc: 'brigada', x: 14, y: 0 }, { d: 'Br. Bl. %N3', arma: 'blindada', esc: 'brigada', x: 0, y: -4 },
      { d: 'R.C. Mec. %N', arma: 'cabmec', esc: 'regimiento', x: 0, y: 8 },
      { d: 'R.A. Aut. %N', arma: 'artilleria', esc: 'regimiento', x: -7, y: -8 }, { d: 'B. Ing. Mec. %N', arma: 'ingenieria', esc: 'batallon', x: 7, y: -8 },
      { d: 'B. Com. %N', arma: 'comunicaciones', esc: 'batallon', x: -4, y: -17 }, { d: 'G. D.A.A. %N', arma: 'antiaerea', esc: 'batallon', x: 4, y: -17 },
      { d: 'B. Log. %N', arma: 'logistica', esc: 'batallon', x: 0, y: -22 } ] },
    { id: 'brig', nom: 'Brigada · 3 unidades de maniobra', escalon: 'brigada', piezas: [
      { d: 'Cmdo. Br. %N', arma: 'infanteria', esc: 'brigada', x: 0, y: -5 },
      { d: 'R.I. %N1', arma: 'infanteria', esc: 'regimiento', x: -6, y: 0 }, { d: 'R.I. %N2', arma: 'infanteria', esc: 'regimiento', x: 0, y: 0 }, { d: 'R.I. Mec. %N3', arma: 'mecanizada', esc: 'regimiento', x: 6, y: 0 },
      { d: 'Esc. C. %N', arma: 'caballeria', esc: 'compania', x: 0, y: 3.5 },
      { d: 'G.A. %N', arma: 'artilleria', esc: 'batallon', x: -3, y: -3.5 }, { d: 'Cía. Ing. %N', arma: 'ingenieria', esc: 'compania', x: 3, y: -3.5 },
      { d: 'Cía. Com. %N', arma: 'comunicaciones', esc: 'compania', x: -2, y: -8 }, { d: 'Cía. Log. %N', arma: 'logistica', esc: 'compania', x: 2, y: -8 } ] },
    { id: 'coe', nom: 'COE · Comando de Operaciones Especiales', escalon: 'brigada', piezas: [
      { d: 'Cmdo. COE %N', arma: 'infanteria', esc: 'brigada', x: 0, y: -5 },
      { d: 'R. F.E. %N1', arma: 'infanteria', esc: 'regimiento', x: -6, y: 0 }, { d: 'R. F.E. %N2', arma: 'infanteria', esc: 'regimiento', x: 6, y: 0 },
      { d: 'B. Aerotr. %N', arma: 'aerotransportada', esc: 'batallon', x: 0, y: 0 },
      { d: 'B. As. Aéreo %N', arma: 'aviacion', esc: 'batallon', x: 0, y: -10 },
      { d: 'Cía. Com. COE %N', arma: 'comunicaciones', esc: 'compania', x: -3, y: -8 }, { d: 'Cía. Intel. COE %N', arma: 'inteligencia', esc: 'compania', x: 3, y: -8 } ] }
  ]

  // Los pasos para ARMAR el ejercicio (modalidad Profesor), en el orden en que la Mesa los
  // necesita: el mismo orden del tablero «Mesa · Preparación del ejercicio», más el principio
  // (quién soy, para quién y qué G entreno) y el final (los documentos y el reparto). Cada paso
  // tiene su pedido a la IA (`ia`: qué se le pide; ia-profesor.js arma el texto con el
  // ejercicio) y el 4 (Orden) es el que saca la OGO completa con sus anexos.
  var PROFESOR = [
    { n: 1, carpeta: 'solucion', nom: '¿Quién soy, para quién y qué entreno?', que: 'Elegí tu escalón: vos sos el Comandante del escalón SUPERIOR y escribís la Orden que reciben tus alumnos, que son los Comandantes del escalón de abajo. Y elegí qué campo entrena el ejercicio (G-1 a G-5 o el PMTD completo): la OGO y sus anexos salen completos en lo demás y dejan el trabajo en ese campo.', escalon: true,
      ia: { tit: 'Idea del ejercicio', pide: 'Proponé la IDEA GENERAL del ejercicio: tema táctico, tipo de operación (ofensiva / defensiva / retrógrada), enemigo genérico, qué decisión tiene que tomar el alumno y qué productos se le van a corregir según el campo que entrena. En media carilla, y una lista de 5 objetivos de aprendizaje medibles.' } },
    { n: 2, nom: 'Área de Operaciones y Área de Interés', que: 'Dibujá el Área de Operaciones que les asignás a los alumnos y, más grande, el Área de Interés (sobre esa se hace el análisis del terreno).', abrir: [T('areaOps'), T('areaInteres')],
      ia: { tit: 'Área de Operaciones e Interés', pide: 'Con el terreno del ejercicio, proponé los LÍMITES del Área de Operaciones de la unidad de los alumnos (límites laterales, línea de partida / borde anterior, límite de retaguardia, profundidad) y del Área de Interés, con los accidentes del terreno que los definen (ríos, cordones, rutas, localidades) y sus coordenadas aproximadas. Justificá cada límite con la doctrina del escalón.' } },
    { n: 3, nom: 'Generar los calcos del terreno', que: 'Con el Área de Interés cargada, ⚡ Generar calcos: hidrografía, elevaciones, comunicaciones, poblaciones, vegetación. Es la base que reciben todos.', abrir: [T('generarCalcos')],
      ia: { tit: 'Calcos del terreno', pide: 'Hacé el ANÁLISIS DESCRIPTIVO del terreno del Área de Interés por calco: hidrografía (cursos de agua, ancho, vadeabilidad, puentes), relieve (alturas dominantes, pendientes, observación y campos de tiro), comunicaciones (rutas, capacidad, puntos críticos), poblaciones (tamaño, infraestructura) y vegetación (cubierta y encubrimiento). Un cuadro por calco y, al final, qué le falta al profesor completar a mano.' } },
    { n: 4, nom: 'CMOC: avenidas de aproximación y terreno clave', que: 'Sobre los calcos, el CMOC (Calco de Modificaciones y Obstáculos Combinados): terreno restringido y severamente restringido, corredores de movilidad, AVENIDAS DE APROXIMACIÓN (propias y enemigas, terrestres y aéreas), terreno clave y decisivo, obstáculos. Es lo que el G-2 de los alumnos tiene que llegar a producir; el profesor lo arma primero para saber a dónde apunta el ejercicio. Hay que haber generado los calcos antes.', abrir: [T('cmoc'), T('analisisIA')],
      ia: { tit: 'CMOC (análisis del terreno)', pide: 'Hacé el CMOC del Área de Interés: 1) terreno RESTRINGIDO y SEVERAMENTE RESTRINGIDO para la unidad y la época; 2) CORREDORES DE MOVILIDAD por escalón (dos niveles abajo de la unidad de los alumnos); 3) AVENIDAS DE APROXIMACIÓN (2 a 4) del escalón de los alumnos, propias y enemigas, cada una con su nombre, los corredores que agrupa, ancho, longitud, capacidad (qué escalón soporta), terreno restringido que la limita, observación, campos de tiro, cubierta y encubrimiento, obstáculos, y una CALIFICACIÓN con los cinco factores (OCOKA / OCECA); 4) avenidas aéreas; 5) TERRENO CLAVE y DECISIVO con el porqué; 6) OBSTÁCULOS existentes. PARTÍ DE LO QUE EL PROFESOR YA DIBUJÓ en la Mesa (en el contexto, «Terreno dibujado en la Mesa»: las áreas restringidas, los corredores —los que van sobre caminos dicen cuál—, las avenidas, el terreno clave, los obstáculos y los desplazamientos, con sus coordenadas): usá esos elementos, ponele nombre a cada uno, calificalos, decí cuál no corresponde y por qué, y agregá lo que falte. Con coordenadas aproximadas (lat, lng), para dibujarlo en el editor CMOC de la Mesa. Si el ejercicio entrena al G-2 o el PMTD completo, este análisis es la SOLUCIÓN DEL PROFESOR y no va a los alumnos.' } },
    { n: 5, carpeta: 'alumnos', nom: 'Orden del escalón superior (OGO con anexos)', que: 'Escribí la Orden que vos, como Comandante superior, le das a la unidad de los alumnos: misión, intención, tareas, limitaciones, carta, PC. Está en el tablero «Mesa · Preparación» (abajo). 🤖 La IA te arma la OGO COMPLETA con todos sus anexos según el campo que entrena el ejercicio.', abrir: [T('mesaEM')], ogo: true,
      ia: { tit: 'OGO del escalón superior con todos sus anexos', pide: '' } },
    { n: 6, nom: 'Unidades propias y enemigas', que: 'Colocá las fichas: las unidades de los alumnos (propias) y el enemigo con su escalón real. Podés INSERTAR DE UNA VEZ una organización tipo (FF.TT., Cuerpo de Ejército, División, Brigada, COE) de AZUL o de ROJO y después ajustarla ficha por ficha, o pegar las fichas que te proponga la IA.', abrir: [T('unidades'), T('tareas')], organizaciones: true,
      ia: { tit: 'Orden de batalla de los dos bandos', pide: 'Proponé el ORDEN DE BATALLA de los dos bandos para este ejercicio (si hay COE u organizaciones en la BIBLIOTECA DEL PROFESOR, usá ESAS unidades con sus designaciones y efectivos, no inventes otras): AZUL (la unidad de los alumnos con sus subordinados dos niveles abajo, refuerzos y reducciones) y ROJO (el enemigo con el escalón que la doctrina asigna frente a la unidad de los alumnos, su dispositivo inicial y sus reservas). Para cada unidad: designación, arma, escalón, bando y dónde está (lat, lng) sobre el terreno del ejercicio, coherente con las avenidas de aproximación. Devolvé ADEMÁS un bloque ```json con la lista de fichas en el formato que te doy en FORMATO DE LAS FICHAS, para pegarlo en la Mesa.' } },
    { n: 7, carpeta: 'solucion', nom: 'Situación enemiga por fases', que: 'Los cursos de acción del enemigo (el más probable y el más peligroso) por fases, y el plan de barreras si lo hay. Es lo que el G-2 de los alumnos va a tener que descubrir.', abrir: [T('caFases'), T('defensa')],
      ia: { tit: 'Cursos de acción del enemigo por fases', pide: 'Desarrollá los dos CURSOS DE ACCIÓN DEL ENEMIGO (el más probable y el más peligroso) sobre las avenidas de aproximación del CMOC (las de la CARPETA DEL PROFESOR, paso 4, con sus mismos nombres, corredores y terreno clave; si no está, las dibujadas en la Mesa), por FASES (3 a 4), cada fase con: el objetivo del enemigo, el dispositivo (qué unidad por dónde), los tiempos (D/H), los puntos de decisión del enemigo, las áreas de interés designadas y los indicadores que los alumnos deberían reunir. Si el enemigo defiende, su plan de barreras (obstáculos, fuegos, reservas). Es la SOLUCIÓN DEL PROFESOR: no va a los alumnos, se usa para corregirlos.' } },
    { n: 8, carpeta: 'alumnos', nom: 'Documentos del ejercicio', que: 'Adjuntá la situación general, la particular, los anexos y la doctrina que la IA y los alumnos van a leer. Lo que ya tenés (COE, organización y armamento del enemigo, reglamentos) va en 📚 Mis documentos, arriba de este tablero: se carga una vez y entra en todos los pedidos.', abrir: [T('ejercicio')],
      ia: { tit: 'Situación general y particular', pide: 'Escribí la SITUACIÓN GENERAL (el conflicto, los países o fuerzas ficticias, el teatro, lo que pasó hasta D-30, las fuerzas en presencia en el teatro) y la SITUACIÓN PARTICULAR (lo que ve la unidad de los alumnos: su situación a D-5, el enemigo que tiene enfrente, los vecinos, lo que recibió del superior hasta ahora), listas para adjuntar al ejercicio como documentos. Coherentes con la OGO y con el campo que entrena el ejercicio.' } },
    { n: 9, carpeta: 'solucion', nom: 'Revisar los tableros de cada sección', que: 'Los botones CMTE., JEM., G-1 a G-5 y EME. te dejan mirar y corregir lo que va haciendo cada campo.', abrir: [{ s: 'g2' }, { s: 'g3' }],
      ia: { tit: 'Pauta de corrección', pide: 'Armá la PAUTA DE CORRECCIÓN del ejercicio para el campo que entrena: qué productos tiene que entregar el alumno (por fase del PMTD), qué debe contener cada uno para estar bien hecho, los errores típicos que hay que buscar y una rúbrica (criterio · puntaje · evidencia) que sume 100 puntos. Incluí la SOLUCIÓN ESPERADA en una columna aparte para el profesor: sacala de la CARPETA DEL PROFESOR (lo marcado «🔒 SOLUCIÓN DEL PROFESOR» y lo «PARA EL PROFESOR» de cada paso, con sus puntos críticos a evaluar).' } },
    { n: 10, carpeta: 'alumnos', nom: 'Repartir el ejercicio', que: 'Cada oficial entra por SU enlace (?puesto=g2…) y ve sólo lo suyo. En la modalidad Aprendizaje, un alumno solo entra sin puesto y hace todo el PMTD.', abrir: [T('enlaces')],
      ia: { tit: 'Instrucciones para los alumnos', pide: 'Redactá las INSTRUCCIONES DEL EJERCICIO para los alumnos: situación de partida, qué rol ocupan, qué reciben (la OGO con qué anexos), qué tienen que producir y cuándo (cronograma por fase del PMTD con horas), cómo entran a la Mesa (su enlace y su puesto), qué pueden consultar y qué no, y cómo se los va a evaluar. En una carilla, en el tono de la Escuela.' } }
  ]

  return { SECCIONES: SECCIONES, HERRAMIENTAS: HERRAMIENTAS, FASES: FASES, PROFESOR: PROFESOR, ESCALONES: ESCALONES, FOCOS: FOCOS, ANEXOS_OGO: ANEXOS_OGO, ORGANIZACIONES: ORGANIZACIONES }
})
