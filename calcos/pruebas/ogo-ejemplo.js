// Un ejercicio FICTICIO para la F7·P1 ORDEN GENERAL DE OPERACIONES del G-3 (calcos/orden-operaciones), con la forma del
// CE-I (AO LAUCA) de Sergio: el concepto del CAP 1 (fixtures/concepto-ce-i.json) y sus cinco fases en la carta
// (cap-carta-ejemplo.js), la Orden superior, el CAE del G-2, la intención y los RCIC del Comandante, fuegos, recursos,
// sincronización, riesgo, limitaciones, los anexos del G-1, G-4 y G-5, y el PC del CE-I en la carta. Todo «(FICT.)».
// Lo usan orden-operaciones.mjs (Node) y e2e/orden-operaciones.cjs (Chromium).
//
//   const { ejercicioOGO, VIEJA } = require('./ogo-ejemplo.js')
//   const e = ejercicioOGO({ leerRespuesta })   // leerRespuesta de cap-propios/v1/carta-ia.mjs
//   e.datos  → el ejercicio como se guarda (para sembrarlo en la Mesa)
//   e.calco  → lo que el motor del Estado Mayor recibe del calco (sincronizarEM)
const { ejercicioConcepto, HOJA: CONCEPTO, LUGARES } = require('./concepto-ejemplo.js')
const CARTA = require('./cap-carta-ejemplo.js')

const NOMENCLATOR = LUGARES.map((l) => ({ nom: l.nom, p: l.c }))
const SIDcarta = () => ({ nomenclator: NOMENCLATOR, catalogos: { tareas: CARTA.TAREAS, obstaculos: CARTA.OBSTACULOS, tiposFuego: CARTA.TIPOS_FUEGO } })

// La hoja VIEJA de la F7·P1 (32 casillas planas): lo que escribía el 🌱 viejo (cuentas) y algo escrito por el oficial.
const VIEJA = {
  OBJETO: 'El CE-I en la defensa de área (FICT.).',
  'Organización de la tarea': 'Agrupación (OD) — 3 elemento(s) de DIV MEC-2.',
  'A.1 Maniobra': 'DIV MEC-2 (OD): Atacar con Fuego.',
  'A.2 Apoyo de fuegos': 'Medios disponibles: RES (alcance 23 km).',
  'A.2.c Medidas de coordinación de apoyo de fuegos': '18 límite(s), 15 punto(s) de coordinación y 3 punto(s) de pasaje en el calco.',
  'A.5 Ingenieros': 'Plan de barreras: 13 trabajo(s), 479 h de trabajo.',
  Misión: 'El CE-I defiende el AO LAUCA (escrito por el oficial, FICT.).',
  'A.3 Reconocimiento y vigilancia': 'La CIE-297 reconoce la AIN-3 (FICT.) [IA — verificar]',
  'A. Comando': 'Sucesión: Cmte., JEM, G-3 (FICT.).',
  'B. Comunicaciones': 'IOC «ILLIMANI» (FICT.).',
}

function ejercicioOGO({ leerRespuesta, nombre = 'PRUEBA OGO (FICT.)' } = {}) {
  if (typeof leerRespuesta !== 'function') throw new Error('ejercicioOGO: falta leerRespuesta (cap-propios/v1/carta-ia.mjs)')
  const ej = ejercicioConcepto({ nombre })
  const L = leerRespuesta(CARTA.RESPUESTA_TEXTO, { unidades: ej.unidades, ops: ej.ops, cmoc: ej.cmoc, ordenSup: ej.ordenSup, lugares: [], tareas: CARTA.TAREAS, obstaculos: CARTA.OBSTACULOS, tiposFuego: CARTA.TIPOS_FUEGO, efectos: CARTA.EFECTOS, plan: { blancos: [] } })
  const fasesCOA = { propio: L.caps[1].fases, enemigo: [] }
  const ticanani = LUGARES.find((l) => /Ticanani/i.test(l.nom)) || LUGARES[0]
  const unidades = [...ej.unidades, { id: 'pc-ce', tipo: 'pc', designacion: 'CE-I', bando: 'propias', lng: ticanani.c[0], lat: ticanani.c[1] }]
  const ordenSup = {
    ...ej.ordenSup,
    unidadPropia: 'CE-I',
    carta: 'TRITÓN, Esc. 1:250.000 (FICT.)',
    enemigo: 'La VI DE de SATURNO ataca con la 1ª Br. Ac. «CORACEROS» por el valle del río LAUCA (FICT.).',
    intencion: 'Detener a SATURNO al oeste de la LDE-2 (FICT.).',
    propias: 'FF.TT.T.O. (escalón superior). Misión: Las FF.TT.T.O. defienden entre la LDE-1 y la LDE-2 (FICT.).\nLa DIV MEC-1 defiende TAMBO QUEMADO; el CE-II retiene el eje Pisiga–Huachacalla (FICT.).',
    coordinacion: 'Fecha D: 15 de noviembre (FICT.), hora H: 0400.\nEnlace con el CE-II en el PC-3 (FICT.).',
    comunicaciones: 'IOC «ILLIMANI» en vigor desde el D-30 (0000) (FICT.).',
  }
  const g3 = {
    concepto: CONCEPTO,
    coa: { 'Denominación del CAP': 'CAP 1 — Defensa de área', 'Enunciado completo del curso de acción': 'El CE-I defiende en el AO LAUCA con la DIV MEC-2 como esfuerzo principal sobre la AA-1 (FICT.).' },
    mision: { 'ENUNCIADO COMPLETO DE LA MISIÓN': 'El CE-I defiende el AO LAUCA a partir del D (0400) hasta el D+15 (1800), reteniendo la LF «PUMA», con el propósito de impedir que SATURNO penetre hacia TURCO (FICT.).' },
    rcic: [{ 'N°': '1', 'Tipo (RCIC / EEIA)': 'EEIA', Requerimiento: 'La ubicación de la reserva (FICT.)' }],
    eventos: [{ 'N° P.D.': '1', 'Evento crítico': 'Irrupción en la AA-1', Criterio: 'el enemigo supera la LF «PUMA» con más de un batallón (FICT.)', Decisión: 'Empeñar la DIV-6 en contraataque', 'A.I.N.': 'AIN-2' }],
    fuegos: [{ Fase: 'FASE IV', Blanco: 'AB-010 en Ungallire', 'Unidad que lo bate': 'RAM-4', Tarea: 'Destruir', Propósito: 'para impedir el cruce del Lauca (FICT.)', Método: 'fuego de protección final' }],
    recursos: [
      { Recurso: 'GALM-1', 'A quién': 'DIV MEC-2', Relación: 'Refuerzo de fuegos', 'Desde qué fase': 'FASE II', Prioridad: '1' },
      { Recurso: 'RAM-4', 'A quién': 'CE-I', Relación: 'Acción de conjunto' },
    ],
    sincro: { _cols: ['FASE I', 'FASE II', 'FASE III', 'FASE IV', 'FASE V'], 'ADA.|FASE IV': 'Prioridad al PC de Ticanani (FICT.)', 'C2|FASE IV': 'Prioridad a la DIV MEC-2 (FICT.)' },
    controlOrden: {
      'Tipo de ensayo (completo · reducido · sobre maqueta · sobre carta · de mando)': 'Ensayo de comandantes sobre maqueta (FICT.)',
      'Quiénes participan del ensayo y cuándo': 'Comandantes de división, el D-5 (0900) en el PCP (FICT.)',
      'Medidas de coordinación de apoyo de fuegos (LCAF, AFP…)': 'LCAF sobre la LDE-1 desde el D (0400) (FICT.)',
    },
    limitaciones: { a: ['Emplear minas antipersonal (FICT.)', 'Contaminar el río Lauca con combustibles (FICT.)', 'Cruzar la frontera internacional (FICT.)'], b: ['Mantener el enlace con el CE-II en el PC-3 (FICT.)'] },
    riesgoFinal: [{ Peligro: 'Fratricidio en el pasaje de líneas', 'Medida de control': 'Puntos de pasaje con guías y señales de reconocimiento (FICT.)' }],
  }
  const hojasG = {
    cmte: {
      intencion: { Propósito: 'detener al primer escalón enemigo al oeste de la LDE-2 (FICT.)', 'Tareas clave': 'Fijar a la 1ª Br. Ac. al oeste de la LF «PUMA»; consolidar la ZO-1; evacuar civiles hasta el D-10', 'Estado Final Deseado': 'la 1ª Br. Ac. detenida y desgastada, la LDE-2 retenida y el CE-I listo para la Segunda Campaña (FICT.)' },
      prioridadRcic: [
        { 'Requerimiento propuesto': 'Informar cuando la DIV-6 complete su aclimatación en TURCO (FICT.)', 'Prioridad que asigna el Cmte.': '2' },
        { 'Requerimiento propuesto': '¿Por qué avenida (FICT.) empeña el enemigo su esfuerzo principal?', 'Prioridad que asigna el Cmte.': '1' },
      ],
    },
    g1: { anexo: { campos: { concepto: 'Prioridad de reemplazos a la DIV MEC-2 (FICT.)', reemplazos: '450 reemplazos el D-3 (FICT.)', ppgg: 'Puesto de reunión de PP.GG. en Toledo (FICT.)' } } },
    g4: { anexoF7P1: { campos: { concepto: '- FASE III: enfoque de apoyo en Clase IV y Clase V; prioridad a la DIV MEC-2 (FICT.).', abastecimiento: 'PD-1 en Turco (FICT.)', epa: 'Oruro–Toledo–Corque–Turco (FICT.)', epe: 'Turco–Toledo (FICT.)', segar: 'Nivel II (FICT.).' } } },
    g5: { anexo: { campos: { concepto: 'Evacuar la población de Guata antes del D-10 (FICT.)', evacuacion: 'Puesto de reunión de evacuados en Corque (FICT.)', ejes: 'Turco–Corque (FICT.)' } } },
  }
  const picb = {
    ht18: { _marca: { 'CAE-1': 'MÁS PROBABLE', 'CAE-2': 'MÁS PELIGROSO' } },
    cae: { Misión: 'La VI DE ataca a partir del D (0400) para conquistar TURCO (FICT.)', Maniobra: 'La 1ª Br. Ac. ataca por la AA-1 (valle del Lauca) con el GB N° 9 en primer escalón (FICT.)', 'Estado final deseado': 'TURCO conquistado y el CE-I destruido al oeste de la LDE-2 (FICT.)' },
    ht19: { _nom: { 'MANIOBRA|OC-1': '1ª BR. AC. «CORACEROS»' }, 'MANIOBRA|OC-1|FASE I|Tarea': 'Ataca por el valle del Lauca (FICT.)', 'MANIOBRA|OC-1|FASE I|Propósito': 'para conquistar el paso Ungallire (FICT.)' },
    ht20: [{ 'N° A.I.N.': 'AIN-3', Indicador: 'Movimiento de obuses M109 (FICT.)', 'No antes de': 'D-1', 'No después de': 'D+1' }],
  }
  const datos = { ...ej, unidades, fasesCOA, ordenSup, g3, hojasG: { ...(ej.hojasG || {}), ...hojasG }, picb: { ...(ej.picb || {}), ...picb } }
  datos.ops = { ...ej.ops, unidadConsiderada: { nombre: 'CE-I', escalon: 'cuerpo', confirmada: true } }
  const calco = { ops: datos.ops, unidades, fasesCOA, ordenSup, hojasG, g3, picb }
  return { ej, L, datos, calco, unidades, ordenSup, g3, hojasG, picb, fasesCOA }
}

module.exports = { ejercicioOGO, VIEJA, SIDcarta, NOMENCLATOR }
