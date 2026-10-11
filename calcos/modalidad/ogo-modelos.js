/* 📜 LOS MODELOS DE LA OGO Y SUS ANEXOS (modalidad Profesor de la Mesa del EM). Datos puros.
   Lo pidió Sergio (11-10-2026) con el .zip «MODELOS DE CONTENIDO DE DOCUMENTOS»: «al terminar los
   pasos de Armar el ejercicio, con todo lo que se construyó en la Mesa, tiene que salir una OGO
   completa con sus anexos para darles a los alumnos… los formatos ya funcionan, pero el CONTENIDO
   que deben tener los documentos es éste… no quiero ser objeto de observaciones con órdenes mal
   hechas o incompletas».
   Cada documento trae su MODELO tal como lo da la Escuela (los párrafos en orden, con su numeración
   y lo que tiene que decir cada uno: el texto guía de los .md del paquete, resumido sin sacar
   nada). La IA escribe cada documento sobre su modelo; `obligatorios` son los títulos que la
   revisión busca en lo que contestó la IA (ogo.js · revisar).
   El formato (membrete, título, OBJETO/CARTA/ANEXOS, numeración I.- A.- 1.- a.- 1) a), firma,
   autenticación y distribución) NO está acá: lo pone el formato militar de la Mesa
   (calcos/formato-militar/v1/word.js), el mismo de todos los documentos.
   Fuentes (paquete de Sergio Morales): modelo de orden de operaciones.md · modelo calco .md ·
   anexo plan de inteligencia.md · modelo plan de apoyo de fuegos.md · modelo apedice de apoyo de
   fuegos .md · modelo plan deingenieria.md · modelo plan de apoyo de defensa ntiaerea.md ·
   modelo plan de comunicaciones.md · modelo plan de logistica.md · modelo de plan de. personal.md ·
   modelo plan de ac gm.md · modelo de plan de apoyo de servicio de combate.md · modelo plan de engaño.md */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica()
  else raiz.SIDOgoModelos = fabrica()
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  // Lo que se repite en todos los anexos (párrafos IV y V del modelo de cada uno).
  var V_CMDO_COM = 'V.- COMANDO Y COMUNICACIONES.\n  A.- Comando. — Puestos comando de la unidad o del elemento que apoya (ubicación) y lo que corresponda al anexo.\n  B.- Comunicaciones. — Lo propio del anexo o «Ver Anexo de Comunicaciones».'

  var DOCS = [
    {
      id: 'ogo', principal: true, sec: 'g3', seccion: 'EMO/SEC-III', autentica: 'G-3',
      nom: 'Orden de Operaciones (cuerpo de la OGO)', corto: 'OGO',
      fuente: 'modelo de orden de operaciones.md',
      preliminares: ['OBJETO', 'CARTA', 'ANEXOS'], organizacion: 'cuadro',
      modelo: [
        'OBJETO: el asunto en una línea («Operaciones defensivas de la …»).',
        'CARTA: la carta y su escala.',
        'ANEXOS: uno por línea, con su letra y su nombre (los de ESTA OGO, en el orden de la lista).',
        'ORGANIZACIÓN DE LA TAREA: la disposición de las fuerzas para apoyar el concepto de la operación: cada agrupación o unidad que depende directamente, con lo suyo (orgánico, agregado, bajo control operacional, en apoyo).',
        'I.- SITUACIÓN. — Lo esencial para que los comandantes subordinados comprendan la situación: qué hace o se prepara a hacer la amenaza y qué hacen o se preparan a hacer las unidades amigas.',
        '  A.- Fuerzas enemigas. — En términos de DOS escalones enemigos por debajo del propio (la División habla de compañías; el Batallón, de secciones). Remite al Anexo de Inteligencia o al resumen de inteligencia.',
        '    1.- Curso de acción más probable. — Las acciones más probables de la amenaza de principio a fin, vistas desde su lado: la tarea y el propósito de cada uno de sus elementos principales y cómo serán empleados frente a las fuerzas propias, cómo empleará sus armas de apoyo de combate, sus objetivos y su estado final deseado. Es la transcripción de lo que elaboró el G-2 en la PICB.',
        '    2.- Curso de acción más peligroso. — Lo que la amenaza es capaz de hacer y que pone en riesgo el curso de acción propio; dentro de sus capacidades y de su doctrina; con el mismo detalle.',
        '  B.- Fuerzas propias. — La misión, la intención y el concepto de la operación de DOS escalones arriba; las misiones de las unidades de los flancos y de las otras unidades cuyas acciones afectan a la unidad.',
        '  C.- Refuerzos y reducciones. — Las unidades en refuerzo o reducidas, con el lugar, la fecha y la hora en que cobra vigencia (o «Ver Organización de la Tarea»).',
        '  D.- Hipótesis. — SOLO si es PLAN de operaciones: todas las hipótesis establecidas.',
        'II.- MISIÓN. — Quién, qué, cuándo, dónde y, sobre todo, PARA QUÉ (el propósito). La misión aprobada por el Comandante: la tarea táctica esencial que cumple el propósito al menor costo.',
        'III.- EJECUCIÓN.',
        '  Intención del Comandante. — (sin número, antes de A) El propósito de la operación, el punto decisivo, las tareas clave y el estado final (fuerza propia, amenaza y terreno). Es el puente entre la misión y el concepto: no dice el «cómo».',
        '  A.- Concepto de la operación. — Cómo visualiza el Comandante las acciones de las unidades subordinadas: la operación decisiva y las de configuración, el esfuerzo principal en cada fase, las misiones de estar preparado. Si hay fases, «Fase I …», «Fase II …». Consistente con la intención de los Comandantes dos niveles arriba.',
        '    1.- Maniobra. — El esquema de maniobra, consistente con el Calco de Operaciones (se complementan, no se repiten): la operación decisiva, las de configuración, la seguridad y el empleo de la reserva.',
        '    2.- Apoyo de fuegos. — La intención del Comandante respecto de los fuegos: la tarea esencial (destruir, neutralizar, suprimir) contra una formación o función enemiga, el propósito, el método (prioridad, asignación, restricciones) y los efectos (cuantificados y observables).',
        '      a.- Apoyo aéreo. — Vuelos de apoyo aéreo cercano, de interdicción aérea y su asignación.',
        '      b.- Apoyo de artillería de campaña. — Prioridades (contrabatería, interdicción) y organización para el combate.',
        '      c.- Medidas de coordinación de apoyo de fuegos. — Las permisivas y las restrictivas.',
        '    3.- Reconocimiento y vigilancia. — El punto focal del esfuerzo de reunión y cómo complementa la maniobra; los medios y las áreas de interés nombradas (remite a la matriz de R y V del Anexo de Inteligencia).',
        '    4.- Inteligencia. — El concepto del sistema: la prioridad entre desarrollo de la situación, búsqueda de blancos y evaluación de daños; la prioridad de apoyo a las unidades y la de contrainteligencia. Remite al Anexo de Inteligencia.',
        '    5.- Ingenieros. — El propósito de los obstáculos y de los recursos de ingenieros; la prioridad del esfuerzo M/C/S (movilidad, contramovilidad, supervivencia); la prioridad de trabajo por unidad; restricciones y delegación para emplazar obstáculos. Remite al Anexo de Ingeniería.',
        '    6.- Defensa antiaérea. — El concepto en apoyo de la maniobra, el apoyo de la Fuerza Aérea, las prioridades de defensa y los niveles de alerta: ROJA, ataque inminente; AMARILLA, ataque probable; VERDE, ataque improbable.',
        '    7.- Operaciones QBN. — El concepto, las prioridades de esfuerzo y de apoyo, las unidades químicas o fumígenas.',
        '    8.- Operaciones de la Policía Militar. — El concepto, las prioridades, el plan de control de circulación y la seguridad del área de retaguardia.',
        '    9.- Operaciones de AC/GM. — El concepto y las prioridades de esfuerzo y de apoyo (remite al Anexo de AC/GM).',
        '  B.- Tareas de las unidades de maniobra. — Un subpárrafo por cada unidad que depende directamente, en el orden de la Organización de la Tarea, incluida la reserva: sus tareas (y las de estar preparado, pasaje de líneas, puntos de contacto, coordinación de flancos, evacuación de refugiados). La unidad de los alumnos, con TODO detalle.',
        '  C.- Tareas de las unidades de apoyo de combate. — Un subpárrafo por cada unidad de apoyo de combate y de apoyo de servicio de combate, en el orden de la Organización de la Tarea; solo lo que no se dice en otro lado.',
        '  D.- Instrucciones de coordinación. — Lo que aplica a dos o más unidades (lo complejo va en un anexo):',
        '    1.- Hora o condición en que la orden entra en vigor.',
        '    2.- Información esencial requerida por el Comandante (RCIC; solo acá, no en los anexos): a.- Requerimientos prioritarios de inteligencia (RPI). b.- Requerimientos de información de la fuerza amiga (RIFA).',
        '    3.- Medidas de control para la reducción de riesgos (del proceso de administración del riesgo).',
        '    4.- Reglas de enfrentamiento.',
        '    5.- Consideraciones ambientales.',
        '    6.- Protección de la fuerza.',
        '    7.- Instrucciones de coordinación adicionales.',
        '    8.- Línea avanzada de las tropas o límite de avance para el reconocimiento.',
        '    9.- Medidas de control de coordinación de apoyo de fuegos.',
        '    10.- Cuándo se lleva a cabo el ensayo.',
        '    11.- Nivel de amenaza actual en el área de retaguardia.',
        '    12.- Restricciones y definiciones no cubiertas en los párrafos anteriores.',
        'IV.- APOYO DE SERVICIO. — Remite al Anexo de Logística (o de Apoyo de Servicio de Combate). A.- Concepto de apoyo: el concepto de apoyo logístico en apoyo de la intención y del concepto de la operación; el enfoque y la prioridad de apoyo a las unidades dependientes en CADA FASE.',
        'V.- COMANDO Y COMUNICACIONES. — Remite al Anexo de Comunicaciones.',
        '  A.- Comando. — 1.- La sucesión de mando. 2.- Los puestos comando (principal, adelantado / alterno, retrasado) y las otras instalaciones de C2, con su ubicación.',
        '  B.- Comunicaciones. — 1.- La edición de las Instrucciones Operativas de Comunicación (IOC) en vigencia. 2.- La prioridad de las comunicaciones por eventos.'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'],
        ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'],
        ['Curso de acción más probable', 'curso de accion (del enemigo )?mas probable'], ['Curso de acción más peligroso', 'curso de accion (del enemigo )?mas peligroso'],
        ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'], ['C.- Refuerzos y reducciones', '(refuerzos? y reducciones|agregaciones y segregaciones)'],
        ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['Intención del Comandante', 'intencion'],
        ['A.- Concepto de la operación', 'concepto de la operacion'], ['1.- Maniobra', 'maniobra'], ['2.- Apoyo de fuegos', 'apoyo de fuegos'],
        ['3.- Reconocimiento y vigilancia', 'reconocimiento y vigilancia'], ['4.- Inteligencia', 'inteligencia$'], ['5.- Ingenieros', '(ingenieros|ingenieria)$'],
        ['6.- Defensa antiaérea', 'defensa antiaerea'], ['7.- Operaciones QBN', '(operaciones )?qbn'], ['8.- Operaciones de la Policía Militar', '(operaciones de la )?policia militar'],
        ['9.- Operaciones de AC/GM', '(operaciones de )?(ac ?/ ?gm|asuntos civiles)'],
        ['B.- Tareas de las unidades de maniobra', 'tareas (de|a) las unidades de maniobra'], ['C.- Tareas de las unidades de apoyo de combate', 'tareas (de|a) las unidades de apoyo de combate'],
        ['D.- Instrucciones de coordinación', 'instrucciones de coordinacion'],
        ['D.1.- Hora o condición en que la orden entra en vigor', 'hora o condicion'], ['D.2.- Información esencial requerida por el Comandante (RCIC)', 'informacion esencial requerida|requerimientos criticos de informacion|rcic'],
        ['D.3.- Medidas de control para la reducción de riesgos', 'medidas de control (para|de) (la )?reduccion'], ['D.4.- Reglas de enfrentamiento', 'reglas de (enfrentamiento|empenamiento)'],
        ['D.5.- Consideraciones ambientales', 'consideraciones ambientales'], ['D.6.- Protección de la fuerza', 'proteccion de la fuerza'], ['D.8.- Línea avanzada de las tropas / límite de avance', 'linea avanzada|limite de avance'],
        ['D.10.- Cuándo se lleva a cabo el ensayo', '(cuando se lleva|ensayo)'], ['D.11.- Nivel de amenaza en el área de retaguardia', 'nivel de amenaza'],
        ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones'], ['A.- Comando', 'comando$'], ['B.- Comunicaciones', 'comunicaciones$']
      ],
      // en el texto, no como título
      enTexto: [['los RPI (requerimientos prioritarios de inteligencia)', '\\brpi\\b|requerimientos prioritarios de inteligencia'], ['los RIFA (información de la fuerza amiga)', '\\brifa\\b|informacion de la fuerza amiga'], ['la sucesión de mando', 'sucesion de(l)? mando'], ['las IOC en vigencia', '\\bioc\\b|instrucciones operativas de comunicacion'], ['el estado final (en la intención)', 'estado final']],
      soloPlan: [['D.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'calco', letra: 'A', sec: 'g3', seccion: 'EMO/SEC-III', autentica: 'G-3',
      nom: 'Calco de Operaciones', asunto: 'Calco de Operaciones',
      fuente: 'modelo calco .md y «VII.- Anexo Calco de Operaciones» del modelo de orden de operaciones',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'],
      modelo: [
        'OBJETO: el asunto en una línea. · CARTA: la carta y su escala. · APÉNDICES: si los hay.',
        'El calco es un esquema de la operación sobre papel transparente (en la Mesa: lo que está dibujado en ÁREA DE OPS, MEDIDAS, TAREAS y UNIDADES, que se baja en KMZ / imagen). Sirve para reducir y aclarar la orden escrita. Símbolos del Reglamento 26-A «Signos convencionales y abreviaturas militares»; sin la simbología de las gráficas de decisión ni de tareas tácticas. Toda escritura en MAYÚSCULAS y horizontal (salvo los ejes). Técnica: RC-02-19.',
        'REFERENCIAS DEL CALCO (sin número): una línea por cosa, con su nombre y su ubicación (coordenadas lat, lng o accidente del terreno), con guiones:',
        '  - Límites (laterales, anterior, posterior).',
        '  - Ubicación de los elementos de maniobra dependientes.',
        '  - Ubicación de las reservas.',
        '  - Ubicación de la artillería y de las armas de apoyo.',
        '  - Puesto Comando principal y alterno.',
        '  - Medidas de coordinación y control propias de la operación (líneas de fase, puntos de control, objetivos, áreas de empeñamiento…).',
        '  - Ubicación del elemento de reconocimiento.',
        '  - Posiciones defensivas ocupadas o previstas.',
        '  - Si entra sin confundir: área de servicios de la GUC o trenes, rutas de abastecimiento, elementos de apoyo de combate.'
      ].join('\n'),
      obligatorios: [['REFERENCIAS DEL CALCO', 'referencias del calco']],
      enTexto: [['los límites', 'limite'], ['los elementos de maniobra', 'maniobra'], ['las reservas', 'reserva'], ['la artillería / armas de apoyo', 'artilleria|armas de apoyo'], ['los puestos comando (principal y alterno)', 'puesto comando|\\bpc\\b|\\bpcp\\b'], ['las medidas de coordinación y control', 'coordinacion|linea de fase|\\blf\\b|objetivo|punto de control'], ['el elemento de reconocimiento', 'reconocimiento']]
    },
    {
      id: 'icia', letra: 'B', sec: 'g2', seccion: 'EMO/SEC-II', autentica: 'G-2',
      nom: 'Plan de Inteligencia', asunto: 'Plan de Inteligencia / Inteligencia',
      fuente: 'anexo plan de inteligencia.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de inteligencia disponibles y asignados para apoyar la operación.',
        'I.- SITUACIÓN. — Lo de inteligencia que no cubre el párrafo I de la Orden o que conviene profundizar.',
        '  A.- Fuerzas enemigas. — Si la Orden solo remite a este anexo, acá van los cursos de acción del enemigo (1.- más probable; 2.- más peligroso); si no, remite al párrafo I de la Orden.',
        '    1.- Curso de acción del enemigo más probable.',
        '    2.- Curso de acción del enemigo más peligroso.',
        '    3.- Terreno. — Los aspectos críticos del terreno que pueden afectar las operaciones o el accionar de inteligencia.',
        '    4.- Condiciones meteorológicas. — Los aspectos críticos que pueden afectar las operaciones o el accionar de inteligencia.',
        '    5.- Capacidades del accionar de inteligencia del enemigo. — Sus recursos de inteligencia, ubicaciones y actividades conocidas (plantilla situacional) y lo que pueden afectar de las operaciones y de los medios propios de inteligencia.',
        '  B.- Fuerzas propias. — La misión y el concepto de apoyo del Plan de Inteligencia del escalón superior y de las unidades vecinas; otros medios de inteligencia que apoyan o que requieren coordinación; las unidades que no son de inteligencia pero pueden cumplir tareas de inteligencia.',
        '  C.- Refuerzos y reducciones. — Las unidades en refuerzo y las reducciones; los cambios a la organización de la tarea durante la operación.',
        'II.- MISIÓN. — La misión de inteligencia en apoyo de la Orden (quién, qué, cuándo, dónde, para qué). Ej.: «La Sec. II Icia. proporciona apoyo de Icia. a la Div-2, sincroniza y emplea todos los medios de inteligencia, vigilancia y reconocimiento disponibles, antes, durante y después de las operaciones, en toda el área de interés de la GUC, con el propósito de alcanzar el dominio informativo y proporcionar inteligencia oportuna y exacta…».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo. — Cómo apoya inteligencia la intención y el concepto de la operación (materializa el Plan de Búsqueda de Información); qué es decisivo; y EN CADA FASE: la prioridad del esfuerzo de inteligencia (qué detectar y dónde: sobre qué avenida de aproximación) y la prioridad de apoyo a las unidades (OD, OC-1, OC-2, en ese orden).',
        '  B.- Tareas para las unidades subordinadas. — Las tareas de adquisición de cada unidad de combate o apoyo de combate dependiente, según el Plan de Búsqueda (un subpárrafo por unidad), y las de la unidad de inteligencia y guerra electrónica (con sus comunicaciones especiales).',
        '  C.- Contrainteligencia. — Las instrucciones especiales de contrainteligencia (difusión limitada si hace falta).',
        '  D.- Instrucciones de coordinación.',
        '    1.- Otros requerimientos de inteligencia. — Cada requerimiento según su prioridad.',
        '    2.- Adquisición de inteligencia. — a.- Órdenes (a las unidades dependientes). b.- Pedidos (a las unidades superiores, vecinas y de cooperación).',
        '    3.- Medidas para el manejo de personal, documentos y material. — a.- Prisioneros de guerra, desertores, repatriados, habitantes y otras personas (y los puntos de reunión). b.- Documentos capturados. c.- Material capturado (qué se examina y dónde se reúne).',
        '    4.- Documentos o equipo requerido. — Fotografías aéreas, mapas, cuadros, productos de geodesia: cómo se obtienen o se piden.',
        '    5.- Distribución de los productos de inteligencia. — Informes (fecha, copias, períodos), reuniones de los oficiales de inteligencia, estudios especiales, calcos del orden de batalla.',
        'IV.- APOYO DE SERVICIO. — Lo de apoyo de servicio propio de inteligencia, o remite al párrafo IV de la Orden / Anexo de Logística.',
        V_CMDO_COM
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'],
        ['Terreno', 'terreno'], ['Condiciones meteorológicas', 'condiciones meteorologicas|cc\\.? ?mm'], ['Capacidades del accionar de inteligencia del enemigo', 'capacidades del accionar de inteligencia'],
        ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'], ['C.- Refuerzos y reducciones', 'refuerzos? y reducciones'], ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'],
        ['A.- Concepto de apoyo', 'concepto de apoyo'], ['B.- Tareas para las unidades subordinadas', 'tareas (para|a) las unidades subordinadas'], ['C.- Contrainteligencia', 'contrainteligencia'],
        ['D.- Instrucciones de coordinación', 'instrucciones de coordinacion'], ['Otros requerimientos de inteligencia', 'otros requerimientos de inteligencia'], ['Adquisición de inteligencia', 'adquisicion de inteligencia'],
        ['Manejo de personal, documentos y material', 'medidas para el manejo'], ['Documentos o equipo requerido', 'documentos o equipo'], ['Distribución de los productos de inteligencia', 'distribucion de los productos'],
        ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones'], ['A.- Comando', 'comando$'], ['B.- Comunicaciones', 'comunicaciones$']
      ]
    },
    {
      id: 'fuegos', letra: 'C', sec: 'g3', seccion: 'EM./CAF', autentica: 'CAF',
      nom: 'Plan de Apoyo de Fuegos', asunto: 'Plan de Apoyo de Fuegos / Apoyo de Fuegos',
      fuente: 'modelo plan de apoyo de fuegos.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de apoyo de fuegos disponibles y asignados (artillería, naval, apoyo aéreo).',
        'I.- SITUACIÓN. — Lo de apoyo de fuegos que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas. — El apoyo de fuego y los recursos de defensa antiaérea del enemigo en detalle: sus unidades de cohetes, cañones o misiles (orgánicas de la maniobra comprometidas o de refuerzo); todas las unidades de artillería identificadas empeñadas o de refuerzo y las que están al alcance; la cantidad de vuelos diarios posibles; un estimado de las armas QBN (cantidad, tipo, rendimiento, medios de envío), si las hay.',
        '  B.- Fuerzas propias. — El concepto de apoyo de fuegos del cuartel general superior y de las unidades adyacentes; la potencia aérea y las fuerzas navales de apoyo de fuego, si las hay.',
        '  C.- Refuerzo y reducciones. — Los recursos de apoyo de fuego agregados o bajo control operacional, y los destacados (si no están en la organización de la tarea).',
        '  D.- Hipótesis. — SOLO si es PLAN.',
        'II.- MISIÓN. — La misión de apoyo de fuegos en apoyo de la Orden. Ej.: «Los medios de apoyo de fuegos apoyan las operaciones defensivas del CE-I a partir del 150500-MAY-11, en el sector comprendido entre la LF. AZUL y CELESTE, con el propósito de impedir el ataque organizado del enemigo hacia TAMENGO».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo de fuegos. — En apoyo de la intención y del concepto de la operación; desarrolla la TAREA ESENCIAL DE APOYO DE FUEGOS POR FASE: TAREA (objetivos sobre el blanco: destruir 30 %, neutralizar 20 %, suprimir 10 %, contra la función o capacidad de una formación enemiga), PROPÓSITO (por qué contribuye a la maniobra), MÉTODO (prioridad, asignación de blancos y restricciones: la Matriz de Ejecución de Apoyo de Fuegos, MEAF) y EFECTO (mensurable, en porcentajes). Ej.: «Fase II … La tarea será destruir con nuestros fuegos al Regimiento de Guardia Avanzada del enemigo, con el propósito de… El método: prioridad para la Div-1 (operación decisiva), blancos AB-011 a AB-025, restricción AFR 1 en …. El efecto: la inutilización de tres compañías (30 %) entre la LF. MARTE y JÚPITER».',
        '  B.- Apoyo aéreo.',
        '    1.- Misión. — Ej.: «Proporciona apoyo aéreo cercano en el sector de responsabilidad del CE-I, ejecutando misiones de ametrallamiento y bombardeo a objetivos terrestres».',
        '    2.- Asignaciones. — a.- Misiones preplaneadas (cuántas y a quién). b.- Misiones inmediatas (reconocimiento aéreo y apoyo aéreo cercano por unidad, en un cuadro). c.- Diversos (fecha límite de las solicitudes, medidas de mando y control, coordinación de altitud, áreas objetivo, rutas de tránsito).',
        '  C.- Apoyo de artillería.',
        '    1.- Misión. — La misión del apoyo de fuegos de artillería (con fechas, sector y propósito).',
        '    2.- Organización para el combate. — Las unidades de artillería y su relación de apoyo (AD, AG, AG-R; ej.: «GAC-II 105 mm en AD Div-2»).',
        '    3.- Diversos. — Zonas de posiciones de fuego: a.- Posición principal. b.- Posición de cambio. c.- Posición suplementaria. d.- Medidas de coordinación y control.',
        '  D.- Instrucciones de coordinación. — Los reconocimientos; los productos de localización de blancos (normas de selección de blancos, Lista de Blancos Lucrativos —LBL—, matriz de guía de ataque); las medidas de coordinación de apoyo de fuego; las reglas de empeñamiento; la hora y los requisitos del ensayo; la asignación de blancos.',
        'IV.- APOYO DE SERVICIO. — La ubicación de los puntos de abastecimiento de munición (o el calco de instalaciones logísticas) y el régimen de abastecimiento.',
        V_CMDO_COM
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'],
        ['C.- Refuerzo y reducciones', 'refuerzos? y reducciones'], ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Concepto de apoyo de fuegos', 'concepto de apoyo( de fuegos)?'],
        ['B.- Apoyo aéreo', 'apoyo aereo'], ['Asignaciones', 'asignaciones'], ['C.- Apoyo de artillería', 'apoyo de artilleria'], ['Organización para el combate', 'organizacion para el combate'],
        ['D.- Instrucciones de coordinación', 'instrucciones de coordinacion'], ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones'], ['A.- Comando', 'comando$'], ['B.- Comunicaciones', 'comunicaciones$']
      ],
      enTexto: [['la tarea, el propósito, el método y el efecto de los fuegos', 'proposito'], ['el efecto cuantificado (%)', '\\d+ ?%']],
      soloPlan: [['D.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'fuegosArt', apendiceDe: 'fuegos', numero: '1', sec: 'g3', seccion: 'EM./Of. Art.', autentica: 'Of. Art.', opcional: true,
      nom: 'Plan de Fuegos de Artillería (apéndice del Plan de Apoyo de Fuegos)', asunto: 'Plan de Fuegos de Artillería',
      fuente: 'modelo apedice de apoyo de fuegos .md',
      preliminares: ['OBJETO', 'CARTA', 'AGREGADOS'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de apoyo de fuegos de artillería disponibles y asignados.',
        'I.- SITUACIÓN. — Lo de apoyo de fuegos que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas. — El apoyo de fuego y la defensa antiaérea del enemigo; sus unidades de cohetes, cañones o misiles; su artillería empeñada, de refuerzo y al alcance; los efectos del terreno y de las CC.MM. sobre los fuegos de artillería propios y enemigos.',
        '  B.- Fuerzas propias. — El concepto de apoyo de fuegos del cuartel general superior y de las unidades adyacentes.',
        '  C.- Refuerzo y reducciones.',
        '  D.- Hipótesis. — SOLO si es PLAN.',
        'II.- MISIÓN. — Ej.: «El GAC-II, previo REOP y fuegos de preparación por 10 min, proporciona apoyo de fuegos directo a la operación defensiva de la Div-2, a partir del D (0500) hasta el D+2 (1800) entre la LF TIGRE y TORO, con el propósito de posibilitar la canalización del Regimiento 1ro. y 2do. de ROJO hacia el AE «YUNQUE»».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo de fuegos. — La tarea esencial de apoyo de fuegos POR FASE: tarea, propósito, método (prioridad, asignación de blancos, restricciones: MEAF) y efecto (en %). Lo decisivo (p. ej. una posición de fuego que cubra las direcciones de aproximación del enemigo, con posiciones alternas).',
        '  B.- Instrucciones de coordinación. — Reconocimientos (REOP); productos de localización de blancos (normas de selección, LBL, matriz de guía de ataque); medidas de coordinación de apoyo de fuego; reglas de empeñamiento; ensayo; asignación de blancos; reglajes; fuegos de preparación; ocupación de posiciones alternas y suplementarias.',
        'IV.- APOYO DE SERVICIO. — Puntos de abastecimiento de munición y régimen de abastecimiento.',
        V_CMDO_COM
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'],
        ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Concepto de apoyo de fuegos', 'concepto de apoyo( de fuegos)?'], ['B.- Instrucciones de coordinación', 'instrucciones de coordinacion'],
        ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones']
      ],
      soloPlan: [['D.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'ing', sec: 'eme', seccion: 'EM./Of. Ing.', autentica: 'Of. Ing.',
      nom: 'Plan de Ingeniería', asunto: 'Plan de Ingeniería / Ingeniería',
      fuente: 'modelo plan deingenieria.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de ingeniería disponibles y asignados (ej.: Compañía «A» de Ingeniería de Combate: 4 Secc. Ing. Comb., 1 Secc. C y S, 1 Secc. de Franqueo, 1 Secc. Hídrica, 1 Secc. QBN).',
        'I.- SITUACIÓN. — Lo de ingeniería que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas.',
        '    1.- Obstáculos conocidos del enemigo. — Tipo, ubicación y el efecto que busca (ej.: «Faja de minas AT/AP de 50 m aprox. en Coord. 4328-4456, efecto: bloqueo por el corredor de movilidad N° 1 hacia TAMENGO»).',
        '    2.- Unidades de ingeniería enemigas. — Las identificadas y su ubicación.',
        '    3.- Terreno. — Lo crítico para los trabajos de ingeniería: obstáculos naturales (ríos, colinas, áreas anegadizas, áreas urbanas, redes camineras y ferroviarias), aptitud para excavar y para sembrar minas, camuflaje.',
        '    4.- Condiciones meteorológicas. — Lo crítico para el apoyo y los trabajos de ingeniería.',
        '    5.- Capacidades del accionar de ingeniería del enemigo. — Lo que sus recursos de ingeniería le permiten (plantilla situacional).',
        '  B.- Fuerzas propias. — El concepto de apoyo de ingeniería del cuartel general superior y de las unidades vecinas.',
        '  C.- Refuerzo y reducciones. — Los recursos de ingeniería agregados o bajo control operacional, y los destacados.',
        '  D.- Hipótesis. — SOLO si es PLAN.',
        'II.- MISIÓN. — Ej.: «La Comp. «A» de Ing. Comb. proporciona apoyo de ingeniería de combate a las operaciones defensivas de la Div-2, a partir del D-3 (0400) hasta el D+5 (1800) en el área de operaciones, con el propósito de obligar a dos regimientos de infantería mecanizada del enemigo a dirigirse por la avenida de aproximación N° 2 posibilitando su destrucción en el AE «MÁRMOL»».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo. — En apoyo de la intención y del concepto de la operación de la unidad de maniobra; con las MISMAS fases. Lo decisivo (ej.: instalar fajas de minas AP/AT desde … hasta … e integrarlas al plan de fuegos). EN CADA FASE: la prioridad del esfuerzo M/C/S (personal y equipo) y la prioridad de trabajo (qué unidades reciben apoyo, en orden). El estado final del apoyo.',
        '  B.- Tareas a las unidades subordinadas. — Las tareas de cada elemento de ingenieros en apoyo de la maniobra (1.- 1ra. Sección de Ing. Comb. … 4.- Sección Hídrica: reconocimiento, captación, purificación y distribución de agua. 5.- Sección QBN: áreas de descontaminación). Sin sobrepasar su capacidad.',
        '  C.- Instrucciones de coordinación. — La hora o el evento en que rigen las medidas de control de obstáculos; los requisitos de inteligencia de la unidad apoyada; los informes; las líneas de tiempo de los trabajos de contramovilidad y supervivencia; otros.',
        'IV.- APOYO DE SERVICIO. — Lo propio de ingeniería, en especial abastecimiento de Clase II, IV y V: A.- Abastecimiento (por clase: instalaciones, forma de distribución —a cuenta propia, a domicilio o mixta—, prioridades). B.- Evacuación y hospitalización (a cargo de la unidad apoyada). C.- Servicios (Sección C y S).',
        'V.- COMANDO Y COMUNICACIONES.\n  A.- Comando. — PCA y PCP de la unidad de ingenieros; PP.CC.SS.\n  B.- Comunicaciones. — «Ver Anexo de Comunicaciones».'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['Obstáculos conocidos del enemigo', 'obstaculos (conocidos )?del enemigo'],
        ['Unidades de ingeniería enemigas', 'unidades de ingenieria'], ['Terreno', 'terreno'], ['Condiciones meteorológicas', 'condiciones meteorologicas|cc\\.? ?mm'], ['Capacidades del accionar de ingeniería del enemigo', 'capacidades del accionar de ingenieria'],
        ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'], ['C.- Refuerzo y reducciones', 'refuerzos? y reducciones'], ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Concepto de apoyo', 'concepto de apoyo'],
        ['B.- Tareas a las unidades subordinadas', 'tareas (para|a) las unidades subordinadas'], ['C.- Instrucciones de coordinación', 'instrucciones de coordinacion'], ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'],
        ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones'], ['A.- Comando', 'comando$'], ['B.- Comunicaciones', 'comunicaciones$']
      ],
      enTexto: [['la prioridad del esfuerzo M/C/S', 'movilidad|contramovilidad|contra movilidad|supervivencia|m ?/ ?c ?/ ?s']],
      soloPlan: [['D.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'ada', sec: 'eme', seccion: 'EM./Of. ADA', autentica: 'Of. ADA',
      nom: 'Plan de Apoyo de Defensa Antiaérea', asunto: 'Plan de Apoyo de Defensa Antiaérea / Apoyo de Defensa Antiaérea',
      fuente: 'modelo plan de apoyo de defensa ntiaerea.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de apoyo de defensa antiaérea disponibles y asignados.',
        'I.- SITUACIÓN. — Lo de defensa antiaérea que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas.',
        '    1.- Terreno. — Las rutas aéreas de entrada y salida más probables del enemigo.',
        '    2.- Condiciones meteorológicas. — Las que restringen las capacidades aéreas del enemigo.',
        '    3.- Capacidad y/o actividad aérea del enemigo. — a.- Información de amenaza aérea (organizaciones con capacidad aérea, vectores por número y tipo). b.- Información adicional (proporción de vuelos, elementos aéreos bajo mando de unidades terrestres, material, preferencias de objetivos, táctica, actividades recientes, amenaza de misiles balísticos). c.- Avenidas de aproximación aéreas (todas, con el vector que puede usarlas, los puntos de partida y cómo pasan por el área de interés).',
        '  B.- Fuerzas propias. — La misión de ADA en todos los niveles y cómo se integra en los planes del superior. 1.- Concepto de ADA del escalón superior. 2.- Concepto de ADA de las unidades vecinas.',
        '  C.- Refuerzo y reducciones. — Los recursos de ADA agregados, bajo control operacional o destacados.',
        '  D.- Hipótesis. — SOLO si es PLAN (desde el punto de vista de ADA).',
        'II.- MISIÓN. — Enfocada en acciones ofensivas antiaéreas, acciones defensivas antiaéreas (medidas activas y pasivas) o supresión de las defensas antiaéreas del enemigo. Ej.: «El Sistema de ADA realiza acciones defensivas antiaéreas, a partir del D-6 (0400) hasta el D+3 (2000), en el Área de Operaciones de la Div-2, con el propósito de garantizar la ejecución de las operaciones defensivas de la Div-2 de las amenazas aéreas del enemigo».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo. — El tipo de defensa antiaérea (de área o de punto aislado), la tarea y el propósito del sistema de ADA, sus posiciones y las prioridades EN CADA FASE del concepto de la operación (ej.: «Fase I Desplazamiento de la ZR hasta las posiciones defensivas, del D-6 (0400) al D-3 (2000): el sistema de ADA destruye los vectores aéreos de reconocimiento o bombardeo, con el propósito de…, se ubica en …, con prioridad a la AT «LANZA» (OC-1)»).',
        '  B.- Tareas de las unidades subordinadas de ADA. — Una por unidad del sistema.',
        '  C.- Instrucciones de coordinación. — Normas de hostilidad (identificación de vectores amigos y enemigos); reglas de empeñamiento; uso de las medidas de coordinación de apoyo de fuego; defensa antiaérea pasiva (para todas las unidades); nivel de alerta (ROJA: ataque inminente; AMARILLA: ataque probable; VERDE: ataque improbable).',
        'IV.- APOYO DE SERVICIO. — Puntos de abastecimiento de munición (o calco de instalaciones logísticas) y régimen de abastecimiento.',
        V_CMDO_COM
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['Terreno', 'terreno'], ['Condiciones meteorológicas', 'condiciones meteorologicas|cc\\.? ?mm'],
        ['Capacidad y/o actividad aérea del enemigo', 'capacidad (y ?/ ?o actividad )?aerea|actividad aerea'], ['Avenidas de aproximación aéreas', 'avenidas de aproximacion aereas'],
        ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'], ['C.- Refuerzo y reducciones', 'refuerzos? y reducciones'], ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Concepto de apoyo', 'concepto de apoyo'],
        ['B.- Tareas de las unidades subordinadas de ADA', 'tareas (de|a) las unidades subordinadas'], ['C.- Instrucciones de coordinación', 'instrucciones de coordinacion'], ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'],
        ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones']
      ],
      enTexto: [['el nivel de alerta (ROJA / AMARILLA / VERDE)', 'alerta (roja|amarilla|verde)'], ['el tipo de defensa (de área / de punto aislado)', 'defensa de (area|punto)']],
      soloPlan: [['D.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'com', sec: 'eme', seccion: 'EM./Of. Com.', autentica: 'Of. Com.',
      nom: 'Plan de Comunicaciones', asunto: 'Plan de Comunicaciones / Comunicaciones',
      fuente: 'modelo plan de comunicaciones.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de comunicaciones disponibles y asignados (ej.: Compañía «A» de Comunicaciones: Sección de Operaciones de Comando, Sección de Comunicaciones Adelantada, Sección C y S).',
        'I.- SITUACIÓN. — Lo de comunicaciones que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas.',
        '    1.- Terreno. — Lo crítico del terreno para el despliegue de los sistemas de comunicaciones.',
        '    2.- Condiciones meteorológicas. — Lo crítico de las CC.MM. para el despliegue de los sistemas.',
        '    3.- Capacidades de guerra electrónica del enemigo. — Las que afectan los sistemas de comunicaciones.',
        '  B.- Fuerzas propias. — Remite a la Orden; las medidas de contraguerra electrónica que impone el comando superior; la designación y ubicación de otros recursos de comunicaciones que apoyan al escalón superior o podrían apoyar a la unidad.',
        '  C.- Refuerzo y reducciones. — Los recursos de comunicaciones agregados, bajo control operacional o destacados.',
        '  D.- Hipótesis. — SOLO si es PLAN.',
        'II.- MISIÓN. — Ej.: «La Compañía de Comunicaciones, previa instalación, mantenimiento y operación de sus medios, proporciona apoyo de comunicaciones a la operación defensiva de la Div-2, a partir del día D hora H en el área de operaciones, con el propósito de facilitar la acción del comando y control…».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo. — En apoyo de la intención y del concepto de la operación, con las MISMAS fases. Cómo se estructura el enfoque de apoyo y el estado final del apoyo. EN CADA FASE: comando y control (puestos comando y centros de comunicaciones que se instalan), comunicaciones (medios que se instalan y dónde: puestos de transmisión, medios alámbricos, mensajeros, ópticos, radio como medio principal) y guerra electrónica (medios, tarea y propósito); la prioridad de los sistemas (C4IR, maniobra, apoyo de fuegos, ADA, inteligencia, SAC, MCM…).',
        '  B.- Tareas a las unidades subordinadas. — Las de cada elemento de comunicaciones (1.- Sección Operaciones de Comando: centros de comunicaciones. 2.- Sección Comunicaciones Adelantada: estaciones de transmisión. 3.- Sección Comando y Servicio: abastecimiento de Clase III y IV de comunicaciones).',
        '  C.- Instrucciones de coordinación. — Lo crítico que no está en la Orden; la hora o los eventos clave para los procedimientos de control de comunicaciones (ej.: «En eficiencia el D-28 hora H»; «Dar estricto cumplimiento a las IOC e IPC «ARRAYÁN» a partir del D hora H»).',
        'IV.- APOYO DE SERVICIO. — Remite al Anexo de Logística / Apoyo de Servicio de Combate.',
        'V.- COMANDO Y COMUNICACIONES.\n  A.- Comando. — PCA, PCP, PCR, PP.CC.SS.\n  B.- Comunicaciones. — 1.- IEC / IOC en vigor desde … 2.- Guerra electrónica: puesto de análisis, de perturbación, de atenuación (dónde). 3.- Centros de comunicaciones (adelantado, principal, retrasado, dónde). 4.- Medios inalámbricos (radio): el equipo con que se cuenta.'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['Terreno', 'terreno'], ['Condiciones meteorológicas', 'condiciones meteorologicas|cc\\.? ?mm'],
        ['Capacidades de guerra electrónica del enemigo', 'capacidades (de guerra electronica|del accionar)'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'], ['C.- Refuerzo y reducciones', 'refuerzos? y reducciones'],
        ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Concepto de apoyo', 'concepto de apoyo'], ['B.- Tareas a las unidades subordinadas', 'tareas (para|a) las unidades subordinadas'],
        ['C.- Instrucciones de coordinación', 'instrucciones de coordinacion'], ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones'], ['A.- Comando', 'comando$'], ['B.- Comunicaciones', 'comunicaciones$']
      ],
      enTexto: [['la guerra electrónica', 'guerra electronica'], ['los centros de comunicaciones', 'centro(s)? de comunicaciones']],
      soloPlan: [['D.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'log', sec: 'g4', seccion: 'EMO/SEC-IV', autentica: 'G-4',
      nom: 'Plan de Logística', asunto: 'Plan de Logística / Logística',
      fuente: 'modelo plan de logistica.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos logísticos disponibles y asignados.',
        'I.- SITUACIÓN. — Lo de logística que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas. — Remite al Anexo de Inteligencia.',
        '    1.- Terreno. — Lo crítico para las operaciones logísticas: los obstáculos y la disponibilidad y el estado de los corredores y avenidas de aproximación que sirven de ejes de abastecimiento y evacuación.',
        '    2.- Condiciones meteorológicas. — Lo crítico para el apoyo logístico (temperatura, precipitaciones, neblina…).',
        '    3.- Capacidades del accionar de logística del enemigo. — Sus recursos de apoyo logístico (compañías de mantenimiento, abastecimiento, intendencia…), ubicaciones y actividades conocidas.',
        '  B.- Fuerzas propias. — La misión y el concepto de apoyo logístico del escalón superior y de las unidades vecinas.',
        '  C.- Hipótesis. — SOLO si es PLAN: las hipótesis del campo logístico.',
        'II.- MISIÓN. — Ej.: «La Sección IV (Logística) planifica, prepara, coordina y dirige las operaciones de apoyo logístico a las operaciones defensivas de la Div-2 a partir del D (0600) hasta el D+8 (1800) en su área de operaciones, con el propósito de mantener a las unidades en las mejores condiciones de empleo, satisfaciendo sus necesidades de vida y de combate».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo. — En apoyo de la intención y del concepto de la operación: lo decisivo (articulación de las instalaciones y puestos de distribución, flujo logístico, integridad de los abastecimientos) y, EN CADA FASE (con sus fechas D/H), el ENFOQUE del apoyo (transporte, abastecimiento de Clase I, IV, V…) y la PRIORIDAD de apoyo a las unidades (AT «…» (OD), AT «…» (OC-1)…, en ese orden).',
        'IV.- APOYO LOGÍSTICO.',
        '  A.- Abastecimiento. — Por clase (1.- Clase I. 2.- Clase II. 3.- Clase III. 4.- Clase IV. 5.- Clase V.), cada una con a.- Instalaciones (puntos de distribución o de abastecimiento: dónde, o «Ver calco»), b.- Forma de distribución (a cuenta propia, a domicilio, mixta), c.- Prioridades. 6.- Nivel de abastecimiento (operativo: 3 días; de seguridad: 1 día). 7.- EPA y ESA (ejes principal y secundario de abastecimiento). Si cambia en alguna fase, decirlo.',
        '  B.- Evacuación y hospitalización. — 1.- Norma de evacuación y hospitalización (de los puestos de socorro de las AA.TT.: 24 h; de los PP.EE.CC.DD. de la GUC: 48 h). 2.- Instalaciones (puesto de socorro, puesto de evacuación y clasificación divisionario, hospitales: dónde). 3.- Evacuaciones terrestres (unidad responsable, EPE y ESE). 4.- Evacuaciones aéreas (si hay y en qué casos).',
        '  C.- Transporte. — Instalaciones y prioridades de transporte.',
        '  D.- Mantenimiento. — Instalaciones y prioridades de mantenimiento.',
        '  E.- Servicios. — Trenes de combate y de campaña de las PP.UU.; Área de Servicio Divisionario (dónde).',
        '  F.- Diversos. — 1.- Límites de retaguardia. 2.- Seguridad en el área de retaguardia (SEGAR) y control de daños de área (CDA). 3.- Partes e informes. 4.- Pedidos. 5.- Otros.',
        'V.- COMANDO Y COMUNICACIONES.\n  A.- Comando.\n  B.- Comunicaciones.'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['Terreno', 'terreno'], ['Condiciones meteorológicas', 'condiciones meteorologicas|cc\\.? ?mm'],
        ['Capacidades del accionar de logística del enemigo', 'capacidades (del accionar de logistica|logisticas)'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'], ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'],
        ['A.- Concepto de apoyo', 'concepto de apoyo'], ['IV.- APOYO LOGÍSTICO', 'apoyo logistico'], ['A.- Abastecimiento', 'abastecimiento$'], ['Clase I', 'clase i$'], ['Clase III', 'clase iii'], ['Clase V', 'clase v$'],
        ['Nivel de abastecimiento', 'nivel(es)? de abastecimiento'], ['B.- Evacuación y hospitalización', 'evacuacion y hospitalizacion'], ['C.- Transporte', 'transporte'], ['D.- Mantenimiento', 'mantenimiento'], ['E.- Servicios', 'servicios$'],
        ['F.- Diversos', 'diversos'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones']
      ],
      enTexto: [['el EPA (eje principal de abastecimiento)', '\\bepa\\b|eje principal de abastecimiento'], ['el EPE (eje principal de evacuación)', '\\bepe\\b|eje principal de evacuacion'], ['la prioridad de apoyo por fase', 'prioridad']],
      soloPlan: [['C.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'per', sec: 'g1', seccion: 'EMO/SEC-I', autentica: 'G-1',
      nom: 'Plan de Personal', asunto: 'Plan de Personal / Personal',
      fuente: 'modelo de plan de. personal.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de personal disponibles y asignados.',
        'I.- SITUACIÓN. — Lo de personal que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas. — Remite al Anexo de Inteligencia.',
        '  B.- Fuerzas propias. — Remite a la Orden.',
        '  C.- Hipótesis. — SOLO si es PLAN: las hipótesis del campo de personal.',
        'II.- MISIÓN. — Ej.: «La Sección I proporciona apoyo de personal a las operaciones defensivas de la Div-2, a partir de este momento hasta el D+6 (1800) y después de la operación, en su sector defensivo, con el propósito de mantener la eficiencia combativa de la unidad y posibilitar el cumplimiento de operaciones futuras con orden».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo. — En apoyo de la intención y del concepto de la operación: lo decisivo; la ARTICULACIÓN de las instalaciones de personal con su ubicación y su propósito (PC adelantado, principal y retrasado; puesto de reunión de prisioneros de guerra; puesto de reunión de muertos; servicios de personal —postal, pagaduría, banda, religioso, especiales, auxiliar femenino, reemplazos, policía militar—; línea de extraviados y puesto de reunión de extraviados; puesto de control de tránsito); y la PRIORIDAD de apoyo de reemplazos a las unidades EN CADA FASE.',
        'IV.- APOYO DE PERSONAL.',
        '  A.- Mantenimiento de efectivos. — 1.- Efectivos (informes diarios: hora y corte de datos; IPP cada 7 días). 2.- Reemplazos (desde cuándo y cuántos).',
        '  B.- Administración de personal. — 1.- Procedimientos de personal (ascensos, recompensas). 2.- Prisioneros de guerra (batallón de PM a cargo, dónde; prohibido emplearlos como MOC). 3.- Personal civil (empleo de MOC).',
        '  C.- Mantenimiento de la disciplina, ley y orden. — Instalaciones disciplinarias, empleo de la PM, mercado negro.',
        '  D.- Incremento de la moral. — 1.- Moral. 2.- Servicios de personal (centro de descanso y recreación, oficina postal, correspondencia). 3.- Registro de sepulturas, entierros y efectos personales (cementerio, entierro y registro).',
        '  E.- Administración interna del PC o CG. — Ubicación, funcionamiento, movimiento del PC.',
        '  F.- Diversos.',
        'V.- COMANDO Y COMUNICACIONES.\n  A.- Comando.\n  B.- Comunicaciones.'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'],
        ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Concepto de apoyo', 'concepto de apoyo'], ['IV.- APOYO DE PERSONAL', 'apoyo de personal'],
        ['A.- Mantenimiento de efectivos', 'mantenimiento de (los )?efectivos'], ['Reemplazos', 'reemplazos'], ['B.- Administración de personal', 'administracion de personal'], ['Prisioneros de guerra', 'prisioneros de guerra'],
        ['C.- Disciplina, ley y orden', '(mantenimiento de la )?disciplina'], ['D.- Incremento de la moral', 'incremento de la moral|moral$'], ['Registro de sepulturas', 'registro de sepulturas|sepulturas'],
        ['E.- Administración interna del PC', 'administracion interna'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones']
      ],
      soloPlan: [['C.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'acgm', sec: 'g5', seccion: 'EMO/SEC-V', autentica: 'G-5',
      nom: 'Plan de AC/GM', asunto: 'Plan de AC/GM / AC/GM',
      fuente: 'modelo plan de ac gm.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos de AC/GM (compañía de AC/GM, equipos funcionales).',
        'I.- SITUACIÓN. — Lo de AC/GM que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas. — Remite al Anexo de Inteligencia.',
        '  B.- Fuerzas propias. — Remite a la Orden.',
        '  C.- Hipótesis. — SOLO si es PLAN.',
        'II.- MISIÓN. — Ej.: «La Sec. V AC/GM proporciona apoyo de AC/GM a las operaciones defensivas del CE-II y evita la interferencia civil en las operaciones militares de esta GUC, antes, durante y después, en su área de operaciones, con el propósito de dar continuidad a la política de Asuntos Civiles del escalón superior».',
        'III.- EJECUCIÓN.',
        '  A.- Concepto de apoyo. — En apoyo de la intención y del concepto de la operación: lo decisivo (p. ej. la evacuación de la población civil entre la LF … y … antes del D-20); los equipos funcionales que se organizan; el ENFOQUE de cada función (gobierno, economía, servicios públicos esenciales —SS.PP.EE.—, servicios especiales) con su prioridad de esfuerzo; y el apoyo EN CADA FASE (cuándo empieza y termina, enfoque, eje de evacuación EPE, dónde opera cada equipo, su tarea y propósito).',
        '  B.- Tareas para los equipos funcionales. — Por función: 1.- Gobierno (seguridad pública, control de la población, salud pública…). 2.- Economía (abastecimiento civil, recursos locales…). 3.- SS.PP.EE. (transporte público…). 4.- Servicios especiales (evacuación…). Cada equipo con sus tareas concretas.',
        '  C.- Instrucciones de coordinación. — Lo común a más de un equipo funcional (ACNUR y ONG, responsabilidad sobre los evacuados, conducta con la población, desde cuándo operan, coordinación con la PM y la Policía Nacional, toque de queda).',
        'IV.- APOYO DE SERVICIO. — Remite al Anexo de Logística o extrae lo pertinente para AC/GM.',
        'V.- COMANDO Y COMUNICACIONES.\n  A.- Comando.\n  B.- Comunicaciones.'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'],
        ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Concepto de apoyo', 'concepto de apoyo'], ['B.- Tareas para los equipos funcionales', 'tareas (para|a) los equipos funcionales'],
        ['C.- Instrucciones de coordinación', 'instrucciones de coordinacion'], ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones']
      ],
      enTexto: [['las funciones (gobierno, economía, SS.PP.EE., servicios especiales)', 'gobierno'], ['la evacuación de la población', 'evacuacion']],
      soloPlan: [['C.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'asc', sec: 'g4', seccion: 'EMO/SEC-IV', autentica: 'G-4', opcional: true,
      nom: 'Plan de Apoyo de Servicio de Combate (logística + personal + AC/GM en uno)', asunto: 'Plan de Apoyo de Servicio de Combate / Apoyo de Servicio de Combate',
      fuente: 'modelo de plan de apoyo de servicio de combate.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Lo elabora el G-4; el G-1 y el G-5 le dan lo de su campo. Reemplaza a los planes de Logística, Personal y AC/GM por separado.',
        'Organización de la Tarea: los recursos disponibles y asignados para el apoyo de servicio de combate.',
        'I.- SITUACIÓN. — Lo de apoyo de servicio de combate que no cubre el párrafo I de la Orden.',
        '  A.- Fuerzas enemigas. — Remite al Anexo de Inteligencia. 1.- Terreno (obstáculos, corredores y avenidas que sirven de ejes de abastecimiento y evacuación). 2.- Condiciones meteorológicas (movilidad y supervivencia). 3.- Capacidades logísticas del enemigo.',
        '  B.- Fuerzas propias. — La misión y el concepto de apoyo de servicio de combate del superior y de las unidades vecinas.',
        '  C.- Hipótesis. — SOLO si es PLAN.',
        'II.- MISIÓN. — Ej.: «Los elementos de apoyo de servicio de combate de la Div-1 proporcionan apoyo logístico, de personal y de AC/GM, a partir del D-5 (2000) hasta el D+6 (1800) en el área de operaciones de la GUC, con el propósito de mantener la eficiencia y las condiciones de empleo…».',
        'III.- EJECUCIÓN.',
        '  A.- Logística. — 1.- Concepto de apoyo (lo decisivo; por fase: enfoque y prioridad de apoyo). 2.- Funciones logísticas: a.- Abastecimiento (Clase I a V: instalaciones, forma de distribución, prioridades; nivel de abastecimiento; EPA y ESA). b.- Evacuación y hospitalización (normas, instalaciones, EPE/ESE, evacuación aérea). c.- Transporte. d.- Mantenimiento. e.- Servicios. f.- Seguridad en el área de retaguardia (SEGAR) y control de daños de área (CDA).',
        '  B.- Personal. — 1.- Concepto de apoyo (articulación de las instalaciones de personal con ubicación y propósito; prioridad de reemplazos por fase). 2.- Funciones de personal: mantenimiento de efectivos, administración de personal (prisioneros de guerra, personal civil), disciplina, ley y orden, incremento de la moral (servicios de personal), administración interna del PC o CG.',
        '  C.- Asuntos Civiles y Gobierno Militar. — Si la GUC tiene responsabilidad de AC/GM (si no, se omite): 1.- Concepto de apoyo (enfoque de las funciones y prioridad de esfuerzo de los equipos, por fase).',
        'IV.- COMANDO Y COMUNICACIONES.\n  A.- Comando.\n  B.- Comunicaciones.'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'],
        ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['A.- Logística', 'logistica$'], ['Concepto de apoyo', 'concepto de apoyo'], ['Funciones logísticas', 'funciones logisticas'],
        ['B.- Personal', 'personal$'], ['Funciones de personal', 'funciones de personal'], ['COMANDO Y COMUNICACIONES', 'comando y comunicaciones']
      ],
      soloPlan: [['C.- Hipótesis', 'hipotesis']]
    },
    {
      id: 'engano', sec: 'g3', seccion: 'EMO/SEC-III', autentica: 'G-3', opcional: true,
      nom: 'Plan de Engaño', asunto: 'Plan de Engaño / Engaño',
      fuente: 'modelo plan de engaño.md',
      preliminares: ['OBJETO', 'CARTA', 'APÉNDICES'], organizacion: 'lista',
      modelo: [
        'Organización de la Tarea: los recursos disponibles y asignados para la operación de engaño.',
        'I.- SITUACIÓN.',
        '  A.- Fuerzas enemigas. — Remite al Anexo de Inteligencia o resume lo del enemigo que importa para el engaño.',
        '  B.- Fuerzas propias. — Remite al párrafo I de la Orden o resume lo propio que importa para el engaño.',
        '  C.- Hipótesis. — SOLO si es PLAN.',
        'II.- MISIÓN. — Ej.: «La Div-2 ejecuta operaciones de engaño, a partir del 240400-JUN-11 en su sector de responsabilidad, con el propósito de confundir y engañar al enemigo sobre nuestro verdadero dispositivo y obligarlo a adoptar decisiones erróneas».',
        'III.- EJECUCIÓN.',
        '  Intención. — (sin número) La intención del Comandante respecto del engaño.',
        '  A.- Concepto de engaño. — En apoyo de la intención y del concepto de la operación: lo decisivo y la oportunidad en que participa cada sistema operativo, con su tarea y su propósito (unidades: posiciones simuladas y puestos de observación; inteligencia: información falsa —calcos, órdenes—; ingeniería: asesoramiento técnico; comunicaciones: emisiones y medidas de guerra electrónica).',
        '  B.- Tareas a las unidades subordinadas. — Las tareas y su oportunidad para cada unidad que participa (solo lo que no está en el concepto).',
        '  C.- Instrucciones de coordinación. — 1.- Medidas de control para la reducción del riesgo. 2.- Requerimientos críticos de información del Comandante (RIFA). 3.- Otros (quién conoce el engaño: solo el personal que lo ejecuta).',
        'IV.- APOYO DE SERVICIO. — Remite al Anexo de Apoyo de Servicio.',
        'V.- COMANDO Y COMUNICACIONES. — Remite al párrafo V de la Orden.'
      ].join('\n'),
      obligatorios: [
        ['Organización de la Tarea', 'organizacion de la tarea'], ['I.- SITUACIÓN', 'situacion'], ['A.- Fuerzas enemigas', 'fuerzas enemigas'], ['B.- Fuerzas propias', 'fuerzas (propias|amigas)'],
        ['II.- MISIÓN', 'mision$'], ['III.- EJECUCIÓN', 'ejecucion$'], ['Intención', 'intencion'], ['A.- Concepto de engaño', 'concepto de(l)? engano'], ['B.- Tareas a las unidades subordinadas', 'tareas (para|a) las unidades subordinadas'],
        ['C.- Instrucciones de coordinación', 'instrucciones de coordinacion'], ['IV.- APOYO DE SERVICIO', 'apoyo de servicio'], ['V.- COMANDO Y COMUNICACIONES', 'comando y comunicaciones']
      ],
      soloPlan: [['C.- Hipótesis', 'hipotesis']]
    }
  ]

  return { DOCS: DOCS }
})
