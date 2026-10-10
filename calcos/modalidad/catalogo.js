/* Catálogo de la MODALIDAD de la Mesa del EM (código aparte del compilado).
   Dos cosas:
   · FASES: las 7 fases del PMTD con sus pasos EN ORDEN, tal como los numera la Visión
     Horizontal del PMTD 2020 (hoja «PMTD 2020») y los describe el texto PMTD 2017. Cada paso
     dice qué documento se elabora, quién es el responsable y, cuando la Mesa tiene esa hoja,
     dónde se abre (sección + número de hoja). Es lo que ve el ALUMNO en la modalidad
     Aprendizaje: un solo oficial hace todo el PMTD, paso a paso.
   · PROFESOR: los pasos para ARMAR un ejercicio, en orden, con la herramienta real de la Mesa
     que abre cada uno. Es lo que ve el PROFESOR en su modalidad.
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
  // 'cinta' (cualquier botón de la página).
  var HERRAMIENTAS = {
    areaOps: { nom: 'Área de Operaciones', boton: /ÁREA DE OPS/i, donde: 'barra' },
    areaInteres: { nom: 'Área de Interés', boton: /ÁREA DE INTERÉS/i, donde: 'barra' },
    generarCalcos: { nom: '⚡ Generar calcos', boton: /Generar calcos/i, donde: 'panel' },
    unidades: { nom: 'Unidades', boton: /^\W*UNIDADES$/i, donde: 'barra' },
    tareas: { nom: 'Tareas', boton: /^\W*TAREAS$/i, donde: 'barra' },
    caFases: { nom: 'C.A. por fases', boton: /C\.A\. POR FASES/i, donde: 'barra' },
    defensa: { nom: 'Defensa (plan de barreras)', boton: /^\W*DEFENSA$/i, donde: 'barra' },
    mesaEM: { nom: 'Mesa EM (Orden del escalón superior)', boton: /MESA EM|Mesa ·/i, donde: 'barra' },
    ejercicio: { nom: 'Ejercicio (documentos del ejercicio)', boton: /^\W*EJERCICIO$/i, donde: 'barra' },
    estudio: { nom: 'Estudio doctrinario', boton: /^\W*ESTUDIO$/i, donde: 'barra' },
    analisisIA: { nom: 'Análisis IA', boton: /ANÁLISIS IA/i, donde: 'barra' },
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
  var PROFESOR = [
    { n: 1, nom: '¿Quién soy y para quién armo el ejercicio?', que: 'Elegí tu escalón: vos sos el Comandante del escalón SUPERIOR y escribís la Orden que reciben tus alumnos, que son los Comandantes del escalón de abajo. Eso define a qué nivel se dibuja todo lo demás.', escalon: true },
    { n: 2, nom: 'Área de Operaciones y Área de Interés', que: 'Dibujá el Área de Operaciones que les asignás a los alumnos y, más grande, el Área de Interés (sobre esa se hace el análisis del terreno).', abrir: [T('areaOps'), T('areaInteres')] },
    { n: 3, nom: 'Generar los calcos del terreno', que: 'Con el Área de Interés cargada, ⚡ Generar calcos: hidrografía, elevaciones, comunicaciones, poblaciones, vegetación. Es la base que reciben todos.', abrir: [T('generarCalcos')] },
    { n: 4, nom: 'Orden del escalón superior', que: 'Escribí la Orden que vos, como Comandante superior, le das a la unidad de los alumnos: misión, intención, tareas, limitaciones, carta, PC. Está en el tablero «Mesa · Preparación» (abajo).', abrir: [T('mesaEM')] },
    { n: 5, nom: 'Unidades propias y enemigas', que: 'Colocá las fichas: las unidades de los alumnos (propias) y el enemigo con su escalón real.', abrir: [T('unidades'), T('tareas')] },
    { n: 6, nom: 'Situación enemiga por fases', que: 'Los cursos de acción del enemigo (el más probable y el más peligroso) por fases, y el plan de barreras si lo hay. Es lo que el G-2 de los alumnos va a tener que descubrir.', abrir: [T('caFases'), T('defensa')] },
    { n: 7, nom: 'Documentos del ejercicio', que: 'Adjuntá la situación general, la particular, los anexos y la doctrina que la IA y los alumnos van a leer.', abrir: [T('ejercicio')] },
    { n: 8, nom: 'Revisar los tableros de cada sección', que: 'Los botones CMTE., JEM., G-1 a G-5 y EME. te dejan mirar y corregir lo que va haciendo cada campo.', abrir: [{ s: 'g2' }, { s: 'g3' }] },
    { n: 9, nom: 'Repartir el ejercicio', que: 'Cada oficial entra por SU enlace (?puesto=g2…) y ve sólo lo suyo. En la modalidad Aprendizaje, un alumno solo entra sin puesto y hace todo el PMTD.', abrir: [T('enlaces')] }
  ]

  return { SECCIONES: SECCIONES, HERRAMIENTAS: HERRAMIENTAS, FASES: FASES, PROFESOR: PROFESOR, ESCALONES: ESCALONES }
})
