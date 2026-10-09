// La Orden de Reconocimiento del ejemplo de la Escuela (DIV.MEC.-2, «06. ORDEN DE
// RECONOCIMIENTO»), cargada en la hoja F2·P9 con el esquema reconocimiento-v1, y la
// misma hoja como la guardaba la Mesa antes (la matriz de renglones). Para las pruebas.
const P6 = {
  esquema: 'reconocimiento-v1',
  numero: '01',
  objeto: 'Reconocimiento del AO de la DIV.MEC.-2 entre la LF. «TRUENO» y la LS.',
  carta: 'Especial Oruro, Esc. 1:250.000',
  anexos: '“A” Calco de reconocimiento.',
  equipos: [
    {
      id: 'e1',
      nombre: 'ZULU',
      elementos: ['SECC. AV 2', 'SECC. IM-2'],
      obtener: [
        'Actividades de reconocimiento por parte de elementos de ROJO. Estado de transitabilidad y sostenimiento de los caminos.',
        'Unidades de Apoyo de fuegos.',
        'Posibles zonas de emplazamiento de rojo.',
        'Detalle de los Equipos de Comunicación y/o Radares de Vigilancia.',
      ],
    },
    {
      id: 'e2',
      nombre: 'TANGO',
      elementos: ['OA. REAM-3', 'OA. RAAM-7', 'EQ. COMP. ING.-3'],
      obtener: [
        'Profundidad, ancho y cauce de los cursos de agua.',
        'Terreno favorable para la instalación de obstáculos de Contra Movilidad.',
        'Ubicación de obstáculos naturales.',
        'Zonas favorables para la organización de las posiciones defensivas.',
        'Identificación de terrenos claves, defendibles y áreas de empeño.',
        'Elevaciones importantes de la zona para la instalación de Observadores adelantados.',
      ],
    },
    {
      id: 'e3',
      nombre: 'VICTOR',
      elementos: ['ERM/8', 'ERM/9'],
      obtener: [
        'Zonas favorables para la maniobra de las UU. Mecanizadas y blindadas.',
        'Determinar los puntos de vadeo y pasaje para las RCB, RCM.',
        'Población civil que se encuentra en la zona.',
        'Principales poblaciones dentro de la zona.',
        'Capacidad de sostenimiento de la población. (Agua – Infraestructura – Evacuados – PP.GG)',
        'Pendientes o perfiles de las elevaciones.',
        'Configuración del terreno.',
        'Pasos obligados.',
        'Áreas con características para Áreas de Empeño.',
      ],
    },
  ],
  enemiga: 'Ver Orden Preparatoria 01/21 y Anexo de ICIA.',
  propia: 'La DIV.MEC-2 se encuentra en su actual ZR “ORURO” realizando actividades de alistamiento y preparación para conducir operaciones defensivas, con sus efectivos al completo.',
  mision:
    'Los EQUIPOS “ZULU”, “TANGO” y “VICTOR” de la DIMEC-2 CE-I, ejecutarán un reconocimiento a partir del día D-90 (1000) hasta el día D-89 (1800) en el AO de la DIMEC-2, entre la LF. “TRUENO” y la LS, con el propósito de obtener información sobre el enemigo, terreno y CC.MM. a fin de coadyuvar a las actividades de planeamiento del CE-I.',
  objetivo: 'Obtener información sobre las características del terreno y CC.MM., entre la LF. “TRUENO” y la LS; así como información sobre las actividades, dispositivo, composición y fuerza de las fuerzas de la DE-II de ROJO.',
  metodo: 'El reconocimiento a realizarse será a través de la técnica de Observación y Vigilancia a Corto y Largo Alcance, asimismo la indagación, el tipo de reconocimiento será de ruta, zona y área.',
  formaIntro: 'Para el reconocimiento se emplearán los siguientes medios:',
  medios: ['Movimiento Motorizado.', 'Movimiento helitransportado, previa coordinación con el G.C.Ae', 'Movimiento a pie sobre las áreas críticas y áreas posibles a ser empleadas como empeño.'],
  plazos: 'Duración del reconocimiento 32 hrs.',
  coordinacion: [
    'Máxima coordinación durante el Desplazamiento entre los equipos.',
    'En caso de ataque dar parte inmediatamente al PC.',
    'Máxima coordinación entre el equipo de seguridad y reconocimiento durante el reconocimiento.',
    'Coordinar con el GCAé., para el reconocimiento aéreo.',
    'Los reconocimientos deben obtener toda la información que sea posible de los factores METTT-CE que afectan al desarrollo de las operaciones.',
    'Se deberá dar parte por radio sobre las novedades existentes.',
    'Se deberá hacer llegar el Informe de Reconocimiento escrito al Comando de la DIVMEC-2 el D-89 (2330).',
  ],
  abastecimientos: ['Al completo en las diferentes clases.', 'Clase I para 2 días de Operación.'],
  transporte: 'Se emplearán los medios orgánicos de la DIMEC-2, para ejecutar la operación.',
  comando: ['PCI: ORURO.'],
  comunicaciones: ['IEC. “CORRE CAMINOS” en vigor.', 'Máximo empleo de medios radio de los vehículos.', 'Está autorizado el empleo de telefonía fija y móvil existente en la zona.'],
  ideas: '',
  firma: 'EL COMANDANTE DE LA DIMEC-2',
}

// La F2·P9 como la guardaba la Mesa antes (la matriz que se ve en la captura de Sergio).
const MATRIZ_ANTES = [
  {
    'Órgano de reconocimiento': 'RCB-2 Tarapacá [IA — verificar]',
    Tarea: 'Ejecutar reconocimientos y proporcionar seguridad adelantada para detectar los escalones de avance de la División Acorazada enemiga. [IA — verificar]',
    'Área / objetivo a reconocer': 'Línea de Seguridad y sectores de aproximación norte en el Área de Operaciones. [IA — verificar]',
    'Alcance del medio': '30 km — Escuadrón de reconocimiento (del Regimiento) [IA — verificar]',
    'No antes de': 'D-13 (06:00) [IA — verificar]',
    'No después de': 'D (01:00) [IA — verificar]',
    'Dónde informa': 'PC de la DIV.MEC.-1 — G-2 [IA — verificar]',
  },
  {
    'Órgano de reconocimiento': 'FT VARGS (RCB-1 Calama) [IA — verificar]',
    Tarea: 'Mantener vigilancia activa y asegurar la reserva para el contraataque mecanizado en el Área de Empeño Vulcan. [IA — verificar]',
    'Área / objetivo a reconocer': 'Retaguardia táctica y sectores de despliegue en Arhuanamina. [IA — verificar]',
    'Alcance del medio': '30 km — Agrupación táctica blindada [IA — verificar]',
    'No antes de': 'D-15 (23:00) [IA — verificar]',
    'No después de': 'D+2 (17:00) [IA — verificar]',
    'Dónde informa': 'PC de la DIV.MEC.-1 — G-3 [IA — verificar]',
  },
  {
    'Órgano de reconocimiento': 'Comp. Av. Ejto. Cnl. Lopez [IA — verificar]',
    Tarea: 'Ejecutar vuelos de reconocimiento aéreo y enlace. [IA — verificar]',
    'Área / objetivo a reconocer': 'Ejes de aproximación AA-1 a AA-5 y zonas de apresto lejano. [IA — verificar]',
    'Alcance del medio': '50 km — Aviación de Ejército (bajo control) [IA — verificar]',
    'No antes de': 'D-15 (23:00) [IA — verificar]',
    'No después de': 'D+2 (18:00) [IA — verificar]',
    'Dónde informa': 'PC de la DIV.MEC.-1 — G-3 [IA — verificar]',
  },
]

const CFG = {
  superior: 'CE-I',
  unidad: 'DIV.MEC.-2',
  seccion: 'EMO/SEC-III',
  expedicion: 4,
  iniciales: 'AVV',
  lugar: 'ORURO',
  fechaHora: 'D-90 (0830)',
  titulo: 'ORDEN DE RECONOCIMIENTO',
  numero: '01',
  nivel: 'principal',
  jem: 'VMV',
  autenticador: 'G-3',
  inicialesAut: 'AVV',
  firma: 'EL COMANDANTE DE LA DIMEC-2',
  distribucion: 'Original: DIV.MEC.-2\nCopia 1: SEC-III\nCopia 2-4: EQ. Z-T-V',
}

// Ejercicio FICTICIO para la prueba en la Mesa (Chromium): el de la matriz de riesgo, con
// la unidad considerada confirmada, una Orden Preparatoria, la carta de la orden, un
// escuadrón de reconocimiento en el calco y la F2·P9 guardada como la matriz de antes.
function ejercicioReconocimiento() {
  const { ejercicioRiesgo } = require('./riesgo-ejercicio.js')
  const d = ejercicioRiesgo()
  d.nombre = 'PRUEBA RECONOCIMIENTO (FICT.)'
  d.unidades = [...d.unidades, { id: 'r-eco', bando: 'propias', tipo: 'unidad', designacion: 'ERM-8 «ECO» (FICT.)', arma: 'caballeria', escalon: 'compania', recon: true, lat: -16.85, lng: -68.35, piezas: 1 }]
  d.ordenSup = { ...d.ordenSup, carta: 'Especial PUEBLO-X (FICT.), Esc. 1:250.000' }
  d.ops = { ...d.ops, unidadConsiderada: { nombre: 'DIV.MEC.-1 (FICT.)', escalon: 'division', confirmada: true } }
  d.g3 = { ...d.g3, prep1: { 'I.- SITUACIÓN · A. Fuerzas enemigas': 'Brigada blindada roja (FICT.) al norte del AO.' }, ivr: MATRIZ_ANTES.map((f) => ({ ...f })) }
  return d
}

// Lo que contestaría una IA: la orden en el JSON del pedido. Los dos primeros equipos son
// los de la matriz de antes (por su "id"); el tercero, el escuadrón que se trajo del
// calco (por su elemento).
function respuestaIA() {
  return {
    numero: '01',
    objeto: 'Reconocimiento del AO. PUEBLO-X (FICT.) entre la LF. «TRUENO» y la LS.',
    carta: 'Otra carta que NO debe pisar la de la orden',
    anexos: '“A” Calco de reconocimiento.',
    equipos: [
      { id: 'e-antes-1', nombre: 'ZULU', elementos: ['RCB-2 Tarapacá'], obtener: ['Actividades de reconocimiento de ROJO (FICT.) sobre la LS.', 'Estado de transitabilidad de los caminos del sector norte (FICT.).'] },
      { id: 'e-antes-2', nombre: 'TANGO', obtener: ['Profundidad, ancho y cauce del río X (FICT.).', 'Terreno favorable para obstáculos de contramovilidad (FICT.).'] },
      { nombre: 'Victor', elementos: ['ERM-8 «ECO» (FICT.)'], noAntes: 'D-6 (0600)', noDespues: 'D-5 (1800)', informa: 'PC de la DIV.MEC.-1 (FICT.) (G-2)', obtener: ['Población civil en la zona (FICT.).', 'Pasos obligados (FICT.).'] },
    ],
    situacion: { enemiga: 'Texto de la IA que NO debe pisar la referencia a la Orden Preparatoria.', propia: 'Texto de la IA que NO debe pisar lo que escribió el oficial.' },
    mision: 'Los EQUIPOS «ZULU», «TANGO» y «VICTOR» de la DIV.MEC.-1 (FICT.) ejecutarán un reconocimiento a partir del D-6 (0600) hasta el D-5 (1800) en el AO. PUEBLO-X (FICT.), entre la LF. «TRUENO» y la LS, con el propósito de obtener información sobre el enemigo, el terreno y las CC.MM.',
    plan: { objetivo: 'Obtener información sobre el terreno y las CC.MM. entre la LF. «TRUENO» y la LS (FICT.).', metodo: 'Observación y vigilancia a corto y largo alcance; reconocimiento de ruta, zona y área.' },
    formaDeLlegar: { intro: 'Para el reconocimiento se emplearán los siguientes medios:', medios: ['Movimiento motorizado.', 'Movimiento a pie sobre las áreas críticas.'] },
    plazos: 'Duración del reconocimiento 36 hrs.',
    coordinacion: ['En caso de ataque dar parte inmediatamente al PC.', 'Se deberá hacer llegar el Informe de Reconocimiento escrito al D-5 (2330).'],
    apoyo: { abastecimientos: ['Al completo en las diferentes clases.', 'Clase I para 2 días de operación.'], transporte: 'Se emplearán los medios orgánicos de la DIV.MEC.-1 (FICT.).' },
    comando: ['PC: PUEBLO-X (FICT.).'],
    comunicaciones: ['IEC «FICT.» en vigor.', 'Máximo empleo de medios radio de los vehículos.'],
  }
}

module.exports = { P6, MATRIZ_ANTES, CFG, ejercicioReconocimiento, respuestaIA }
